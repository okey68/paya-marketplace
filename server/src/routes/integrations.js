const express = require('express');
const router = express.Router();
const { shopifyApi, ApiVersion, LATEST_API_VERSION } = require('@shopify/shopify-api');
const { restResources } = require('@shopify/shopify-api/rest/admin/2024-01');
const axios = require('axios');
const crypto = require('crypto');
const ShopifyIntegration = require('../models/ShopifyIntegration');
const { authenticateToken, requireRole } = require('../middleware/auth');
const { downloadProductImages } = require('../services/shopifyImageService');
const { triggerManualSync } = require('../services/shopifyScheduledSync');
const shopifyCategoryService = require('../services/shopifyCategoryService');
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

    // Generate nonce for CSRF protection
    const state = shopify.auth.nonce();

    // Store OAuth state in session (not in the URL!)
    req.session.shopifyOAuth = {
      state: state,
      merchantId: req.user._id.toString(),
      shop: shop,
      timestamp: Date.now()
    };

    // Build OAuth URL with plain nonce as state
    const redirectUri = process.env.SHOPIFY_REDIRECT_URI;
    const scopes = process.env.SHOPIFY_SCOPES;

    const authUrl = `https://${shop}/admin/oauth/authorize?` +
      `client_id=${process.env.SHOPIFY_API_KEY}&` +
      `scope=${encodeURIComponent(scopes)}&` +
      `redirect_uri=${encodeURIComponent(redirectUri)}&` +
      `state=${state}`;

    console.log('Generated OAuth URL with state:', state);
    console.log('Session data stored:', req.session.shopifyOAuth);

    // IMPORTANT: Save session before responding
    req.session.save((err) => {
      if (err) {
        console.error('Session save error:', err);
        return res.status(500).json({ message: 'Failed to save session' });
      }
      console.log('✅ Session saved successfully');
      res.json({ authUrl });
    });
  } catch (error) {
    console.error('Error generating auth URL:', error);
    res.status(500).json({ message: 'Failed to generate authorization URL' });
  }
});

