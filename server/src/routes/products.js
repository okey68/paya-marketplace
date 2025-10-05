const express = require('express');
const { body, query, validationResult } = require('express-validator');
const Product = require('../models/Product');
const { authenticateToken, requireApprovedMerchant, optionalAuth } = require('../middleware/auth');

const router = express.Router();

// Get all active products for marketplace (public) - MUST be before /:id route
router.get('/public', async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      category,
      search,
      minPrice,
      maxPrice,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    // Build query for active products only
    const query = { status: 'active' };
    
    if (category) {
      query.category = category;
    }
    
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } }
      ];
    }
    
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = parseFloat(minPrice);
      if (maxPrice) query.price.$lte = parseFloat(maxPrice);
    }

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const [products, total] = await Promise.all([
      Product.find(query)
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      Product.countDocuments(query)
    ]);

    res.json({
      products: products,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        totalProducts: total,
        hasNext: skip + parseInt(limit) < total,
        hasPrev: parseInt(page) > 1
      }
    });
  } catch (error) {
    console.error('Error fetching public products:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all products (public with optional auth for personalization)
router.get('/', optionalAuth, [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('Limit must be between 1 and 50'),
  query('category').optional().trim(),
  query('search').optional().trim(),
  query('merchant').optional().isMongoId().withMessage('Invalid merchant ID'),
  query('sortBy').optional().isIn(['price', 'name', 'createdAt', 'popularity']),
  query('sortOrder').optional().isIn(['asc', 'desc']),
  query('priceMin').optional().isFloat({ min: 0 }),
  query('priceMax').optional().isFloat({ min: 0 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation errors', 
        errors: errors.array() 
      });
    }

    const {
      page = 1,
      limit = 20,
      category,
      search,
      merchant,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      priceMin,
      priceMax
    } = req.query;

    // Build query
    const query = { status: 'active' };
    
    if (category) query.category = category;
    if (merchant) query.merchant = merchant;
    
    if (priceMin || priceMax) {
      query.price = {};
      if (priceMin) query.price.$gte = parseFloat(priceMin);
      if (priceMax) query.price.$lte = parseFloat(priceMax);
    }

    let products;
    let total;

    if (search) {
      // Text search
      products = await Product.searchProducts(search, { category, merchant, priceMin, priceMax })
        .populate('merchant', 'businessInfo.businessName firstName lastName')
        .limit(limit * 1)
        .skip((page - 1) * limit);
      
      total = await Product.countDocuments({
        ...query,
        $text: { $search: search }
      });
    } else {
      // Regular query with sorting
      const sortOptions = {};
      sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

      products = await Product.find(query)
        .populate('merchant', 'businessInfo.businessName firstName lastName')
        .sort(sortOptions)
        .limit(limit * 1)
        .skip((page - 1) * limit);

      total = await Product.countDocuments(query);
    }

    res.json({
      products,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: parseInt(limit)
      }
    });

  } catch (error) {
    console.error('Get products error:', error);
    res.status(500).json({ message: 'Failed to fetch products' });
  }
});

// Get single product by ID (public)
router.get('/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id)
      .populate('merchant', 'businessInfo.businessName firstName lastName address');

    if (!product || product.status !== 'active') {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Increment views
    product.views += 1;
    await product.save();

    res.json(product);

  } catch (error) {
    console.error('Get product error:', error);
    res.status(500).json({ message: 'Failed to fetch product' });
  }
});

// Get products by category (public)
router.get('/category/:category', optionalAuth, async (req, res) => {
  try {
    const { category } = req.params;
    const { page = 1, limit = 20, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;

    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const products = await Product.find({ category, status: 'active' })
      .populate('merchant', 'businessInfo.businessName firstName lastName')
      .sort(sortOptions)
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Product.countDocuments({ category, status: 'active' });

    res.json({
      products,
      category,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: parseInt(limit)
      }
    });

  } catch (error) {
    console.error('Get products by category error:', error);
    res.status(500).json({ message: 'Failed to fetch products by category' });
  }
});

