# Shopify OAuth Integration - Complete Implementation Guide

## Overview
This guide implements the full OAuth flow where merchants log in to Shopify and authorize your Paya app to access their products.

## Prerequisites

### 1. Create Shopify Partner Account
- Go to https://partners.shopify.com/
- Sign up (free)

### 2. Create Your App
1. In Partner Dashboard → Apps → Create app → Create app manually
2. Fill in:
   - **App name**: Paya Marketplace
   - **App URL**: `https://yourdomain.com` (or `http://localhost:3000` for dev)
   - **Allowed redirection URL(s)**: 
     - Production: `https://yourdomain.com/api/integrations/shopify/callback`
     - Development: `http://localhost:5000/api/integrations/shopify/callback`

3. Get your credentials:
   - **API Key** (Client ID)
   - **API Secret Key** (Client Secret)

### 3. Environment Variables

Add to `server/.env`:

```env
# Shopify OAuth
SHOPIFY_API_KEY=your_api_key_here
SHOPIFY_API_SECRET=your_api_secret_here
SHOPIFY_SCOPES=read_products,read_inventory
SHOPIFY_REDIRECT_URI=http://localhost:5000/api/integrations/shopify/callback

# For production, use:
# SHOPIFY_REDIRECT_URI=https://yourdomain.com/api/integrations/shopify/callback

# Session secret for storing merchant ID during OAuth
SESSION_SECRET=your_random_secret_here

# Encryption key for storing access tokens (32 bytes hex)
ENCRYPTION_KEY=generate_with_crypto_randomBytes_32_toString_hex

# Your app's base URL
APP_URL=http://localhost:3000
# For production: APP_URL=https://yourdomain.com
```

Generate encryption key:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## Backend Implementation

### 1. Install Dependencies

```bash
cd server
npm install @shopify/shopify-api express-session axios
```

### 2. Configure Session Middleware

In `server/src/index.js` or your main app file:

```javascript
const session = require('express-session');

// Add BEFORE your routes
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production', // HTTPS only in production
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));
```

### 3. Create Integration Routes

**File: `server/src/routes/integrations.js`**

```javascript
const express = require('express');
const router = express.Router();
const { Shopify, ApiVersion } = require('@shopify/shopify-api');
const axios = require('axios');
const { protect, merchantOnly } = require('../middleware/auth');
const ShopifyIntegration = require('../models/ShopifyIntegration');
const Product = require('../models/Product');

// Initialize Shopify API
Shopify.Context.initialize({
  API_KEY: process.env.SHOPIFY_API_KEY,
  API_SECRET_KEY: process.env.SHOPIFY_API_SECRET,
  SCOPES: process.env.SHOPIFY_SCOPES.split(','),
  HOST_NAME: process.env.SHOPIFY_REDIRECT_URI.replace(/https?:\/\//, '').split('/')[0],
  HOST_SCHEME: process.env.NODE_ENV === 'production' ? 'https' : 'http',
  API_VERSION: ApiVersion.January24,
  IS_EMBEDDED_APP: false,
  SESSION_STORAGE: new Shopify.Session.MemorySessionStorage(),
});

// Step 1: Generate OAuth URL
router.post('/shopify/auth-url', protect, merchantOnly, async (req, res) => {
  try {
    const { shop } = req.body;

    if (!shop || !shop.includes('.myshopify.com')) {
      return res.status(400).json({ message: 'Invalid shop domain' });
    }

    // Store merchant ID in session for callback
    req.session.merchantId = req.user._id.toString();
    req.session.shop = shop;

    // Generate OAuth URL
    const authRoute = await Shopify.Auth.beginAuth(
      req,
      res,
      shop,
      '/api/integrations/shopify/callback',
      false // isOnline = false for offline access token
    );

    res.json({ authUrl: authRoute });
  } catch (error) {
    console.error('Error generating auth URL:', error);
    res.status(500).json({ message: 'Failed to generate authorization URL' });
  }
});

// Step 2: OAuth Callback
router.get('/shopify/callback', async (req, res) => {
  try {
    // Validate OAuth callback
    const session = await Shopify.Auth.validateAuthCallback(
      req,
      res,
      req.query
    );

    // Get merchant ID from session
    const merchantId = req.session.merchantId;
    const shop = req.session.shop;

    if (!merchantId) {
      return res.redirect(`${process.env.APP_URL}/products?shopify=error&reason=session_expired`);
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
    delete req.session.shop;

    // Redirect back to products page with success
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

// Disconnect Shopify
router.post('/shopify/disconnect', protect, merchantOnly, async (req, res) => {
  try {
    await ShopifyIntegration.deleteOne({ merchant: req.user._id });
    res.json({ success: true, message: 'Shopify store disconnected' });
  } catch (error) {
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

module.exports = router;
```

