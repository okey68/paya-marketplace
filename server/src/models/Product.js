const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  // Basic Product Info
  name: {
    type: String,
    required: [true, 'Product name is required'],
    trim: true,
    maxlength: [200, 'Product name cannot exceed 200 characters']
  },
  description: {
    type: String,
    required: [true, 'Product description is required'],
    trim: true,
    maxlength: [2000, 'Description cannot exceed 2000 characters']
  },
  
  // Pricing
  price: {
    type: Number,
    required: [true, 'Product price is required'],
    min: [0, 'Price cannot be negative']
  },
  currency: {
    type: String,
    default: 'KES',
    enum: ['KES']
  },
  
  // Taxes and Shipping
  taxRate: {
    type: Number,
    default: 0,
    min: [0, 'Tax rate cannot be negative'],
    max: [1, 'Tax rate cannot exceed 100%']
  },
  shippingCost: {
    type: Number,
    default: 0,
    min: [0, 'Shipping cost cannot be negative']
  },
  
  // Category
  category: {
    type: String,
    required: [true, 'Product category is required'],
    enum: [
      'Electronics',
      'Appliances', 
      'Clothing',
      'Cosmetics',
      'Medical Care',
      'Services',
      'Other'
    ]
  },
  subcategory: {
    type: String,
    trim: true
  },
  
  // Inventory
  inventory: {
    quantity: {
      type: Number,
      required: [true, 'Inventory quantity is required'],
      min: [0, 'Inventory cannot be negative'],
      default: 0
    },
    lowStockThreshold: {
      type: Number,
      default: 5,
      min: [0, 'Low stock threshold cannot be negative']
    },
    trackInventory: {
      type: Boolean,
      default: true
    }
  },
  
  // Product Images
  images: [{
    filename: { type: String, required: true },
    originalName: { type: String, required: true },
    path: { type: String, required: true },
    size: { type: Number, required: true },
    uploadDate: { type: Date, default: Date.now },
    isPrimary: { type: Boolean, default: false }
  }],
  
  // Merchant Info
  merchant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Merchant is required']
  },
  merchantName: {
    type: String,
    required: true
  },
  
  // Product Status
  status: {
    type: String,
    enum: ['draft', 'active', 'inactive', 'out_of_stock'],
    default: 'active'
  },
  
  // SEO and Search
  tags: [{
    type: String,
    trim: true,
    lowercase: true
  }],
  sku: {
    type: String,
    trim: true,
    unique: true,
    sparse: true // Allows multiple null values
  },
  
  // Product Specifications
  specifications: {
    weight: { type: Number }, // in kg
    dimensions: {
      length: { type: Number }, // in cm
      width: { type: Number },
      height: { type: Number }
    },
    color: { type: String, trim: true },
    brand: { type: String, trim: true },
    model: { type: String, trim: true }
  },
  
  // Analytics
  views: {
    type: Number,
    default: 0
  },
  totalSales: {
    type: Number,
    default: 0
  },
  
  // Timestamps
  publishedAt: { type: Date },
  lastModified: { type: Date, default: Date.now }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
productSchema.index({ merchant: 1 });
productSchema.index({ category: 1 });
productSchema.index({ status: 1 });
productSchema.index({ name: 'text', description: 'text', tags: 'text' });
productSchema.index({ price: 1 });
productSchema.index({ 'inventory.quantity': 1 });
productSchema.index({ createdAt: -1 });

// Virtual for total price including tax
productSchema.virtual('totalPrice').get(function() {
  return this.price * (1 + this.taxRate);
});

// Virtual for primary image
productSchema.virtual('primaryImage').get(function() {
  const primary = this.images.find(img => img.isPrimary);
  return primary || this.images[0] || null;
});

// Virtual for stock status
productSchema.virtual('stockStatus').get(function() {
  if (!this.inventory.trackInventory) return 'unlimited';
  if (this.inventory.quantity === 0) return 'out_of_stock';
  if (this.inventory.quantity <= this.inventory.lowStockThreshold) return 'low_stock';
  return 'in_stock';
});

// Virtual for availability
productSchema.virtual('isAvailable').get(function() {
  return this.status === 'active' && 
         (this.inventory.quantity > 0 || !this.inventory.trackInventory);
});

// Pre-save middleware
productSchema.pre('save', function(next) {
  this.lastModified = new Date();
  
  // Auto-generate SKU if not provided
  if (!this.sku) {
    this.sku = `${this.merchant.toString().slice(-6)}-${Date.now()}`;
  }
  
  // Set published date when status changes to active
  if (this.status === 'active' && !this.publishedAt) {
    this.publishedAt = new Date();
  }
  
  // Update status based on inventory
  if (this.inventory.trackInventory && this.inventory.quantity === 0) {
    this.status = 'out_of_stock';
  }
  
  next();
});

// Method to reduce inventory
productSchema.methods.reduceInventory = function(quantity) {
  if (!this.inventory.trackInventory) return true;
  
  if (this.inventory.quantity < quantity) {
    throw new Error('Insufficient inventory');
  }
  
  this.inventory.quantity -= quantity;
  this.totalSales += quantity;
  
  if (this.inventory.quantity === 0) {
    this.status = 'out_of_stock';
  }
  
  return this.save();
};

// Method to increase inventory
productSchema.methods.increaseInventory = function(quantity) {
  this.inventory.quantity += quantity;
  
  if (this.status === 'out_of_stock' && this.inventory.quantity > 0) {
    this.status = 'active';
  }
  
  return this.save();
};

// Static method to find products by merchant
productSchema.statics.findByMerchant = function(merchantId, options = {}) {
  const query = { merchant: merchantId };
  
  if (options.status) query.status = options.status;
  if (options.category) query.category = options.category;
  
  return this.find(query).sort({ createdAt: -1 });
};

// Static method to search products
productSchema.statics.searchProducts = function(searchTerm, filters = {}) {
  const query = {
    $text: { $search: searchTerm },
    status: 'active'
  };
  
  if (filters.category) query.category = filters.category;
  if (filters.merchant) query.merchant = filters.merchant;
  if (filters.priceMin) query.price = { $gte: filters.priceMin };
  if (filters.priceMax) query.price = { ...query.price, $lte: filters.priceMax };
  
  return this.find(query, { score: { $meta: 'textScore' } })
             .sort({ score: { $meta: 'textScore' } });
};

module.exports = mongoose.model('Product', productSchema);
