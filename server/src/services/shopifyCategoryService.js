/**
 * Shopify Category Mapping Service
 * Handles category determination from multiple Shopify sources
 */

const axios = require('axios');

// Paya's allowed categories
const PAYA_CATEGORIES = [
  'Electronics',
  'Appliances',
  'Clothing',
  'Cosmetics',
  'Medical Care',
  'Services',
  'Other',
];

// Expanded case-insensitive default mappings
// Keys are lowercase for case-insensitive matching
const DEFAULT_CATEGORY_MAP = {
  // Electronics
  electronics: 'Electronics',
  tech: 'Electronics',
  technology: 'Electronics',
  gadgets: 'Electronics',
  computers: 'Electronics',
  computer: 'Electronics',
  phones: 'Electronics',
  phone: 'Electronics',
  mobile: 'Electronics',
  tablets: 'Electronics',
  tablet: 'Electronics',
  audio: 'Electronics',
  cameras: 'Electronics',
  camera: 'Electronics',
  gaming: 'Electronics',
  games: 'Electronics',
  'video games': 'Electronics',
  accessories: 'Electronics',
  laptop: 'Electronics',
  laptops: 'Electronics',
  smartphone: 'Electronics',
  smartphones: 'Electronics',
  headphones: 'Electronics',
  speakers: 'Electronics',
  tv: 'Electronics',
  television: 'Electronics',
  'smart home': 'Electronics',
  wearables: 'Electronics',
  smartwatch: 'Electronics',
  earbuds: 'Electronics',
  chargers: 'Electronics',
  cables: 'Electronics',
  pc: 'Electronics',
  desktop: 'Electronics',
  monitors: 'Electronics',
  keyboard: 'Electronics',
  mouse: 'Electronics',
  printers: 'Electronics',
  networking: 'Electronics',
  storage: 'Electronics',
  'hard drives': 'Electronics',
  ssd: 'Electronics',

  // Clothing
  clothing: 'Clothing',
  clothes: 'Clothing',
  apparel: 'Clothing',
  fashion: 'Clothing',
  shirts: 'Clothing',
  shirt: 'Clothing',
  't-shirts': 'Clothing',
  't-shirt': 'Clothing',
  tshirts: 'Clothing',
  pants: 'Clothing',
  trousers: 'Clothing',
  jeans: 'Clothing',
  dresses: 'Clothing',
  dress: 'Clothing',
  shoes: 'Clothing',
  footwear: 'Clothing',
  sneakers: 'Clothing',
  boots: 'Clothing',
  sandals: 'Clothing',
  bags: 'Clothing',
  handbags: 'Clothing',
  purses: 'Clothing',
  jewelry: 'Clothing',
  jewellery: 'Clothing',
  watches: 'Clothing',
  watch: 'Clothing',
  menswear: 'Clothing',
  mens: 'Clothing',
  men: 'Clothing',
  womenswear: 'Clothing',
  womens: 'Clothing',
  women: 'Clothing',
  kids: 'Clothing',
  children: 'Clothing',
  baby: 'Clothing',
  underwear: 'Clothing',
  lingerie: 'Clothing',
  swimwear: 'Clothing',
  activewear: 'Clothing',
  sportswear: 'Clothing',
  outerwear: 'Clothing',
  jackets: 'Clothing',
  coats: 'Clothing',
  sweaters: 'Clothing',
  hoodies: 'Clothing',
  socks: 'Clothing',
  hats: 'Clothing',
  caps: 'Clothing',
  scarves: 'Clothing',
  belts: 'Clothing',
  sunglasses: 'Clothing',
  eyewear: 'Clothing',

  // Appliances
  appliances: 'Appliances',
  appliance: 'Appliances',
  'home & garden': 'Appliances',
  'home and garden': 'Appliances',
  home: 'Appliances',
  kitchen: 'Appliances',
  furniture: 'Appliances',
  lighting: 'Appliances',
  lights: 'Appliances',
  lamps: 'Appliances',
  tools: 'Appliances',
  outdoor: 'Appliances',
  garden: 'Appliances',
  gardening: 'Appliances',
  decor: 'Appliances',
  decoration: 'Appliances',
  'home decor': 'Appliances',
  bedding: 'Appliances',
  bathroom: 'Appliances',
  cleaning: 'Appliances',
  laundry: 'Appliances',
  vacuum: 'Appliances',
  refrigerator: 'Appliances',
  fridge: 'Appliances',
  microwave: 'Appliances',
  oven: 'Appliances',
  stove: 'Appliances',
  dishwasher: 'Appliances',
  washer: 'Appliances',
  dryer: 'Appliances',
  'air conditioner': 'Appliances',
  ac: 'Appliances',
  heater: 'Appliances',
  fan: 'Appliances',
  blender: 'Appliances',
  mixer: 'Appliances',
  'coffee maker': 'Appliances',
  toaster: 'Appliances',
  cookware: 'Appliances',
  kitchenware: 'Appliances',
  tableware: 'Appliances',
  storage: 'Appliances',
  organization: 'Appliances',
  rugs: 'Appliances',
  curtains: 'Appliances',
  mattress: 'Appliances',
  pillow: 'Appliances',

  // Cosmetics
  beauty: 'Cosmetics',
  cosmetics: 'Cosmetics',
  cosmetic: 'Cosmetics',
  skincare: 'Cosmetics',
  'skin care': 'Cosmetics',
  makeup: 'Cosmetics',
  'make up': 'Cosmetics',
  fragrance: 'Cosmetics',
  fragrances: 'Cosmetics',
  perfume: 'Cosmetics',
  cologne: 'Cosmetics',
  'personal care': 'Cosmetics',
  'hair care': 'Cosmetics',
  haircare: 'Cosmetics',
  hair: 'Cosmetics',
  grooming: 'Cosmetics',
  bath: 'Cosmetics',
  body: 'Cosmetics',
  'bath & body': 'Cosmetics',
  lotion: 'Cosmetics',
  cream: 'Cosmetics',
  moisturizer: 'Cosmetics',
  serum: 'Cosmetics',
  cleanser: 'Cosmetics',
  shampoo: 'Cosmetics',
  conditioner: 'Cosmetics',
  soap: 'Cosmetics',
  deodorant: 'Cosmetics',
  nail: 'Cosmetics',
  'nail polish': 'Cosmetics',
  lipstick: 'Cosmetics',
  mascara: 'Cosmetics',
  foundation: 'Cosmetics',
  concealer: 'Cosmetics',
  eyeshadow: 'Cosmetics',
  eyeliner: 'Cosmetics',
  brushes: 'Cosmetics',
  tools: 'Cosmetics',
  spa: 'Cosmetics',
  wellness: 'Cosmetics',

  // Medical Care
  health: 'Medical Care',
  healthcare: 'Medical Care',
  'health care': 'Medical Care',
  medical: 'Medical Care',
  medicine: 'Medical Care',
  supplements: 'Medical Care',
  vitamins: 'Medical Care',
  vitamin: 'Medical Care',
  fitness: 'Medical Care',
  pharmacy: 'Medical Care',
  pharmaceutical: 'Medical Care',
  'first aid': 'Medical Care',
  nutrition: 'Medical Care',
  protein: 'Medical Care',
  diet: 'Medical Care',
  'weight loss': 'Medical Care',
  exercise: 'Medical Care',
  workout: 'Medical Care',
  gym: 'Medical Care',
  'sports nutrition': 'Medical Care',
  herbal: 'Medical Care',
  'natural remedies': 'Medical Care',
  'essential oils': 'Medical Care',
  'medical equipment': 'Medical Care',
  mobility: 'Medical Care',
  therapy: 'Medical Care',
  recovery: 'Medical Care',
  'pain relief': 'Medical Care',
  'oral care': 'Medical Care',
  dental: 'Medical Care',
  'eye care': 'Medical Care',
  'contact lenses': 'Medical Care',

  // Services
  services: 'Services',
  service: 'Services',
  digital: 'Services',
  'digital products': 'Services',
  subscriptions: 'Services',
  subscription: 'Services',
  'gift cards': 'Services',
  'gift card': 'Services',
  giftcard: 'Services',
  consulting: 'Services',
  consultation: 'Services',
  courses: 'Services',
  course: 'Services',
  training: 'Services',
  education: 'Services',
  ebooks: 'Services',
  ebook: 'Services',
  software: 'Services',
  apps: 'Services',
  downloads: 'Services',
  memberships: 'Services',
  membership: 'Services',
  tickets: 'Services',
  events: 'Services',
  booking: 'Services',
  reservation: 'Services',
  installation: 'Services',
  repair: 'Services',
  maintenance: 'Services',
  warranty: 'Services',
  insurance: 'Services',
  plans: 'Services',
};