### 4. Database Model

**File: `server/src/models/ShopifyIntegration.js`**

```javascript
const mongoose = require('mongoose');
const crypto = require('crypto');

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
    required: true,
    // Encrypt before saving
    set: function(token) {
      if (!token) return token;
      const algorithm = 'aes-256-cbc';
      const key = Buffer.from(process.env.ENCRYPTION_KEY, 'hex');
      const iv = crypto.randomBytes(16);
      const cipher = crypto.createCipheriv(algorithm, key, iv);
      let encrypted = cipher.update(token, 'utf8', 'hex');
      encrypted += cipher.final('hex');
      return iv.toString('hex') + ':' + encrypted;
    },
    // Decrypt when reading
    get: function(encrypted) {
      if (!encrypted) return encrypted;
      try {
        const algorithm = 'aes-256-cbc';
        const key = Buffer.from(process.env.ENCRYPTION_KEY, 'hex');
        const parts = encrypted.split(':');
        const iv = Buffer.from(parts[0], 'hex');
        const encryptedText = parts[1];
        const decipher = crypto.createDecipheriv(algorithm, key, iv);
        let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
        decrypted += decipher.final('utf8');
        return decrypted;
      } catch (error) {
        console.error('Decryption error:', error);
        return null;
      }
    }
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
  timestamps: true,
  toJSON: { getters: true },
  toObject: { getters: true }
});

module.exports = mongoose.model('ShopifyIntegration', shopifyIntegrationSchema);
```

### 5. Update Product Model

Add to your Product schema:

```javascript
shopifyData: {
  shopifyId: String,
  shopifyVariantId: String,
  lastSyncedAt: Date
}
```

### 6. Register Routes

In `server/src/index.js`:

```javascript
const integrationsRoutes = require('./routes/integrations');
app.use('/api/integrations', integrationsRoutes);
```

## Frontend - Handle OAuth Return

Update `Products.js` to show success/error messages:

```javascript
useEffect(() => {
  // Check for Shopify connection status in URL
  const urlParams = new URLSearchParams(window.location.search);
  const shopifyStatus = urlParams.get('shopify');
  
  if (shopifyStatus === 'connected') {
    toast.success('Shopify store connected! Click "Connect Shopify" to import products.');
    // Clean URL
    window.history.replaceState({}, document.title, window.location.pathname);
  } else if (shopifyStatus === 'error') {
    toast.error('Failed to connect Shopify store. Please try again.');
    window.history.replaceState({}, document.title, window.location.pathname);
  }
}, []);
```

## Testing

### 1. Test with Development Store
1. Create development store in Partner Dashboard
2. Add test products
3. Test OAuth flow
4. Verify products import

### 2. Test OAuth Flow
1. Click "Connect Shopify"
2. Enter store name
3. Get redirected to Shopify login
4. Log in and authorize
5. Get redirected back to products page
6. Import products

## Security Best Practices

1. ✅ **Use HTTPS in production**
2. ✅ **Encrypt access tokens** (implemented above)
3. ✅ **Use secure session cookies**
4. ✅ **Validate OAuth state** (Shopify SDK handles this)
5. ✅ **Rate limit API calls** (500ms delay implemented)
6. ✅ **Store minimal data** (only what's needed)

## Troubleshooting

### "Redirect URI mismatch"
- Ensure callback URL in Partner Dashboard matches exactly
- Check HTTP vs HTTPS
- Verify port number in development

### "Session expired"
- Increase session maxAge
- Check session middleware is configured
- Verify SESSION_SECRET is set

### "Invalid access token"
- Check token encryption/decryption
- Verify ENCRYPTION_KEY is 64 characters (32 bytes hex)
- Test token immediately after OAuth

## Production Checklist

- [ ] Update `SHOPIFY_REDIRECT_URI` to production URL
- [ ] Update `APP_URL` to production URL
- [ ] Set `NODE_ENV=production`
- [ ] Use HTTPS everywhere
- [ ] Set secure session cookies
- [ ] Test OAuth flow end-to-end
- [ ] Monitor rate limits
- [ ] Set up error logging

## Resources

- [Shopify OAuth Documentation](https://shopify.dev/docs/apps/auth/oauth)
- [Shopify Node Library](https://github.com/Shopify/shopify-node-api)
- [API Rate Limits](https://shopify.dev/docs/api/usage/rate-limits)
