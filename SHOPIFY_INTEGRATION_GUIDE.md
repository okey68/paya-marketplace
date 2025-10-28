# Shopify Integration Guide for Paya Marketplace

## Overview
This guide explains how to implement Shopify integration on the backend to allow merchants to import products from their Shopify stores.

## Prerequisites

### 1. Create a Shopify Partner Account
- Go to https://partners.shopify.com/
- Sign up for a free Partner account
- This allows you to create apps that merchants can install

### 2. Create a Shopify App
1. In your Partner Dashboard, go to **Apps** → **Create app**
2. Choose **Public app** (for multiple merchants) or **Custom app** (for specific merchants)
3. Fill in app details:
   - App name: "Paya Marketplace Integration"
   - App URL: `https://your-domain.com/integrations/shopify/callback`
   - Allowed redirection URL(s): `https://your-domain.com/integrations/shopify/callback`

### 3. Get API Credentials
After creating the app, you'll receive:
- **API Key** (Client ID)
- **API Secret Key** (Client Secret)

Store these securely in your `.env` file:
```env
SHOPIFY_API_KEY=your_api_key_here
SHOPIFY_API_SECRET=your_api_secret_here
SHOPIFY_REDIRECT_URI=https://your-domain.com/integrations/shopify/callback
SHOPIFY_SCOPES=read_products,read_inventory,read_orders
```

## Required Scopes
Request these permissions from merchants:
- `read_products` - Read product data
- `read_inventory` - Read inventory levels
- `read_orders` - Optional: sync orders
- `write_products` - Optional: if you want to sync back to Shopify

## Backend Implementation

### 1. Install Required Packages
```bash
cd server
npm install @shopify/shopify-api axios express-session
```

**Note:** You'll need `express-session` to store the merchant ID between the OAuth initiation and callback, since the user will be redirected to Shopify and back.

### 2. Create Shopify Integration Routes

**File: `server/src/routes/integrations.js`**

```javascript
const express = require('express');
const router = express.Router();
const { Shopify } = require('@shopify/shopify-api');
const axios = require('axios');
const { protect, merchantOnly } = require('../middleware/auth');

// Initialize Shopify
Shopify.Context.initialize({
  API_KEY: process.env.SHOPIFY_API_KEY,
  API_SECRET_KEY: process.env.SHOPIFY_API_SECRET,
  SCOPES: process.env.SHOPIFY_SCOPES.split(','),
  HOST_NAME: process.env.HOST_NAME.replace(/https?:\/\//, ''),
  IS_EMBEDDED_APP: false,
  API_VERSION: '2024-01'
});

// Step 1: Initiate OAuth flow (GET request - redirects immediately)
router.get('/shopify/connect', protect, merchantOnly, async (req, res) => {
  try {
    const shop = req.query.shop; // e.g., "store-name.myshopify.com"

    if (!shop) {
      return res.status(400).json({ message: 'Shop parameter is required' });
    }

    // Store merchant ID in session for callback
    req.session.merchantId = req.user._id;

    // Redirect directly to Shopify OAuth
    const authRoute = await Shopify.Auth.beginAuth(
      req,
      res,
      shop,
      '/api/integrations/shopify/callback',
      false
    );

    // This will redirect the user to Shopify
    return authRoute;
  } catch (error) {
    console.error('Shopify connect error:', error);
    res.status(500).json({ message: 'Failed to initiate Shopify connection' });
  }
});

// Step 2: OAuth callback (Shopify redirects here after authorization)
router.get('/shopify/callback', async (req, res) => {
  try {
    const session = await Shopify.Auth.validateAuthCallback(
      req,
      res,
      req.query
    );

    // Get merchant ID from session
    const merchantId = req.session.merchantId;
    
    if (!merchantId) {
      return res.redirect('/products?shopify=error&reason=session_expired');
    }

    // Store integration in database
    await ShopifyIntegration.findOneAndUpdate(
      { merchant: merchantId },
      {
        merchant: merchantId,
        shop: session.shop,
        accessToken: session.accessToken,
        scope: session.scope,
        connectedAt: new Date()
      },
      { upsert: true, new: true }
    );

    // Clear session data
    delete req.session.merchantId;

    // Redirect back to merchant portal
    res.redirect('/products?shopify=connected');
  } catch (error) {
    console.error('Shopify callback error:', error);
    res.redirect('/products?shopify=error');
  }
});

// Step 3: Import products from Shopify
router.post('/shopify/import-products', protect, merchantOnly, async (req, res) => {
  try {
    const merchantId = req.user._id;
    
    // Get Shopify integration
    const integration = await ShopifyIntegration.findOne({ merchant: merchantId });
    if (!integration) {
      return res.status(404).json({ message: 'Shopify store not connected' });
    }

    // Fetch products from Shopify
    const shopifyProducts = await fetchShopifyProducts(
      integration.shop,
      integration.accessToken
    );

    let imported = 0;
    let updated = 0;
    let failed = 0;

    // Import each product
    for (const shopifyProduct of shopifyProducts) {
      try {
        const productData = mapShopifyProduct(shopifyProduct, merchantId);
        
        // Check if product already exists (by Shopify ID)
        const existingProduct = await Product.findOne({
          'shopifyData.shopifyId': shopifyProduct.id,
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

    res.json({
      success: true,
      imported,
      updated,
      failed,
      total: shopifyProducts.length
    });
  } catch (error) {
    console.error('Import products error:', error);
    res.status(500).json({ message: 'Failed to import products' });
  }
});

// Check connection status
router.get('/shopify/status', protect, merchantOnly, async (req, res) => {
  try {
    const integration = await ShopifyIntegration.findOne({ merchant: req.user._id });
    
    if (integration) {
      res.json({
        connected: true,
        storeName: integration.shop.replace('.myshopify.com', '')
      });
    } else {
      res.json({ connected: false });
    }
  } catch (error) {
    res.status(500).json({ message: 'Failed to check status' });
  }
});

// Disconnect Shopify
router.post('/shopify/disconnect', protect, merchantOnly, async (req, res) => {
  try {
    await ShopifyIntegration.deleteOne({ merchant: req.user._id });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ message: 'Failed to disconnect' });
  }
});

// Helper function to fetch products from Shopify
async function fetchShopifyProducts(shop, accessToken) {
  const products = [];
  let hasNextPage = true;
  let pageInfo = null;

  while (hasNextPage) {
    const url = `https://${shop}/admin/api/2024-01/products.json`;
    const params = { limit: 250 };
    if (pageInfo) params.page_info = pageInfo;

    const response = await axios.get(url, {
      headers: {
        'X-Shopify-Access-Token': accessToken
      },
      params
    });

    products.push(...response.data.products);

    // Check for pagination
    const linkHeader = response.headers.link;
    if (linkHeader && linkHeader.includes('rel="next"')) {
      const match = linkHeader.match(/page_info=([^&>]+)/);
      pageInfo = match ? match[1] : null;
    } else {
      hasNextPage = false;
    }
  }

  return products;
}