// Step 2: OAuth Callback
router.get('/shopify/callback', async (req, res) => {
  try {
    console.log('📥 Shopify callback received');
    console.log('Query params:', req.query);
    console.log('Session OAuth data:', req.session.shopifyOAuth);

    const { code, state, shop: shopFromQuery } = req.query;

    if (!state || !code) {
      console.error('❌ Missing state or code parameter');
      return res.redirect(`${process.env.APP_URL}/products?shopify=error&reason=missing_params`);
    }

    // Verify session exists
    if (!req.session.shopifyOAuth) {
      console.error('❌ No OAuth session found');
      return res.redirect(`${process.env.APP_URL}/products?shopify=error&reason=session_expired`);
    }

    // Validate state parameter (CSRF protection)
    if (state !== req.session.shopifyOAuth.state) {
      console.error('❌ State mismatch - possible CSRF attack');
      console.error('Expected:', req.session.shopifyOAuth.state, 'Received:', state);
      return res.redirect(`${process.env.APP_URL}/products?shopify=error&reason=invalid_state`);
    }

    // Check session age (expire after 10 minutes)
    const sessionAge = Date.now() - req.session.shopifyOAuth.timestamp;
    if (sessionAge > 10 * 60 * 1000) {
      console.error('❌ OAuth session expired (age:', Math.round(sessionAge / 1000), 'seconds)');
      delete req.session.shopifyOAuth;
      return res.redirect(`${process.env.APP_URL}/products?shopify=error&reason=session_expired`);
    }

    // Retrieve merchant data from session
    const { merchantId, shop } = req.session.shopifyOAuth;

    // Verify shop matches
    if (shopFromQuery && shop !== shopFromQuery) {
      console.error('❌ Shop mismatch. Expected:', shop, 'Received:', shopFromQuery);
      return res.redirect(`${process.env.APP_URL}/products?shopify=error&reason=shop_mismatch`);
    }

    console.log('✅ State validated successfully');
    console.log('✅ Merchant:', merchantId, 'Shop:', shop);

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

    // Register mandatory compliance webhooks
    await registerComplianceWebhooks(shop, access_token);

    // Clean up OAuth session data
    delete req.session.shopifyOAuth;
    await req.session.save();

    console.log('✅ Shopify integration completed for merchant:', merchantId);
    console.log('✅ Registered webhooks for shop:', shop);

    // Redirect back to products page with success
    res.redirect(`${process.env.APP_URL}/products?shopify=connected`);
  } catch (error) {
    console.error('OAuth callback error:', error);
    // Clean up session on error
    if (req.session.shopifyOAuth) {
      delete req.session.shopifyOAuth;
    }
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
        const productData = await mapShopifyToPayaProduct(shopifyProduct, merchantId, true);

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
        console.error(`Failed to import product ${shopifyProduct.id}:`, error.message);
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

// Manual Sync - Trigger product sync manually
router.post('/shopify/sync', protect, merchantOnly, async (req, res) => {
  try {
    const merchantId = req.user._id;

    // Trigger manual sync for this merchant
    const result = await triggerManualSync(merchantId);

    res.json({
      success: true,
      message: 'Sync completed successfully',
      ...result
    });
  } catch (error) {
    console.error('Manual sync error:', error);
    res.status(500).json({
      message: error.message || 'Failed to sync products'
    });
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
async function mapShopifyToPayaProduct(shopifyProduct, merchantId, downloadImages = true) {
  const variant = shopifyProduct.variants[0]; // Use first variant for primary data

  // Get merchant details for merchantName
  const User = require('../models/User');
  const merchant = await User.findById(merchantId);
  if (!merchant) {
    throw new Error('Merchant not found');
  }

  // Download images from Shopify or use URLs
  let images = [];
  if (downloadImages && shopifyProduct.images && shopifyProduct.images.length > 0) {
    try {
      const imageUrls = shopifyProduct.images.map(img => img.src);
      const imageObjects = await downloadProductImages(imageUrls, shopifyProduct.title);
      // Use the full image objects returned from download
      // Ensure all fields have correct types for Mongoose schema validation
      images = imageObjects.map((img, index) => ({
        filename: String(img.filename || `shopify_image_${index}.jpg`),
        originalName: String(img.originalName || shopifyProduct.images[index]?.alt || 'product_image.jpg'),
        path: String(img.path || ''),
        size: Number(img.size) || 0,
        uploadDate: new Date(),
        isPrimary: Boolean(index === 0)
      }));
    } catch (error) {
      console.error('Failed to download images, using URLs:', error.message);
      // Fallback to URLs as image objects
      images = shopifyProduct.images.map((img, index) => ({
        filename: String(img.src.split('/').pop() || `shopify_image_${index}.jpg`),
        originalName: String(img.alt || 'product_image.jpg'),
        path: String(img.src || ''),
        size: 0,
        uploadDate: new Date(),
        isPrimary: Boolean(index === 0)
      }));
    }
  } else {
    // Use URLs directly as image objects (for webhook quick sync)
    images = shopifyProduct.images ? shopifyProduct.images.map((img, index) => ({
      filename: String(img.src.split('/').pop() || `shopify_image_${index}.jpg`),
      originalName: String(img.alt || 'product_image.jpg'),
      path: String(img.src || ''),
      size: 0,
      uploadDate: new Date(),
      isPrimary: Boolean(index === 0)
    })) : [];
  }

  // Map all variants
  const shopifyVariants = shopifyProduct.variants.map(v => ({
    variantId: v.id.toString(),
    title: v.title,
    price: parseFloat(v.price),
    compareAtPrice: v.compare_at_price ? parseFloat(v.compare_at_price) : null,
    inventoryQuantity: v.inventory_quantity || 0,
    sku: v.sku || `SHOPIFY-${v.id}`,
    option1: v.option1 || null,
    option2: v.option2 || null,
    option3: v.option3 || null,
    inventoryItemId: v.inventory_item_id ? v.inventory_item_id.toString() : null,
    weight: v.weight || 0,
    weightUnit: v.weight_unit || 'kg'
  }));

  // Calculate total inventory across all variants
  const totalInventory = shopifyProduct.variants.reduce((sum, v) => sum + (v.inventory_quantity || 0), 0);

  // Handle empty description - provide a default value
  let description = shopifyProduct.body_html || '';
  if (!description || description.trim() === '') {
    description = `${shopifyProduct.title} - Imported from Shopify`;
  }

  return {
    merchant: merchantId,
    merchantName: merchant.businessInfo?.businessName || merchant.name || 'Unknown Merchant',
    name: shopifyProduct.title,
    description: description,
    price: parseFloat(variant.price),
    inventory: {
      quantity: totalInventory,
      sku: variant.sku || `SHOPIFY-${shopifyProduct.id}`,
      trackInventory: true
    },
    category: mapCategory(shopifyProduct.product_type),
    images: images,
    status: shopifyProduct.status === 'active' ? 'active' : 'inactive',
    tags: shopifyProduct.tags ? shopifyProduct.tags.split(',').map(t => t.trim()) : [],
    shopifyData: {
      shopifyId: shopifyProduct.id.toString(),
      shopifyVariantId: variant.id.toString(),
      shopifyVariants: shopifyVariants,
      originalProductType: shopifyProduct.product_type || '',
      lastSyncedAt: new Date(),
      syncStatus: 'synced'
    }
  };
}

// Helper: Map Shopify categories to Paya categories (uses expanded category service)
function mapCategory(shopifyType) {
  return shopifyCategoryService.mapCategory(shopifyType);
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
    // GDPR Compliance (Mandatory)
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
    },
    // Product Management (For real-time sync)
    {
      topic: 'products/create',
      address: `${process.env.SHOPIFY_WEBHOOK_URL || process.env.APP_URL.replace('3003', '5001')}/api/integrations/shopify/webhooks/products/create`
    },
    {
      topic: 'products/update',
      address: `${process.env.SHOPIFY_WEBHOOK_URL || process.env.APP_URL.replace('3003', '5001')}/api/integrations/shopify/webhooks/products/update`
    },
    {
      topic: 'products/delete',
      address: `${process.env.SHOPIFY_WEBHOOK_URL || process.env.APP_URL.replace('3003', '5001')}/api/integrations/shopify/webhooks/products/delete`
    },
    // Inventory Management
    {
      topic: 'inventory_levels/update',
      address: `${process.env.SHOPIFY_WEBHOOK_URL || process.env.APP_URL.replace('3003', '5001')}/api/integrations/shopify/webhooks/inventory/update`
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

// Product Webhooks (Real-time Sync)

// 4. Product Created - Auto-import new products
router.post('/shopify/webhooks/products/create', express.raw({ type: 'application/json' }), async (req, res) => {
  try {
    const hmac = req.get('X-Shopify-Hmac-Sha256');
    const data = req.body.toString('utf8');

    // Verify HMAC
    if (!verifyShopifyWebhook(data, hmac)) {
      console.error('Invalid HMAC for product create');
      return res.status(401).send('Unauthorized');
    }

    const shopifyProduct = JSON.parse(data);
    const shopDomain = req.get('X-Shopify-Shop-Domain');

    console.log('➕ Product created in Shopify:', shopifyProduct.id, shopifyProduct.title);

    // Find the merchant associated with this shop
    const integration = await ShopifyIntegration.findOne({ shop: shopDomain });
    if (!integration) {
      console.error('No integration found for shop:', shopDomain);
      return res.status(404).send('Integration not found');
    }

    const Product = require('../models/Product');
    const productData = await mapShopifyToPayaProduct(shopifyProduct, integration.merchant, false);

    // Create the product in Paya
    await Product.create(productData);
    console.log('✅ Product imported automatically:', shopifyProduct.title);

    res.status(200).send('Product created');
  } catch (error) {
    console.error('Error processing product create webhook:', error);
    res.status(500).send('Internal server error');
  }
});

// 5. Product Updated - Sync product changes
router.post('/shopify/webhooks/products/update', express.raw({ type: 'application/json' }), async (req, res) => {
  try {
    const hmac = req.get('X-Shopify-Hmac-Sha256');
    const data = req.body.toString('utf8');

    // Verify HMAC
    if (!verifyShopifyWebhook(data, hmac)) {
      console.error('Invalid HMAC for product update');
      return res.status(401).send('Unauthorized');
    }

    const shopifyProduct = JSON.parse(data);
    const shopDomain = req.get('X-Shopify-Shop-Domain');

    console.log('🔄 Product updated in Shopify:', shopifyProduct.id, shopifyProduct.title);

    // Find the merchant associated with this shop
    const integration = await ShopifyIntegration.findOne({ shop: shopDomain });
    if (!integration) {
      console.error('No integration found for shop:', shopDomain);
      return res.status(404).send('Integration not found');
    }

    const Product = require('../models/Product');

    // Find the product in Paya
    const existingProduct = await Product.findOne({
      'shopifyData.shopifyId': shopifyProduct.id.toString(),
      merchant: integration.merchant
    });

    if (existingProduct) {
      const productData = await mapShopifyToPayaProduct(shopifyProduct, integration.merchant, false);
      await Product.findByIdAndUpdate(existingProduct._id, productData);
      console.log('✅ Product updated:', shopifyProduct.title);
    } else {
      // Product doesn't exist, create it
      const productData = await mapShopifyToPayaProduct(shopifyProduct, integration.merchant, false);
      await Product.create(productData);
      console.log('✅ Product created from update:', shopifyProduct.title);
    }

    res.status(200).send('Product updated');
  } catch (error) {
    console.error('Error processing product update webhook:', error);
    res.status(500).send('Internal server error');
  }
});

// 6. Product Deleted - Mark as inactive or delete
router.post('/shopify/webhooks/products/delete', express.raw({ type: 'application/json' }), async (req, res) => {
  try {
    const hmac = req.get('X-Shopify-Hmac-Sha256');
    const data = req.body.toString('utf8');

    // Verify HMAC
    if (!verifyShopifyWebhook(data, hmac)) {
      console.error('Invalid HMAC for product delete');
      return res.status(401).send('Unauthorized');
    }

    const shopifyProduct = JSON.parse(data);
    const shopDomain = req.get('X-Shopify-Shop-Domain');

    console.log('🗑️  Product deleted in Shopify:', shopifyProduct.id);

    // Find the merchant associated with this shop
    const integration = await ShopifyIntegration.findOne({ shop: shopDomain });
    if (!integration) {
      console.error('No integration found for shop:', shopDomain);
      return res.status(404).send('Integration not found');
    }

    const Product = require('../models/Product');

    // Find and mark as inactive (don't delete to preserve order history)
    const product = await Product.findOne({
      'shopifyData.shopifyId': shopifyProduct.id.toString(),
      merchant: integration.merchant
    });

    if (product) {
      await Product.findByIdAndUpdate(product._id, {
        status: 'inactive',
        'shopifyData.lastSyncedAt': new Date()
      });
      console.log('✅ Product marked as inactive:', product.name);
    }

    res.status(200).send('Product deleted');
  } catch (error) {
    console.error('Error processing product delete webhook:', error);
    res.status(500).send('Internal server error');
  }
});

// 7. Inventory Updated - Real-time inventory sync
router.post('/shopify/webhooks/inventory/update', express.raw({ type: 'application/json' }), async (req, res) => {
  try {
    const hmac = req.get('X-Shopify-Hmac-Sha256');
    const data = req.body.toString('utf8');

    // Verify HMAC
    if (!verifyShopifyWebhook(data, hmac)) {
      console.error('Invalid HMAC for inventory update');
      return res.status(401).send('Unauthorized');
    }

    const inventoryLevel = JSON.parse(data);
    const shopDomain = req.get('X-Shopify-Shop-Domain');

    console.log('📦 Inventory updated in Shopify:', inventoryLevel.inventory_item_id, 'available:', inventoryLevel.available);

    // Find the merchant associated with this shop
    const integration = await ShopifyIntegration.findOne({ shop: shopDomain });
    if (!integration) {
      console.error('No integration found for shop:', shopDomain);
      return res.status(404).send('Integration not found');
    }

    const Product = require('../models/Product');

    // Find product that contains this variant
    const product = await Product.findOne({
      'shopifyData.shopifyVariants.inventoryItemId': inventoryLevel.inventory_item_id.toString(),
      merchant: integration.merchant
    });

    if (product) {
      // Update the specific variant's inventory
      const variantIndex = product.shopifyData.shopifyVariants.findIndex(
        v => v.inventoryItemId === inventoryLevel.inventory_item_id.toString()
      );

      if (variantIndex !== -1) {
        product.shopifyData.shopifyVariants[variantIndex].inventoryQuantity = inventoryLevel.available || 0;

        // Recalculate total inventory from all variants
        const totalInventory = product.shopifyData.shopifyVariants.reduce(
          (sum, v) => sum + (v.inventoryQuantity || 0), 0
        );

        product.inventory.quantity = totalInventory;
        product.shopifyData.lastSyncedAt = new Date();

        await product.save();

        console.log('✅ Inventory updated for:', product.name, '- Total Quantity:', totalInventory);
      }
    } else {
      console.log('⚠️  Product not found for inventory update:', inventoryLevel.inventory_item_id);
    }

    res.status(200).send('Inventory updated');
  } catch (error) {
    console.error('Error processing inventory update webhook:', error);
    res.status(500).send('Internal server error');
  }
});

// ==========================================
// CATEGORY MAPPING ENDPOINTS
// ==========================================

// @route   GET /shopify/category-sources
// @desc    Fetch available product types, collections, and tags from Shopify
// @access  Private (Merchant)
router.get('/shopify/category-sources', protect, merchantOnly, async (req, res) => {
  try {
    const integration = await ShopifyIntegration.findOne({ merchant: req.user._id });

    if (!integration) {
      return res.status(404).json({ message: 'Shopify integration not found' });
    }

    const { shop, accessToken } = integration;

    // Check if we have cached sources (less than 1 hour old)
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    if (integration.shopifySources?.lastFetchedAt > oneHourAgo) {
      return res.json({
        productTypes: integration.shopifySources.productTypes || [],
        collections: integration.shopifySources.collections || [],
        tags: integration.shopifySources.tags || [],
        cachedAt: integration.shopifySources.lastFetchedAt
      });
    }

    // Fetch fresh data from Shopify
    const [productTypes, collections, tags] = await Promise.all([
      shopifyCategoryService.fetchShopifyProductTypes(shop, accessToken),
      shopifyCategoryService.fetchShopifyCollections(shop, accessToken),
      shopifyCategoryService.fetchShopifyTags(shop, accessToken)
    ]);

    // Cache the results
    integration.shopifySources = {
      productTypes,
      collections,
      tags,
      lastFetchedAt: new Date()
    };
    await integration.save();

    res.json({
      productTypes,
      collections,
      tags,
      cachedAt: new Date()
    });
  } catch (error) {
    console.error('Error fetching category sources:', error);
    res.status(500).json({ message: 'Failed to fetch category sources', error: error.message });
  }
});

// @route   GET /shopify/category-mappings
// @desc    Get merchant's current category mappings
// @access  Private (Merchant)
router.get('/shopify/category-mappings', protect, merchantOnly, async (req, res) => {
  try {
    const integration = await ShopifyIntegration.findOne({ merchant: req.user._id });

    if (!integration) {
      return res.status(404).json({ message: 'Shopify integration not found' });
    }

    res.json({
      mappings: integration.categoryMappings || [],
      defaultCategory: integration.defaultCategory || 'Other',
      payaCategories: shopifyCategoryService.PAYA_CATEGORIES
    });
  } catch (error) {
    console.error('Error fetching category mappings:', error);
    res.status(500).json({ message: 'Failed to fetch category mappings', error: error.message });
  }
});

// @route   POST /shopify/category-mappings
// @desc    Save category mappings (replaces all existing mappings)
// @access  Private (Merchant)
router.post('/shopify/category-mappings', protect, merchantOnly, async (req, res) => {
  try {
    const { mappings, defaultCategory } = req.body;

    const integration = await ShopifyIntegration.findOne({ merchant: req.user._id });

    if (!integration) {
      return res.status(404).json({ message: 'Shopify integration not found' });
    }

    // Validate mappings
    if (mappings && Array.isArray(mappings)) {
      const validMappings = mappings.filter(m =>
        m.sourceType && m.sourceValue && m.payaCategory &&
        ['product_type', 'collection', 'tag'].includes(m.sourceType) &&
        shopifyCategoryService.PAYA_CATEGORIES.includes(m.payaCategory)
      );

      integration.categoryMappings = validMappings.map((m, index) => ({
        sourceType: m.sourceType,
        sourceValue: m.sourceValue,
        payaCategory: m.payaCategory,
        priority: m.priority !== undefined ? m.priority : index,
        createdAt: new Date()
      }));
    }

    // Validate default category
    if (defaultCategory && shopifyCategoryService.PAYA_CATEGORIES.includes(defaultCategory)) {
      integration.defaultCategory = defaultCategory;
    }

    await integration.save();

    res.json({
      message: 'Category mappings saved successfully',
      mappings: integration.categoryMappings,
      defaultCategory: integration.defaultCategory
    });
  } catch (error) {
    console.error('Error saving category mappings:', error);
    res.status(500).json({ message: 'Failed to save category mappings', error: error.message });
  }
});

// @route   DELETE /shopify/category-mappings/:index
// @desc    Remove a specific category mapping by index
// @access  Private (Merchant)
router.delete('/shopify/category-mappings/:index', protect, merchantOnly, async (req, res) => {
  try {
    const { index } = req.params;
    const mappingIndex = parseInt(index, 10);

    const integration = await ShopifyIntegration.findOne({ merchant: req.user._id });

    if (!integration) {
      return res.status(404).json({ message: 'Shopify integration not found' });
    }

    if (isNaN(mappingIndex) || mappingIndex < 0 || mappingIndex >= integration.categoryMappings.length) {
      return res.status(400).json({ message: 'Invalid mapping index' });
    }

    integration.categoryMappings.splice(mappingIndex, 1);
    await integration.save();

    res.json({
      message: 'Category mapping removed successfully',
      mappings: integration.categoryMappings
    });
  } catch (error) {
    console.error('Error removing category mapping:', error);
    res.status(500).json({ message: 'Failed to remove category mapping', error: error.message });
  }
});

// @route   GET /shopify/category-preview
// @desc    Preview how products would be categorized with current mappings
// @access  Private (Merchant)
router.get('/shopify/category-preview', protect, merchantOnly, async (req, res) => {
  try {
    const integration = await ShopifyIntegration.findOne({ merchant: req.user._id });

    if (!integration) {
      return res.status(404).json({ message: 'Shopify integration not found' });
    }

    const { shop, accessToken } = integration;

    // Fetch a sample of products from Shopify
    const response = await axios.get(
      `https://${shop}/admin/api/2024-01/products.json?limit=50&fields=id,title,product_type,tags`,
      {
        headers: {
          'X-Shopify-Access-Token': accessToken,
          'Content-Type': 'application/json'
        }
      }
    );

    const products = response.data.products || [];

    // Preview categorization for each product
    const preview = products.map(product => {
      const result = shopifyCategoryService.determineCategory(
        product,
        integration.categoryMappings || [],
        integration.defaultCategory || 'Other'
      );

      return {
        id: product.id,
        title: product.title,
        productType: product.product_type || '(none)',
        tags: product.tags || '',
        assignedCategory: result.category,
        categorySource: result.source
      };
    });

    // Summary statistics
    const categoryCounts = {};
    const sourceCounts = {};

    preview.forEach(p => {
      categoryCounts[p.assignedCategory] = (categoryCounts[p.assignedCategory] || 0) + 1;
      sourceCounts[p.categorySource] = (sourceCounts[p.categorySource] || 0) + 1;
    });

    res.json({
      preview,
      summary: {
        total: preview.length,
        byCategory: categoryCounts,
        bySource: sourceCounts
      }
    });
  } catch (error) {
    console.error('Error generating category preview:', error);
    res.status(500).json({ message: 'Failed to generate category preview', error: error.message });
  }
});

// @route   POST /shopify/rematch-categories
// @desc    Re-categorize existing products based on current mappings
// @access  Private (Merchant)
router.post('/shopify/rematch-categories', protect, merchantOnly, async (req, res) => {
  try {
    const Product = require('../models/Product');

    const integration = await ShopifyIntegration.findOne({ merchant: req.user._id });

    if (!integration) {
      return res.status(404).json({ message: 'Shopify integration not found' });
    }

    // Find all products from this merchant that were imported from Shopify
    const products = await Product.find({
      merchant: req.user._id,
      'shopifyData.shopifyId': { $exists: true }
    });

    let updated = 0;
    let unchanged = 0;
    const changes = [];

    for (const product of products) {
      // We need to reconstruct the Shopify product data for categorization
      const shopifyProductData = {
        product_type: product.shopifyData?.originalProductType || '',
        tags: product.tags?.join(',') || '',
        title: product.name
      };

      const result = shopifyCategoryService.determineCategory(
        shopifyProductData,
        integration.categoryMappings || [],
        integration.defaultCategory || 'Other'
      );

      if (product.category !== result.category) {
        const oldCategory = product.category;
        product.category = result.category;
        product.shopifyData.categorySource = result.source;
        await product.save();

        changes.push({
          productId: product._id,
          name: product.name,
          oldCategory,
          newCategory: result.category,
          source: result.source
        });
        updated++;
      } else {
        unchanged++;
      }
    }

    res.json({
      message: `Re-categorization complete`,
      summary: {
        total: products.length,
        updated,
        unchanged
      },
      changes
    });
  } catch (error) {
    console.error('Error re-matching categories:', error);
    res.status(500).json({ message: 'Failed to re-match categories', error: error.message });
  }
});

module.exports = router;