/**
 * Determine category for a Shopify product
 * Priority: Merchant mappings > Default mappings > Tags matching > Default category
 * @param {Object} shopifyProduct - The Shopify product object
 * @param {Array} merchantMappings - Merchant's custom category mappings
 * @param {string} defaultCategory - Default category if no match found
 * @returns {Object} - { category: string, source: string }
 */
function determineCategory(
  shopifyProduct,
  merchantMappings = [],
  defaultCategory = 'Other'
) {
  const productType = shopifyProduct.product_type || '';
  const tags = shopifyProduct.tags || '';
  const title = shopifyProduct.title || '';
  const vendor = shopifyProduct.vendor || '';

  // 1. Check merchant's custom mappings first (highest priority)
  if (merchantMappings && merchantMappings.length > 0) {
    // Sort by priority (lower number = higher priority)
    const sortedMappings = [...merchantMappings].sort(
      (a, b) => (a.priority || 0) - (b.priority || 0)
    );

    for (const mapping of sortedMappings) {
      const sourceValue = mapping.sourceValue.toLowerCase();

      if (
        mapping.sourceType === 'product_type' &&
        productType.toLowerCase() === sourceValue
      ) {
        return { category: mapping.payaCategory, source: 'merchant_mapping' };
      }

      if (mapping.sourceType === 'tag') {
        const tagArray = tags.split(',').map((t) => t.trim().toLowerCase());
        if (tagArray.includes(sourceValue)) {
          return { category: mapping.payaCategory, source: 'merchant_mapping' };
        }
      }

      // Collection mappings would be checked against product's collection IDs
      // This requires fetching collection associations separately
    }
  }

  // 2. Try to match product_type against default mappings (case-insensitive)
  if (productType) {
    const normalizedType = productType.toLowerCase().trim();

    // Exact match
    if (DEFAULT_CATEGORY_MAP[normalizedType]) {
      return {
        category: DEFAULT_CATEGORY_MAP[normalizedType],
        source: 'product_type',
      };
    }

    // Partial match - check if product_type contains any keyword
    for (const [keyword, category] of Object.entries(DEFAULT_CATEGORY_MAP)) {
      if (
        normalizedType.includes(keyword) ||
        keyword.includes(normalizedType)
      ) {
        return { category, source: 'product_type' };
      }
    }
  }

  // 3. Try to match tags against default mappings
  if (tags) {
    const tagArray = tags.split(',').map((t) => t.trim().toLowerCase());

    for (const tag of tagArray) {
      // Exact match
      if (DEFAULT_CATEGORY_MAP[tag]) {
        return { category: DEFAULT_CATEGORY_MAP[tag], source: 'tag' };
      }

      // Partial match
      for (const [keyword, category] of Object.entries(DEFAULT_CATEGORY_MAP)) {
        if (tag.includes(keyword) || keyword.includes(tag)) {
          return { category, source: 'tag' };
        }
      }
    }
  }

  // 4. Try to infer from product title (last resort)
  if (title) {
    const normalizedTitle = title.toLowerCase();

    for (const [keyword, category] of Object.entries(DEFAULT_CATEGORY_MAP)) {
      if (normalizedTitle.includes(keyword)) {
        return { category, source: 'title' };
      }
    }
  }

  // 5. Fall back to default category
  return { category: defaultCategory, source: 'default' };
}

