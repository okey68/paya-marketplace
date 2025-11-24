/**
 * Shopify Scheduled Sync Service
 * Runs daily to catch any missed webhook events
 * Acts as a backup to ensure data consistency
 */

const cron = require('node-cron');
const ShopifyIntegration = require('../models/ShopifyIntegration');
const Product = require('../models/Product');
const axios = require('axios');
const { downloadProductImages } = require('./shopifyImageService');

// Track if sync is in progress to prevent overlaps
let syncInProgress = false;

/**
 * Fetch products from Shopify for a specific shop
 */
async function fetchShopifyProducts(shop, accessToken) {
  const allProducts = [];
  let hasNextPage = true;
  let pageInfo = null;

  try {
    while (hasNextPage) {
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

      // Rate limiting
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    return allProducts;
  } catch (error) {
    console.error(`Error fetching products from ${shop}:`, error.message);
    throw error;
  }
}

/**
 * Map Shopify product to Paya format (without image download for background sync)
 */
function mapShopifyProduct(shopifyProduct, merchantId) {
  const variant = shopifyProduct.variants[0];

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

  const totalInventory = shopifyProduct.variants.reduce((sum, v) => sum + (v.inventory_quantity || 0), 0);

  // Use URLs for images in background sync
  const images = shopifyProduct.images ? shopifyProduct.images.map(img => img.src) : [];

  return {
    merchant: merchantId,
    name: shopifyProduct.title,
    description: shopifyProduct.body_html || '',
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
      lastSyncedAt: new Date(),
      syncStatus: 'synced'
    }
  };
}

/**
 * Helper: Map Shopify categories to Paya categories
 */
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

/**
 * Sync products for a single merchant
 */
async function syncMerchantProducts(integration) {
  let updated = 0;
  let created = 0;
  let failed = 0;

  try {
    console.log(`🔄 Starting sync for merchant: ${integration.shop}`);

    // Update sync status
    integration.syncStatus = integration.syncStatus || {};
    integration.syncStatus.status = 'syncing';
    integration.syncStatus.lastSyncAt = new Date();
    await integration.save();

    // Fetch products from Shopify
    const shopifyProducts = await fetchShopifyProducts(integration.shop, integration.accessToken);

    console.log(`📦 Found ${shopifyProducts.length} products in Shopify for ${integration.shop}`);

    // Sync each product
    for (const shopifyProduct of shopifyProducts) {
      try {
        const productData = mapShopifyProduct(shopifyProduct, integration.merchant);

        // Check if product exists
        const existingProduct = await Product.findOne({
          'shopifyData.shopifyId': shopifyProduct.id.toString(),
          merchant: integration.merchant
        });

        if (existingProduct) {
          await Product.findByIdAndUpdate(existingProduct._id, productData);
          updated++;
        } else {
          await Product.create(productData);
          created++;
        }
      } catch (error) {
        console.error(`Failed to sync product ${shopifyProduct.id}:`, error.message);
        failed++;
      }
    }

    // Update integration with sync results
    integration.syncStatus.status = 'idle';
    integration.syncStatus.productsCount = shopifyProducts.length;
    integration.syncStatus.lastError = failed > 0 ? `${failed} products failed to sync` : null;
    integration.lastSyncedAt = new Date();
    await integration.save();

    console.log(`✅ Sync completed for ${integration.shop}: ${created} created, ${updated} updated, ${failed} failed`);

    return { created, updated, failed };
  } catch (error) {
    console.error(`❌ Sync failed for ${integration.shop}:`, error.message);

    // Update integration with error
    integration.syncStatus = integration.syncStatus || {};
    integration.syncStatus.status = 'error';
    integration.syncStatus.lastError = error.message;
    await integration.save();

    throw error;
  }
}

/**
 * Sync all connected Shopify stores
 */
async function syncAllMerchants() {
  if (syncInProgress) {
    console.log('⏭️  Sync already in progress, skipping...');
    return;
  }

  syncInProgress = true;

  try {
    console.log('🚀 Starting scheduled Shopify sync...');

    // Get all active integrations
    const integrations = await ShopifyIntegration.find({});

    if (integrations.length === 0) {
      console.log('ℹ️  No Shopify integrations found to sync');
      return;
    }

    console.log(`📊 Found ${integrations.length} Shopify integration(s) to sync`);

    const results = {
      total: integrations.length,
      successful: 0,
      failed: 0,
      totalCreated: 0,
      totalUpdated: 0,
      totalFailed: 0
    };

    // Sync each merchant sequentially
    for (const integration of integrations) {
      try {
        const syncResult = await syncMerchantProducts(integration);
        results.successful++;
        results.totalCreated += syncResult.created;
        results.totalUpdated += syncResult.updated;
        results.totalFailed += syncResult.failed;

        // Wait between merchants to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 2000));
      } catch (error) {
        results.failed++;
        console.error(`Failed to sync merchant ${integration.shop}:`, error.message);
      }
    }

    console.log('✅ Scheduled sync completed:', results);
  } catch (error) {
    console.error('❌ Scheduled sync error:', error);
  } finally {
    syncInProgress = false;
  }
}

/**
 * Initialize scheduled sync jobs
 */
function initializeScheduledSync() {
  // Run daily at 2 AM
  const dailySync = cron.schedule('0 2 * * *', async () => {
    await syncAllMerchants();
  }, {
    scheduled: true,
    timezone: "Africa/Nairobi"
  });

  console.log('✅ Shopify scheduled sync initialized (runs daily at 2 AM)');

  return dailySync;
}

/**
 * Manually trigger sync (for testing or admin purposes)
 */
async function triggerManualSync(merchantId = null) {
  try {
    if (merchantId) {
      // Sync specific merchant
      const integration = await ShopifyIntegration.findOne({ merchant: merchantId });
      if (!integration) {
        throw new Error('Shopify integration not found for this merchant');
      }
      return await syncMerchantProducts(integration);
    } else {
      // Sync all merchants
      await syncAllMerchants();
      return { success: true, message: 'Manual sync triggered' };
    }
  } catch (error) {
    console.error('Manual sync error:', error);
    throw error;
  }
}

module.exports = {
  initializeScheduledSync,
  triggerManualSync,
  syncAllMerchants
};