// Helper function to map Shopify product to Paya format
function mapShopifyProduct(shopifyProduct, merchantId) {
  const variant = shopifyProduct.variants[0]; // Use first variant
  
  return {
    merchant: merchantId,
    name: shopifyProduct.title,
    description: shopifyProduct.body_html || '',
    price: parseFloat(variant.price),
    inventory: {
      quantity: variant.inventory_quantity || 0,
      sku: variant.sku || `SHOPIFY-${shopifyProduct.id}`
    },
    category: mapShopifyCategory(shopifyProduct.product_type),
    images: shopifyProduct.images.map(img => img.src),
    status: shopifyProduct.status === 'active' ? 'active' : 'inactive',
    tags: shopifyProduct.tags ? shopifyProduct.tags.split(',').map(t => t.trim()) : [],
    shopifyData: {
      shopifyId: shopifyProduct.id,
      shopifyVariantId: variant.id,
      lastSyncedAt: new Date()
    }
  };
}

// Map Shopify categories to Paya categories
function mapShopifyCategory(shopifyType) {
  const categoryMap = {
    'Electronics': 'Electronics',
    'Clothing': 'Clothing',
    'Appliances': 'Appliances',
    'Beauty': 'Cosmetics',
    'Health': 'Medical Care'
  };
  
  return categoryMap[shopifyType] || 'Other';
}

module.exports = router;
```

### 3. Create Shopify Integration Model

**File: `server/src/models/ShopifyIntegration.js`**

```javascript
const mongoose = require('mongoose');

const shopifyIntegrationSchema = new mongoose.Schema({
  merchant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  shop: {
    type: String,
    required: true
  },
  accessToken: {
    type: String,
    required: true
  },
  scope: {
    type: String,
    required: true
  },
  connectedAt: {
    type: Date,
    default: Date.now
  },
  lastSyncedAt: {
    type: Date
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('ShopifyIntegration', shopifyIntegrationSchema);
```

### 4. Update Product Model

Add Shopify data fields to your Product model:

```javascript
shopifyData: {
  shopifyId: String,
  shopifyVariantId: String,
  lastSyncedAt: Date
}
```

### 5. Register Routes

In `server/src/index.js` or your main app file:

```javascript
const integrationsRoutes = require('./routes/integrations');
app.use('/api/integrations', integrationsRoutes);
```

## Testing

### Test with Shopify Development Store
1. Create a development store in your Partner Dashboard
2. Install your app on the development store
3. Add some test products
4. Test the import functionality

### Test OAuth Flow
1. Click "Connect Shopify" button
2. Enter store name
3. Authorize the app
4. Verify products are imported

## Security Considerations

1. **Store Access Tokens Securely**: Encrypt access tokens in the database
2. **Validate Requests**: Always verify the merchant owns the integration
3. **Rate Limiting**: Shopify has API rate limits (2 requests/second)
4. **Webhook Verification**: Verify webhook signatures if implementing real-time sync
5. **HTTPS Only**: All Shopify API calls must use HTTPS

## Optional: Webhooks for Real-time Sync

To keep products in sync automatically:

```javascript
// Register webhooks after OAuth
router.post('/shopify/webhooks/products/update', async (req, res) => {
  // Verify webhook signature
  const hmac = req.headers['x-shopify-hmac-sha256'];
  // ... verify signature
  
  // Update product in your database
  const shopifyProduct = req.body;
  // ... update logic
  
  res.status(200).send('OK');
});
```

## Resources

- [Shopify API Documentation](https://shopify.dev/docs/api)
- [Shopify OAuth Guide](https://shopify.dev/docs/apps/auth/oauth)
- [Shopify Node Library](https://github.com/Shopify/shopify-node-api)
- [API Rate Limits](https://shopify.dev/docs/api/usage/rate-limits)

## Support

For issues with Shopify integration:
1. Check Shopify Partner Dashboard logs
2. Review API error responses
3. Contact Shopify Partner Support