/**
 * Simple category mapping - passes through Shopify product_type directly
 * @param {string} shopifyType - The Shopify product_type
 * @returns {string} - The category (same as Shopify product_type, or 'Uncategorized' if empty)
 */
function mapCategory(shopifyType) {
  if (!shopifyType || !shopifyType.trim()) {
    return 'Uncategorized';
  }
  // Return the Shopify product_type as-is
  return shopifyType.trim();
}

/**
 * Fetch all collections from a Shopify store
 * @param {string} shop - The shop domain (e.g., 'mystore.myshopify.com')
 * @param {string} accessToken - The Shopify access token
 * @returns {Array} - Array of collection objects
 */
async function fetchShopifyCollections(shop, accessToken) {
  const collections = [];
  let pageInfo = null;

  try {
    do {
      const url = pageInfo
        ? `https://${shop}/admin/api/2024-01/custom_collections.json?limit=250&page_info=${pageInfo}`
        : `https://${shop}/admin/api/2024-01/custom_collections.json?limit=250`;

      const response = await axios.get(url, {
        headers: {
          'X-Shopify-Access-Token': accessToken,
          'Content-Type': 'application/json',
        },
      });

      if (response.data.custom_collections) {
        collections.push(
          ...response.data.custom_collections.map((c) => ({
            id: c.id.toString(),
            title: c.title,
            handle: c.handle,
          }))
        );
      }

      // Check for pagination
      const linkHeader = response.headers.link;
      if (linkHeader && linkHeader.includes('rel="next"')) {
        const match = linkHeader.match(/page_info=([^>&]*)/);
        pageInfo = match ? match[1] : null;
      } else {
        pageInfo = null;
      }

      // Rate limiting
      await new Promise((resolve) => setTimeout(resolve, 500));
    } while (pageInfo);

    // Also fetch smart collections
    pageInfo = null;
    do {
      const url = pageInfo
        ? `https://${shop}/admin/api/2024-01/smart_collections.json?limit=250&page_info=${pageInfo}`
        : `https://${shop}/admin/api/2024-01/smart_collections.json?limit=250`;

      const response = await axios.get(url, {
        headers: {
          'X-Shopify-Access-Token': accessToken,
          'Content-Type': 'application/json',
        },
      });

      if (response.data.smart_collections) {
        collections.push(
          ...response.data.smart_collections.map((c) => ({
            id: c.id.toString(),
            title: c.title,
            handle: c.handle,
            isSmartCollection: true,
          }))
        );
      }

      // Check for pagination
      const linkHeader = response.headers.link;
      if (linkHeader && linkHeader.includes('rel="next"')) {
        const match = linkHeader.match(/page_info=([^>&]*)/);
        pageInfo = match ? match[1] : null;
      } else {
        pageInfo = null;
      }

      await new Promise((resolve) => setTimeout(resolve, 500));
    } while (pageInfo);

    return collections;
  } catch (error) {
    console.error('Error fetching Shopify collections:', error.message);
    return [];
  }
}

