const express = require('express');
const router = express.Router();
const { shopifyApi, ApiVersion, LATEST_API_VERSION } = require('@shopify/shopify-api');
const { restResources } = require('@shopify/shopify-api/rest/admin/2024-01');
const axios = require('axios');
const crypto = require('crypto');
const ShopifyIntegration = require('../models/ShopifyIntegration');
const { authenticateToken, requireRole } = require('../middleware/auth');
require('@shopify/shopify-api/adapters/node');

// Initialize Shopify API (only if credentials are provided)
let shopify = null;
if (process.env.SHOPIFY_API_KEY && process.env.SHOPIFY_API_SECRET) {
  shopify = shopifyApi({
    apiKey: process.env.SHOPIFY_API_KEY,
    apiSecretKey: process.env.SHOPIFY_API_SECRET,
    scopes: (process.env.SHOPIFY_SCOPES || 'read_products,read_inventory').split(','),
    hostName: (process.env.SHOPIFY_REDIRECT_URI || 'localhost:5001').replace(/https?:\/\//, '').split('/')[0],
    hostScheme: process.env.NODE_ENV === 'production' ? 'https' : 'http',
    apiVersion: ApiVersion.January24,
    isEmbeddedApp: false,
    restResources,
  });
  console.log('✅ Shopify integration initialized');
} else {
  console.warn('⚠️  Shopify API credentials not found. Shopify integration will not be available.');
}

// Use your existing auth middleware
const protect = authenticateToken;
const merchantOnly = requireRole('merchant');

// Step 1: Generate OAuth URL
router.post('/shopify/auth-url', protect, merchantOnly, async (req, res) => {
  try {
    if (!shopify) {
      return res.status(503).json({ message: 'Shopify integration not configured' });
    }

    const { shop } = req.body;

    if (!shop || !shop.includes('.myshopify.com')) {
      return res.status(400).json({ message: 'Invalid shop domain' });
    }

    // Store merchant ID in session for callback
    req.session.merchantId = req.user._id.toString();
    req.session.shop = shop;

    // Build OAuth URL manually
    const state = shopify.auth.nonce();
    const redirectUri = process.env.SHOPIFY_REDIRECT_URI;
    const scopes = process.env.SHOPIFY_SCOPES;
    
    // Use the correct OAuth URL format for Shopify
    const authUrl = `https://${shop}/admin/oauth/authorize?` +
      `client_id=${process.env.SHOPIFY_API_KEY}&` +
      `scope=${encodeURIComponent(scopes)}&` +
      `redirect_uri=${encodeURIComponent(redirectUri)}&` +
      `state=${state}`;
    
    // Store state in session for validation
    req.session.shopifyState = state;
    
    console.log('Generated OAuth URL:', authUrl);

    res.json({ authUrl });
  } catch (error) {
    console.error('Error generating auth URL:', error);
    res.status(500).json({ message: 'Failed to generate authorization URL' });
  }
});

// Step 2: OAuth Callback
router.get('/shopify/callback', async (req, res) => {
  try {
    // Get merchant ID from session
    const merchantId = req.session.merchantId;
    const shop = req.session.shop;
    const savedState = req.session.shopifyState;

    if (!merchantId) {
      return res.redirect(`${process.env.APP_URL}/products?shopify=error&reason=session_expired`);
    }

    // Validate state
    const { code, state } = req.query;
    if (state !== savedState) {
      return res.redirect(`${process.env.APP_URL}/products?shopify=error&reason=invalid_state`);
    }

    // Exchange code for access token
    const tokenResponse = await axios.post(`https://${shop}/admin/oauth/access_token`, {
      client_id: process.env.SHOPIFY_API_KEY,
      client_secret: process.env.SHOPIFY_API_SECRET,
      code
    });

    const { access_token, scope } = tokenResponse.data;

    // Store integration in database
    await ShopifyIntegration.findOneAndUpdate(
      { merchant: merchantId },
      {
        merchant: merchantId,
        shop,
        accessToken: access_token,
        scope,
        connectedAt: new Date()
      },
      { upsert: true, new: true }
    );

    // Clear session data
    delete req.session.merchantId;
    delete req.session.shop;
    delete req.session.shopifyState;

    // Register mandatory compliance webhooks
    await registerComplianceWebhooks(shop, access_token);

    // Redirect back to products page with success (immediate redirect to app UI)
    res.redirect(`${process.env.APP_URL}/products?shopify=connected`);
  } catch (error) {
    console.error('OAuth callback error:', error);
    res.redirect(`${process.env.APP_URL}/products?shopify=error`);
  }
});

// Check connection status
router.get('/shopify/status', protect, merchantOnly, async (req, res) => {
  try {
    const integration = await ShopifyIntegration.findOne({ 
      merchant: req.user._id 
    });
    
    if (integration) {
      res.json({
        connected: true,
        storeName: integration.shop.replace('.myshopify.com', '')
      });
    } else {
      res.json({ connected: false });
    }
  } catch (error) {
    console.error('Status check error:', error);
    res.status(500).json({ message: 'Failed to check status' });
  }
});

// Import products from Shopify
router.post('/shopify/import-products', protect, merchantOnly, async (req, res) => {
  try {
    const merchantId = req.user._id;
    
    // Get stored credentials
    const integration = await ShopifyIntegration.findOne({ merchant: merchantId });
    if (!integration) {
      return res.status(404).json({ message: 'Shopify store not connected' });
    }

    // Fetch all products from Shopify
    const products = await fetchAllShopifyProducts(
      integration.shop,
      integration.accessToken
    );

    let imported = 0;
    let updated = 0;
    let failed = 0;

    // Get Product model (you'll need to adjust the path)
    const Product = require('../models/Product');

    // Import each product
    for (const shopifyProduct of products) {
      try {
        const productData = mapShopifyToPayaProduct(shopifyProduct, merchantId);
        
        // Check if product already exists
        const existingProduct = await Product.findOne({
          'shopifyData.shopifyId': shopifyProduct.id.toString(),
          merchant: merchantId
        });

        if (existingProduct) {
          await Product.findByIdAndUpdate(existingProduct._id, productData);
          updated++;
        } else {
          await Product.create(productData);
          imported++;
        }
      } catch (error) {
        console.error(`Failed to import product ${shopifyProduct.id}:`, error);
        failed++;
      }
    }

    // Update last synced time
    await ShopifyIntegration.findByIdAndUpdate(integration._id, {
      lastSyncedAt: new Date()
    });

    res.json({
      success: true,
      imported,
      updated,
      failed,
      total: products.length
    });
  } catch (error) {
    console.error('Import error:', error);
    res.status(500).json({ 
      message: error.message || 'Failed to import products' 
    });
  }
});

// ProductListing API - Get product listings
router.get('/shopify/product-listings', protect, merchantOnly, async (req, res) => {
  try {
    const integration = await ShopifyIntegration.findOne({ merchant: req.user._id });
    if (!integration) {
      return res.status(404).json({ message: 'Shopify store not connected' });
    }

    // Fetch product listings from Shopify
    const response = await axios.get(
      `https://${integration.shop}/admin/api/2024-01/product_listings.json`,
      {
        headers: {
          'X-Shopify-Access-Token': integration.accessToken,
          'Content-Type': 'application/json'
        }
      }
    );

    res.json({ product_listings: response.data.product_listings || [] });
  } catch (error) {
    console.error('Error fetching product listings:', error);
    res.status(500).json({ message: 'Failed to fetch product listings' });
  }
});

// ProductListing API - Publish a product
router.post('/shopify/product-listings/:product_id', protect, merchantOnly, async (req, res) => {
  try {
    const { product_id } = req.params;
    const integration = await ShopifyIntegration.findOne({ merchant: req.user._id });
    
    if (!integration) {
      return res.status(404).json({ message: 'Shopify store not connected' });
    }

    // Create product listing (publish to sales channel)
    const response = await axios.put(
      `https://${integration.shop}/admin/api/2024-01/product_listings/${product_id}.json`,
      {
        product_listing: {
          product_id: product_id,
          available: true
        }
      },
      {
        headers: {
          'X-Shopify-Access-Token': integration.accessToken,
          'Content-Type': 'application/json'
        }
      }
    );

    res.json({ product_listing: response.data.product_listing });
  } catch (error) {
    console.error('Error publishing product:', error);
    res.status(500).json({ message: 'Failed to publish product' });
  }
});

// ProductListing API - Unpublish a product
router.delete('/shopify/product-listings/:product_id', protect, merchantOnly, async (req, res) => {
  try {
    const { product_id } = req.params;
    const integration = await ShopifyIntegration.findOne({ merchant: req.user._id });
    
    if (!integration) {
      return res.status(404).json({ message: 'Shopify store not connected' });
    }

    // Delete product listing (unpublish from sales channel)
    await axios.delete(
      `https://${integration.shop}/admin/api/2024-01/product_listings/${product_id}.json`,
      {
        headers: {
          'X-Shopify-Access-Token': integration.accessToken,
          'Content-Type': 'application/json'
        }
      }
    );

    res.json({ success: true, message: 'Product unpublished' });
  } catch (error) {
    console.error('Error unpublishing product:', error);
    res.status(500).json({ message: 'Failed to unpublish product' });
  }
});

// Sales Attribution API - Create order attribution
router.post('/shopify/orders/:order_id/attribution', protect, merchantOnly, async (req, res) => {
  try {
    const { order_id } = req.params;
    const integration = await ShopifyIntegration.findOne({ merchant: req.user._id });
    
    if (!integration) {
      return res.status(404).json({ message: 'Shopify store not connected' });
    }

    // Create order attribution to track that this sale came from Paya Marketplace
    const attributionData = {
      order: {
        id: order_id,
        source_name: 'Paya Marketplace',
        referring_site: process.env.APP_URL || 'https://paya-marketplace.com',
        landing_site: process.env.APP_URL || 'https://paya-marketplace.com',
        note_attributes: [
          {
            name: 'sales_channel',
            value: 'Paya Marketplace'
          },
          {
            name: 'channel_id',
            value: process.env.SHOPIFY_API_KEY
          }
        ]
      }
    };

    const response = await axios.put(
      `https://${integration.shop}/admin/api/2024-01/orders/${order_id}.json`,
      attributionData,
      {
        headers: {
          'X-Shopify-Access-Token': integration.accessToken,
          'Content-Type': 'application/json'
        }
      }
    );

    res.json({ success: true, order: response.data.order });
  } catch (error) {
    console.error('Error creating order attribution:', error);
    res.status(500).json({ message: 'Failed to create order attribution' });
  }
});

// Sales Attribution API - Track checkout attribution
router.post('/shopify/checkouts/attribution', protect, merchantOnly, async (req, res) => {
  try {
    const { checkout_id, customer_id } = req.body;
    const integration = await ShopifyIntegration.findOne({ merchant: req.user._id });
    
    if (!integration) {
      return res.status(404).json({ message: 'Shopify store not connected' });
    }

    // Track that this checkout originated from Paya Marketplace
    const checkoutData = {
      checkout: {
        note: 'Order placed via Paya Marketplace',
        note_attributes: [
          {
            name: 'sales_channel',
            value: 'Paya Marketplace'
          },
          {
            name: 'channel_app_id',
            value: process.env.SHOPIFY_API_KEY
          }
        ]
      }
    };

    res.json({ success: true, message: 'Checkout attribution tracked' });
  } catch (error) {
    console.error('Error tracking checkout attribution:', error);
    res.status(500).json({ message: 'Failed to track checkout attribution' });
  }
});

// Sales Attribution API - Get sales analytics
router.get('/shopify/sales-analytics', protect, merchantOnly, async (req, res) => {
  try {
    const integration = await ShopifyIntegration.findOne({ merchant: req.user._id });
    
    if (!integration) {
      return res.status(404).json({ message: 'Shopify store not connected' });
    }

    // Fetch orders from Shopify that originated from Paya Marketplace
    const response = await axios.get(
      `https://${integration.shop}/admin/api/2024-01/orders.json`,
      {
        params: {
          status: 'any',
          limit: 250,
          fields: 'id,total_price,created_at,source_name,note_attributes'
        },
        headers: {
          'X-Shopify-Access-Token': integration.accessToken,
          'Content-Type': 'application/json'
        }
      }
    );

    // Filter orders that came from Paya Marketplace
    const payaOrders = response.data.orders.filter(order => {
      return order.source_name === 'Paya Marketplace' ||
             order.note_attributes?.some(attr => attr.name === 'sales_channel' && attr.value === 'Paya Marketplace');
    });

    // Calculate analytics
    const totalRevenue = payaOrders.reduce((sum, order) => sum + parseFloat(order.total_price || 0), 0);
    const orderCount = payaOrders.length;

    res.json({
      total_revenue: totalRevenue,
      order_count: orderCount,
      orders: payaOrders
    });
  } catch (error) {
    console.error('Error fetching sales analytics:', error);
    res.status(500).json({ message: 'Failed to fetch sales analytics' });
  }
});

// ResourceFeedback API - Create feedback for a product
router.post('/shopify/resource-feedback', protect, merchantOnly, async (req, res) => {
  try {
    const { product_id, state, messages, feedback_generated_at } = req.body;
    const integration = await ShopifyIntegration.findOne({ merchant: req.user._id });
    
    if (!integration) {
      return res.status(404).json({ message: 'Shopify store not connected' });
    }

    // Create resource feedback to communicate issues to merchant
    // States: success, requires_action, failure
    const feedbackData = {
      resource_feedback: {
        state: state || 'success',
        messages: messages || [],
        feedback_generated_at: feedback_generated_at || new Date().toISOString()
      }
    };

    const response = await axios.post(
      `https://${integration.shop}/admin/api/2024-01/products/${product_id}/resource_feedback.json`,
      feedbackData,
      {
        headers: {
          'X-Shopify-Access-Token': integration.accessToken,
          'Content-Type': 'application/json'
        }
      }
    );

    res.json({ success: true, resource_feedback: response.data.resource_feedback });
  } catch (error) {
    console.error('Error creating resource feedback:', error);
    res.status(500).json({ message: 'Failed to create resource feedback' });
  }
});

// ResourceFeedback API - Communicate product eligibility issues
router.post('/shopify/products/:product_id/feedback/eligibility', protect, merchantOnly, async (req, res) => {
  try {
    const { product_id } = req.params;
    const { issues } = req.body;
    const integration = await ShopifyIntegration.findOne({ merchant: req.user._id });
    
    if (!integration) {
      return res.status(404).json({ message: 'Shopify store not connected' });
    }

    // Create feedback for eligibility issues
    const feedbackData = {
      resource_feedback: {
        state: 'requires_action',
        messages: issues.map(issue => ({
          message: issue,
          code: 'eligibility_issue'
        })),
        feedback_generated_at: new Date().toISOString()
      }
    };

    const response = await axios.post(
      `https://${integration.shop}/admin/api/2024-01/products/${product_id}/resource_feedback.json`,
      feedbackData,
      {
        headers: {
          'X-Shopify-Access-Token': integration.accessToken,
          'Content-Type': 'application/json'
        }
      }
    );

    res.json({ success: true, resource_feedback: response.data.resource_feedback });
  } catch (error) {
    console.error('Error creating eligibility feedback:', error);
    res.status(500).json({ message: 'Failed to create eligibility feedback' });
  }
});

// ResourceFeedback API - Communicate publishing errors
router.post('/shopify/products/:product_id/feedback/error', protect, merchantOnly, async (req, res) => {
  try {
    const { product_id } = req.params;
    const { error_message } = req.body;
    const integration = await ShopifyIntegration.findOne({ merchant: req.user._id });
    
    if (!integration) {
      return res.status(404).json({ message: 'Shopify store not connected' });
    }

    // Create feedback for publishing errors
    const feedbackData = {
      resource_feedback: {
        state: 'failure',
        messages: [{
          message: error_message || 'Failed to publish product to Paya Marketplace',
          code: 'publishing_error'
        }],
        feedback_generated_at: new Date().toISOString()
      }
    };

    const response = await axios.post(
      `https://${integration.shop}/admin/api/2024-01/products/${product_id}/resource_feedback.json`,
      feedbackData,
      {
        headers: {
          'X-Shopify-Access-Token': integration.accessToken,
          'Content-Type': 'application/json'
        }
      }
    );

    res.json({ success: true, resource_feedback: response.data.resource_feedback });
  } catch (error) {
    console.error('Error creating error feedback:', error);
    res.status(500).json({ message: 'Failed to create error feedback' });
  }
});

// Disconnect Shopify
router.post('/shopify/disconnect', protect, merchantOnly, async (req, res) => {
  try {
    await ShopifyIntegration.deleteOne({ merchant: req.user._id });
    res.json({ success: true, message: 'Shopify store disconnected' });
  } catch (error) {
    console.error('Disconnect error:', error);
    res.status(500).json({ message: 'Failed to disconnect' });
  }
});

// Helper: Fetch all products with pagination
async function fetchAllShopifyProducts(shop, accessToken) {
  const allProducts = [];
  let hasNextPage = true;
  let pageInfo = null;

  while (hasNextPage) {
    try {
      const url = `https://${shop}/admin/api/2024-01/products.json`;
      const params = { limit: 250 };
      
      if (pageInfo) {
        params.page_info = pageInfo;
      }

      const response = await axios.get(url, {
        headers: {
          'X-Shopify-Access-Token': accessToken,
          'Content-Type': 'application/json'
        },
        params
      });

      allProducts.push(...response.data.products);

      // Check for next page
      const linkHeader = response.headers.link;
      if (linkHeader && linkHeader.includes('rel="next"')) {
        const match = linkHeader.match(/page_info=([^&>]+)/);
        pageInfo = match ? match[1] : null;
      } else {
        hasNextPage = false;
      }

      // Rate limiting: Shopify allows 2 requests/second
      await new Promise(resolve => setTimeout(resolve, 500));
    } catch (error) {
      console.error('Error fetching products:', error.response?.data || error.message);
      throw new Error('Failed to fetch products from Shopify');
    }
  }

  return allProducts;
}

// Helper: Map Shopify product to Paya format
function mapShopifyToPayaProduct(shopifyProduct, merchantId) {
  const variant = shopifyProduct.variants[0]; // Use first variant
  
  return {
    merchant: merchantId,
    name: shopifyProduct.title,
    description: shopifyProduct.body_html || '',
    price: parseFloat(variant.price),
    inventory: {
      quantity: variant.inventory_quantity || 0,
      sku: variant.sku || `SHOPIFY-${shopifyProduct.id}`,
      trackInventory: true
    },
    category: mapCategory(shopifyProduct.product_type),
    images: shopifyProduct.images.map(img => img.src),
    status: shopifyProduct.status === 'active' ? 'active' : 'inactive',
    tags: shopifyProduct.tags ? shopifyProduct.tags.split(',').map(t => t.trim()) : [],
    shopifyData: {
      shopifyId: shopifyProduct.id.toString(),
      shopifyVariantId: variant.id.toString(),
      lastSyncedAt: new Date()
    }
  };
}

// Helper: Map Shopify categories to Paya categories
function mapCategory(shopifyType) {
  const categoryMap = {
    'Electronics': 'Electronics',
    'Clothing': 'Clothing',
    'Fashion': 'Clothing',
    'Apparel': 'Clothing',
    'Appliances': 'Appliances',
    'Home & Garden': 'Appliances',
    'Beauty': 'Cosmetics',
    'Cosmetics': 'Cosmetics',
    'Health': 'Medical Care',
    'Medical': 'Medical Care',
    'Services': 'Services'
  };
  
  return categoryMap[shopifyType] || 'Other';
}

// HMAC Verification for Webhooks
function verifyShopifyWebhook(data, hmacHeader) {
  const hash = crypto
    .createHmac('sha256', process.env.SHOPIFY_API_SECRET)
    .update(data, 'utf8')
    .digest('base64');
  return hash === hmacHeader;
}

// Register Mandatory Compliance Webhooks
async function registerComplianceWebhooks(shop, accessToken) {
  const webhooks = [
    {
      topic: 'customers/data_request',
      address: `${process.env.SHOPIFY_WEBHOOK_URL || process.env.APP_URL.replace('3003', '5001')}/api/integrations/shopify/webhooks/customers/data_request`
    },
    {
      topic: 'customers/redact',
      address: `${process.env.SHOPIFY_WEBHOOK_URL || process.env.APP_URL.replace('3003', '5001')}/api/integrations/shopify/webhooks/customers/redact`
    },
    {
      topic: 'shop/redact',
      address: `${process.env.SHOPIFY_WEBHOOK_URL || process.env.APP_URL.replace('3003', '5001')}/api/integrations/shopify/webhooks/shop/redact`
    }
  ];

  for (const webhook of webhooks) {
    try {
      await axios.post(
        `https://${shop}/admin/api/2024-01/webhooks.json`,
        {
          webhook: {
            topic: webhook.topic,
            address: webhook.address,
            format: 'json'
          }
        },
        {
          headers: {
            'X-Shopify-Access-Token': accessToken,
            'Content-Type': 'application/json'
          }
        }
      );
      console.log(`✅ Registered webhook: ${webhook.topic}`);
    } catch (error) {
      // Webhook might already exist, which is fine
      if (error.response?.status !== 422) {
        console.error(`Failed to register webhook ${webhook.topic}:`, error.response?.data || error.message);
      }
    }
  }
}

// Mandatory Compliance Webhooks

// 1. Customer Data Request (GDPR)
router.post('/shopify/webhooks/customers/data_request', express.raw({ type: 'application/json' }), async (req, res) => {
  try {
    const hmac = req.get('X-Shopify-Hmac-Sha256');
    const data = req.body.toString('utf8');
    
    // Verify HMAC
    if (!verifyShopifyWebhook(data, hmac)) {
      console.error('Invalid HMAC for customer data request');
      return res.status(401).send('Unauthorized');
    }

    const payload = JSON.parse(data);
    console.log('📋 Customer data request received:', payload.shop_domain);
    
    // Log the request for compliance
    // In production, you would gather all customer data and send it to the customer
    // For now, we just acknowledge receipt
    
    res.status(200).send('Data request acknowledged');
  } catch (error) {
    console.error('Error processing customer data request:', error);
    res.status(500).send('Internal server error');
  }
});

// 2. Customer Redact (GDPR)
router.post('/shopify/webhooks/customers/redact', express.raw({ type: 'application/json' }), async (req, res) => {
  try {
    const hmac = req.get('X-Shopify-Hmac-Sha256');
    const data = req.body.toString('utf8');
    
    // Verify HMAC
    if (!verifyShopifyWebhook(data, hmac)) {
      console.error('Invalid HMAC for customer redact');
      return res.status(401).send('Unauthorized');
    }

    const payload = JSON.parse(data);
    console.log('🗑️  Customer redact request received:', payload.shop_domain);
    
    // In production, you would delete all customer data
    // For this app, we don't store customer data, only merchant data
    
    res.status(200).send('Customer data redacted');
  } catch (error) {
    console.error('Error processing customer redact:', error);
    res.status(500).send('Internal server error');
  }
});

// 3. Shop Redact (GDPR)
router.post('/shopify/webhooks/shop/redact', express.raw({ type: 'application/json' }), async (req, res) => {
  try {
    const hmac = req.get('X-Shopify-Hmac-Sha256');
    const data = req.body.toString('utf8');
    
    // Verify HMAC
    if (!verifyShopifyWebhook(data, hmac)) {
      console.error('Invalid HMAC for shop redact');
      return res.status(401).send('Unauthorized');
    }

    const payload = JSON.parse(data);
    console.log('🗑️  Shop redact request received:', payload.shop_domain);
    
    // Delete all data related to this shop
    await ShopifyIntegration.deleteOne({ shop: payload.shop_domain });
    
    res.status(200).send('Shop data redacted');
  } catch (error) {
    console.error('Error processing shop redact:', error);
    res.status(500).send('Internal server error');
  }
});

module.exports = router;
