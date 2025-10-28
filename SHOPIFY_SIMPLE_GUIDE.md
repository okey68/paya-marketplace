# Simple Shopify Integration (No App Required!)

## Overview
This approach lets merchants connect their existing Shopify stores WITHOUT you needing to create a Shopify app. Each merchant provides their own API credentials.

## How It Works

### Merchant Side:
1. Goes to Shopify Admin → Settings → Apps and sales channels → Develop apps
2. Creates a custom app (e.g., "Paya Marketplace Integration")
3. Configures scopes: `read_products`, `read_inventory`
4. Installs the app and copies the Admin API access token
5. Pastes token into Paya Merchant Portal

### Your Side:
1. Store their credentials securely
2. Use their token to make API calls to their store
3. Fetch products, images, prices, inventory
4. Import into your marketplace

## Backend Implementation

### 1. Install Required Package
```bash
cd server
npm install axios
```

That's it! No Shopify SDK needed for this approach.

### 2. Create Integration Routes

**File: `server/src/routes/integrations.js`**

```javascript
const express = require('express');
const router = express.Router();
const axios = require('axios');
const { protect, merchantOnly } = require('../middleware/auth');
const ShopifyIntegration = require('../models/ShopifyIntegration');
const Product = require('../models/Product');

// Connect Shopify store (save credentials)
router.post('/shopify/connect', protect, merchantOnly, async (req, res) => {
  try {
    const { storeName, accessToken } = req.body;
    const merchantId = req.user._id;

    // Validate the token by making a test API call
    const shop = `${storeName}.myshopify.com`;
    
    try {
      await axios.get(`https://${shop}/admin/api/2024-01/shop.json`, {
        headers: {
          'X-Shopify-Access-Token': accessToken
        }
      });
    } catch (error) {
      return res.status(400).json({ 
        message: 'Invalid store name or access token' 
      });
    }

    // Store credentials (encrypt the token!)
    await ShopifyIntegration.findOneAndUpdate(
      { merchant: merchantId },
      {
        merchant: merchantId,
        shop,
        accessToken, // TODO: Encrypt this!
        connectedAt: new Date()
      },
      { upsert: true, new: true }
    );

    res.json({ success: true, message: 'Shopify store connected successfully' });
  } catch (error) {
    console.error('Shopify connect error:', error);
    res.status(500).json({ message: 'Failed to connect Shopify store' });
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
          'X-Shopify-Access-Token': accessToken
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

### 3. Create Database Model

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
      const algorithm = 'aes-256-cbc';
      const key = Buffer.from(process.env.ENCRYPTION_KEY, 'hex');
      const parts = encrypted.split(':');
      const iv = Buffer.from(parts[0], 'hex');
      const encryptedText = parts[1];
      const decipher = crypto.createDecipheriv(algorithm, key, iv);
      let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      return decrypted;
    }
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

### 4. Update Product Model

Add Shopify data to your Product model:

```javascript
shopifyData: {
  shopifyId: String,
  shopifyVariantId: String,
  lastSyncedAt: Date
}
```

### 5. Environment Variables

Add to `.env`:

```env
# Generate with: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
ENCRYPTION_KEY=your_64_character_hex_key_here
```

### 6. Register Routes

In `server/src/index.js`:

```javascript
const integrationsRoutes = require('./routes/integrations');
app.use('/api/integrations', integrationsRoutes);
```

## Merchant Instructions

Create a guide for your merchants:

### How to Connect Your Shopify Store

1. **Go to your Shopify Admin**
   - Log in to your Shopify store

2. **Navigate to Apps**
   - Settings → Apps and sales channels → Develop apps
   - Click "Allow custom app development" (if first time)

3. **Create Custom App**
   - Click "Create an app"
   - Name it "Paya Marketplace Integration"
   - Click "Create app"

4. **Configure API Scopes**
   - Click "Configure Admin API scopes"
   - Select these permissions:
     - ✅ `read_products`
     - ✅ `read_inventory`
   - Click "Save"

5. **Install App**
   - Click "Install app"
   - Confirm installation

6. **Copy Access Token**
   - Reveal the "Admin API access token"
   - Copy the token (starts with `shpat_`)

7. **Connect to Paya**
   - Go to Paya Merchant Portal → Products
   - Click "Connect Shopify"
   - Enter your store name and paste the token
   - Click "Connect"

8. **Import Products**
   - Click "Import Products"
   - Wait for import to complete
   - Your products are now on Paya Marketplace!

## Security Best Practices

1. **Encrypt Access Tokens**: Always encrypt tokens in database (example included above)
2. **Use HTTPS**: All API calls must use HTTPS
3. **Validate Tokens**: Test token validity before storing
4. **Rate Limiting**: Shopify allows 2 requests/second
5. **Error Handling**: Handle expired/revoked tokens gracefully

## API Endpoints You'll Use

### Shopify Admin API (using merchant's token):

- `GET /admin/api/2024-01/products.json` - Fetch products
- `GET /admin/api/2024-01/products/{id}.json` - Get single product
- `GET /admin/api/2024-01/inventory_levels.json` - Get inventory

### Rate Limits:
- 2 requests per second
- Use `Link` header for pagination

## Testing

1. Create a Shopify development store (free at partners.shopify.com)
2. Add test products
3. Create custom app in that store
4. Test the integration with your token

## Advantages of This Approach

✅ **No app approval needed** - Merchants use their own credentials
✅ **Simpler setup** - No Partner account required
✅ **Direct access** - Use Shopify REST API directly
✅ **Full control** - Merchants manage their own app
✅ **Faster implementation** - No OAuth flow complexity

## Limitations

⚠️ **Manual setup** - Each merchant creates their own app
⚠️ **No webhooks** - Can't receive real-time updates (use polling instead)
⚠️ **Token management** - Merchants must regenerate if token expires

## Optional: Sync Products Periodically

Add a cron job to keep products in sync:

```javascript
// Run daily at 2 AM
cron.schedule('0 2 * * *', async () => {
  const integrations = await ShopifyIntegration.find({});
  
  for (const integration of integrations) {
    try {
      // Re-import products for each merchant
      await syncShopifyProducts(integration);
    } catch (error) {
      console.error(`Sync failed for ${integration.shop}:`, error);
    }
  }
});
```

## Resources

- [Shopify Admin API Docs](https://shopify.dev/docs/api/admin-rest)
- [Custom Apps Guide](https://help.shopify.com/en/manual/apps/custom-apps)
- [API Rate Limits](https://shopify.dev/docs/api/usage/rate-limits)