/**
 * Fetch unique product types from a Shopify store
 * @param {string} shop - The shop domain
 * @param {string} accessToken - The Shopify access token
 * @returns {Array} - Array of unique product type strings
 */
async function fetchShopifyProductTypes(shop, accessToken) {
  const productTypes = new Set();
  let pageInfo = null;

  try {
    do {
      const url = pageInfo
        ? `https://${shop}/admin/api/2024-01/products.json?limit=250&fields=product_type&page_info=${pageInfo}`
        : `https://${shop}/admin/api/2024-01/products.json?limit=250&fields=product_type`;

      const response = await axios.get(url, {
        headers: {
          'X-Shopify-Access-Token': accessToken,
          'Content-Type': 'application/json',
        },
      });

      if (response.data.products) {
        response.data.products.forEach((p) => {
          if (p.product_type && p.product_type.trim()) {
            productTypes.add(p.product_type.trim());
          }
        });
      }

      // Check for pagination
      const linkHeader = response.headers.link;
      if (linkHeader && linkHeader.includes('rel="next"')) {
        const match = linkHeader.match(/page_info=([^>&]*)/);
        pageInfo = match ? match[1] : null;
      } else {
        pageInfo = null;
      }

      await new Promise((resolve) => setTimeout(resolve, 500));
    } while (pageInfo);

    return Array.from(productTypes).sort();
  } catch (error) {
    console.error('Error fetching Shopify product types:', error.message);
    return [];
  }
}

/**
 * Get unique tags from Shopify products
 * @param {string} shop - The shop domain
 * @param {string} accessToken - The Shopify access token
 * @returns {Array} - Array of unique tag strings
 */
async function fetchShopifyTags(shop, accessToken) {
  const tags = new Set();
  let pageInfo = null;

  try {
    do {
      const url = pageInfo
        ? `https://${shop}/admin/api/2024-01/products.json?limit=250&fields=tags&page_info=${pageInfo}`
        : `https://${shop}/admin/api/2024-01/products.json?limit=250&fields=tags`;

      const response = await axios.get(url, {
        headers: {
          'X-Shopify-Access-Token': accessToken,
          'Content-Type': 'application/json',
        },
      });

      if (response.data.products) {
        response.data.products.forEach((p) => {
          if (p.tags) {
            p.tags.split(',').forEach((tag) => {
              const trimmed = tag.trim();
              if (trimmed) tags.add(trimmed);
            });
          }
        });
      }

      // Check for pagination
      const linkHeader = response.headers.link;
      if (linkHeader && linkHeader.includes('rel="next"')) {
        const match = linkHeader.match(/page_info=([^>&]*)/);
        pageInfo = match ? match[1] : null;
      } else {
        pageInfo = null;
      }

      await new Promise((resolve) => setTimeout(resolve, 500));
    } while (pageInfo);

    return Array.from(tags).sort();
  } catch (error) {
    console.error('Error fetching Shopify tags:', error.message);
    return [];
  }
}

module.exports = {
  PAYA_CATEGORIES,
  DEFAULT_CATEGORY_MAP,
  determineCategory,
  mapCategory,
  fetchShopifyCollections,
  fetchShopifyProductTypes,
  fetchShopifyTags,
};
