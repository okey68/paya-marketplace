const express = require('express');
const { query, validationResult } = require('express-validator');
const mongoose = require('mongoose');
const User = require('../models/User');
const Product = require('../models/Product');
const Order = require('../models/Order');
const { optionalAuth } = require('../middleware/auth');

const router = express.Router();

// Get all approved merchants (public) - alias route
router.get('/public', optionalAuth, [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 50 }),
  query('search').optional().trim(),
  query('businessType').optional().trim()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation errors', 
        errors: errors.array() 
      });
    }

    const { page = 1, limit = 20, search, businessType } = req.query;

    const mongoQuery = {
      role: 'merchant',
      'businessInfo.approvalStatus': 'approved',
      isActive: true
    };

    if (search) {
      mongoQuery.$or = [
        { 'businessInfo.businessName': { $regex: search, $options: 'i' } },
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } }
      ];
    }

    if (businessType) {
      mongoQuery['businessInfo.businessType'] = businessType;
    }

    const merchants = await User.find(mongoQuery)
      .select('firstName lastName businessInfo address createdAt')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await User.countDocuments(mongoQuery);

    res.json(merchants);

  } catch (error) {
    console.error('Get public merchants error:', error);
    res.status(500).json({ message: 'Failed to fetch merchants' });
  }
});

// Get all approved merchants (public)
router.get('/', optionalAuth, [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 50 }),
  query('search').optional().trim(),
  query('businessType').optional().trim()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation errors', 
        errors: errors.array() 
      });
    }

    const { page = 1, limit = 20, search, businessType } = req.query;

    const query = {
      role: 'merchant',
      'businessInfo.approvalStatus': 'approved',
      isActive: true
    };

    if (search) {
      query.$or = [
        { 'businessInfo.businessName': { $regex: search, $options: 'i' } },
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } }
      ];
    }

    if (businessType) {
      query['businessInfo.businessType'] = businessType;
    }

    const merchants = await User.find(query)
      .select('firstName lastName businessInfo address createdAt')
      .sort({ 'businessInfo.approvedAt': -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await User.countDocuments(query);

    // Get product counts for each merchant
    const merchantsWithStats = await Promise.all(
      merchants.map(async (merchant) => {
        const productCount = await Product.countDocuments({ 
          merchant: merchant._id, 
          status: 'active' 
        });
        
        return {
          ...merchant.toObject(),
          stats: {
            productCount
          }
        };
      })
    );

    res.json({
      merchants: merchantsWithStats,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: parseInt(limit)
      }
    });

  } catch (error) {
    console.error('Get merchants error:', error);
    res.status(500).json({ message: 'Failed to fetch merchants' });
  }
});

// Get merchant by ID with products (public)
router.get('/:id', optionalAuth, async (req, res) => {
  try {
    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'Invalid merchant ID' });
    }

    const merchant = await User.findOne({
      _id: req.params.id,
      role: 'merchant',
      'businessInfo.approvalStatus': 'approved',
      isActive: true
    }).select('firstName lastName businessInfo address createdAt');

    if (!merchant) {
      return res.status(404).json({ message: 'Merchant not found' });
    }

    // Get merchant's active products
    const products = await Product.find({ 
      merchant: merchant._id, 
      status: 'active' 
    })
    .select('name description price category images inventory createdAt')
    .sort({ createdAt: -1 })
    .limit(20);

    // Get merchant stats
    const totalProducts = await Product.countDocuments({ 
      merchant: merchant._id, 
      status: 'active' 
    });

    const totalOrders = await Order.countDocuments({ 
      'items.merchant': merchant._id 
    });

    res.json({
      merchant: {
        ...merchant.toObject(),
        stats: {
          totalProducts,
          totalOrders,
          memberSince: merchant.createdAt
        }
      },
      products
    });

  } catch (error) {
    console.error('Get merchant error:', error);
    res.status(500).json({ message: 'Failed to fetch merchant' });
  }
});

// Get merchant's products (public)
router.get('/:id/products', optionalAuth, [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 50 }),
  query('category').optional().trim(),
  query('sortBy').optional().isIn(['price', 'name', 'createdAt']),
  query('sortOrder').optional().isIn(['asc', 'desc'])
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
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    // Verify merchant exists and is approved
    const merchant = await User.findOne({
      _id: req.params.id,
      role: 'merchant',
      'businessInfo.approvalStatus': 'approved',
      isActive: true
    });

    if (!merchant) {
      return res.status(404).json({ message: 'Merchant not found' });
    }

    const query = { 
      merchant: req.params.id, 
      status: 'active' 
    };

    if (category) {
      query.category = category;
    }

    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const products = await Product.find(query)
      .sort(sortOptions)
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Product.countDocuments(query);

    res.json({
      products,
      merchant: {
        _id: merchant._id,
        businessName: merchant.businessInfo.businessName,
        firstName: merchant.firstName,
        lastName: merchant.lastName
      },
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

// Get business types (for filtering)
router.get('/meta/business-types', async (req, res) => {
  try {
    const businessTypes = await User.distinct('businessInfo.businessType', {
      role: 'merchant',
      'businessInfo.approvalStatus': 'approved',
      isActive: true,
      'businessInfo.businessType': { $ne: null, $ne: '' }
    });

    res.json({ businessTypes });

  } catch (error) {
    console.error('Get business types error:', error);
    res.status(500).json({ message: 'Failed to fetch business types' });
  }
});

module.exports = router;