// Create new product (merchant only)
router.post('/', authenticateToken, requireApprovedMerchant, [
  body('name').trim().isLength({ min: 1, max: 200 }).withMessage('Product name is required (max 200 chars)'),
  body('description').trim().isLength({ min: 1, max: 2000 }).withMessage('Description is required (max 2000 chars)'),
  body('price').isFloat({ min: 0 }).withMessage('Price must be a positive number'),
  body('category').isIn(['Electronics', 'Appliances', 'Clothing', 'Cosmetics', 'Medical Care', 'Services', 'Other']).withMessage('Invalid category'),
  body('inventory.quantity').isInt({ min: 0 }).withMessage('Inventory quantity must be non-negative'),
  body('taxRate').optional().isFloat({ min: 0, max: 1 }).withMessage('Tax rate must be between 0 and 1'),
  body('shippingCost').optional().isFloat({ min: 0 }).withMessage('Shipping cost must be non-negative')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation errors', 
        errors: errors.array() 
      });
    }

    const productData = {
      ...req.body,
      merchant: req.user._id,
      merchantName: req.user.businessInfo.businessName
    };

    const product = new Product(productData);
    await product.save();

    await product.populate('merchant', 'businessInfo.businessName firstName lastName');

    res.status(201).json({
      message: 'Product created successfully',
      product
    });

  } catch (error) {
    console.error('Create product error:', error);
    res.status(500).json({ message: 'Failed to create product' });
  }
});

// Update product (merchant only - own products)
router.put('/:id', authenticateToken, requireApprovedMerchant, [
  body('name').optional().trim().isLength({ min: 1, max: 200 }),
  body('description').optional().trim().isLength({ min: 1, max: 2000 }),
  body('price').optional().isFloat({ min: 0 }),
  body('category').optional().isIn(['Electronics', 'Appliances', 'Clothing', 'Cosmetics', 'Medical Care', 'Services', 'Other']),
  body('inventory.quantity').optional().isInt({ min: 0 }),
  body('taxRate').optional().isFloat({ min: 0, max: 1 }),
  body('shippingCost').optional().isFloat({ min: 0 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation errors', 
        errors: errors.array() 
      });
    }

    const product = await Product.findOne({ 
      _id: req.params.id, 
      merchant: req.user._id 
    });

    if (!product) {
      return res.status(404).json({ message: 'Product not found or access denied' });
    }

    // Update fields
    Object.keys(req.body).forEach(key => {
      if (key === 'inventory' && typeof req.body[key] === 'object') {
        Object.keys(req.body[key]).forEach(invKey => {
          product.inventory[invKey] = req.body[key][invKey];
        });
      } else {
        product[key] = req.body[key];
      }
    });

    await product.save();
    await product.populate('merchant', 'businessInfo.businessName firstName lastName');

    res.json({
      message: 'Product updated successfully',
      product
    });

  } catch (error) {
    console.error('Update product error:', error);
    res.status(500).json({ message: 'Failed to update product' });
  }
});

// Delete product (merchant only - own products)
router.delete('/:id', authenticateToken, requireApprovedMerchant, async (req, res) => {
  try {
    const product = await Product.findOne({ 
      _id: req.params.id, 
      merchant: req.user._id 
    });

    if (!product) {
      return res.status(404).json({ message: 'Product not found or access denied' });
    }

    await Product.findByIdAndDelete(req.params.id);

    res.json({ message: 'Product deleted successfully' });

  } catch (error) {
    console.error('Delete product error:', error);
    res.status(500).json({ message: 'Failed to delete product' });
  }
});

// Get merchant's products
router.get('/merchant/my-products', authenticateToken, requireApprovedMerchant, async (req, res) => {
  try {
    const { page = 1, limit = 20, status, category } = req.query;

    const products = await Product.findByMerchant(req.user._id, { status, category })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Product.countDocuments({ 
      merchant: req.user._id,
      ...(status && { status }),
      ...(category && { category })
    });

    res.json({
      products,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: parseInt(limit)
      }
    });

  } catch (error) {
    console.error('Get merchant products error:', error);
    res.status(500).json({ message: 'Failed to fetch merchant products' });
  }
});

// Update product inventory
router.patch('/:id/inventory', authenticateToken, requireApprovedMerchant, [
  body('quantity').isInt({ min: 0 }).withMessage('Quantity must be non-negative integer'),
  body('operation').isIn(['set', 'add', 'subtract']).withMessage('Operation must be set, add, or subtract')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation errors', 
        errors: errors.array() 
      });
    }

    const { quantity, operation = 'set' } = req.body;

    const product = await Product.findOne({ 
      _id: req.params.id, 
      merchant: req.user._id 
    });

    if (!product) {
      return res.status(404).json({ message: 'Product not found or access denied' });
    }

    switch (operation) {
      case 'set':
        product.inventory.quantity = quantity;
        break;
      case 'add':
        product.inventory.quantity += quantity;
        break;
      case 'subtract':
        product.inventory.quantity = Math.max(0, product.inventory.quantity - quantity);
        break;
    }

    await product.save();

    res.json({
      message: 'Inventory updated successfully',
      inventory: product.inventory
    });

  } catch (error) {
    console.error('Update inventory error:', error);
    res.status(500).json({ message: 'Failed to update inventory' });
  }
});

module.exports = router;
