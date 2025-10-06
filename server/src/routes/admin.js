const express = require('express');
const { body, query, validationResult } = require('express-validator');
const User = require('../models/User');
const Product = require('../models/Product');
const Order = require('../models/Order');
const { authenticateToken, requireRole } = require('../middleware/auth');

const router = express.Router();

// Seed database with test accounts (unprotected, call once to create test data)
router.post('/seed-database', async (req, res) => {
  try {
    const results = {
      admin: null,
      merchant: null
    };

    // 1. Create Admin Account
    const existingAdmin = await User.findOne({ email: 'admin@paya.com' });
    
    if (existingAdmin) {
      results.admin = 'Admin account already exists';
    } else {
      const adminUser = new User({
        firstName: 'Paya',
        lastName: 'Admin',
        email: 'admin@paya.com',
        password: 'admin123',
        role: 'admin',
        isActive: true,
        isVerified: true,
        phone: '+254700000001',
        address: {
          street: 'Admin Street',
          city: 'Nairobi',
          county: 'Nairobi',
          postalCode: '00100',
          country: 'Kenya'
        }
      });

      await adminUser.save();
      results.admin = 'Admin account created successfully';
    }

    // 2. Create Merchant Account
    const existingMerchant = await User.findOne({ email: 'merchant@paya.com' });
    
    if (existingMerchant) {
      results.merchant = 'Merchant account already exists';
    } else {
      const merchantUser = new User({
        firstName: 'Test',
        lastName: 'Merchant',
        email: 'merchant@paya.com',
        password: 'merchant123',
        role: 'merchant',
        isActive: true,
        isVerified: true,
        phone: '+254700000002',
        address: {
          street: '123 Business Avenue',
          city: 'Nairobi',
          county: 'Nairobi',
          postalCode: '00100',
          country: 'Kenya'
        },
        business: {
          name: 'Test Merchant Store',
          description: 'A test merchant store for development and testing',
          category: 'Electronics',
          registrationNumber: 'TEST-BIZ-001',
          taxId: 'TAX-001',
          bankAccount: {
            bankName: 'Test Bank',
            accountNumber: '1234567890',
            accountName: 'Test Merchant Store'
          },
          documents: {
            businessLicense: {
              filename: 'test-license.pdf',
              uploadDate: new Date()
            },
            taxCertificate: {
              filename: 'test-tax-cert.pdf',
              uploadDate: new Date()
            }
          },
          verificationStatus: 'approved',
          approvedAt: new Date()
        }
      });

      await merchantUser.save();
      results.merchant = 'Merchant account created successfully';
    }

    res.json({ 
      message: 'Database seeding complete',
      results,
      accounts: {
        admin: {
          email: 'admin@paya.com',
          password: 'admin123',
          urls: {
            dev: 'http://localhost:3001',
            prod: 'https://paya-marketplace-admin.netlify.app'
          }
        },
        merchant: {
          email: 'merchant@paya.com',
          password: 'merchant123',
          business: 'Test Merchant Store',
          urls: {
            dev: 'http://localhost:3002',
            prod: 'https://paya-marketplace-merchant.netlify.app'
          }
        }
      }
    });
  } catch (error) {
    console.error('Error seeding database:', error);
    res.status(500).json({ message: 'Error seeding database', error: error.message });
  }
});

// All other admin routes require admin role
router.use(authenticateToken, requireRole('admin'));

// Dashboard statistics
router.get('/stats', async (req, res) => {
  try {
    const { period = '30d' } = req.query;

    // Calculate date range
    const now = new Date();
    const dateRanges = {
      '7d': new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
      '30d': new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
      '6m': new Date(now.getTime() - 6 * 30 * 24 * 60 * 60 * 1000),
      '1y': new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000)
    };

    const dateFrom = dateRanges[period] || dateRanges['30d'];

    // Get basic counts
    const totalUsers = await User.countDocuments({ isActive: true });
    const totalCustomers = await User.countDocuments({ role: 'customer', isActive: true });
    const totalMerchants = await User.countDocuments({ role: 'merchant', isActive: true });
    const approvedMerchants = await User.countDocuments({ 
      role: 'merchant', 
      'businessInfo.approvalStatus': 'approved',
      isActive: true 
    });
    const pendingMerchants = await User.countDocuments({ 
      role: 'merchant', 
      'businessInfo.approvalStatus': 'pending',
      isActive: true 
    });

    const totalProducts = await Product.countDocuments({ status: 'active' });
    const totalOrders = await Order.countDocuments();
    const recentOrders = await Order.countDocuments({ 
      createdAt: { $gte: dateFrom } 
    });

    // Order statistics for the period
    const orderStats = await Order.aggregate([
      { $match: { createdAt: { $gte: dateFrom } } },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$totalAmount' },
          totalAdvanced: { $sum: '$payment.bnpl.advanceAmount' },
          averageOrderValue: { $avg: '$totalAmount' }
        }
      }
    ]);

    const stats = orderStats[0] || {
      totalRevenue: 0,
      totalAdvanced: 0,
      averageOrderValue: 0
    };

    // Recent activity
    const recentUsers = await User.find({ isActive: true })
      .sort({ createdAt: -1 })
      .limit(5)
      .select('firstName lastName email role createdAt businessInfo.businessName');

    const recentOrdersList = await Order.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('customer', 'firstName lastName')
      .select('orderNumber totalAmount status createdAt');

    res.json({
      period,
      overview: {
        totalUsers,
        totalCustomers,
        totalMerchants,
        approvedMerchants,
        pendingMerchants,
        totalProducts,
        totalOrders,
        recentOrders
      },
      financial: {
        totalRevenue: stats.totalRevenue,
        totalAdvanced: stats.totalAdvanced,
        averageOrderValue: stats.averageOrderValue,
        advanceRate: stats.totalRevenue > 0 ? (stats.totalAdvanced / stats.totalRevenue) : 0
      },
      recent: {
        users: recentUsers,
        orders: recentOrdersList
      }
    });

  } catch (error) {
    console.error('Get admin stats error:', error);
    res.status(500).json({ message: 'Failed to fetch statistics' });
  }
});

// Get all merchants with approval status
router.get('/merchants', [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('status').optional().isIn(['pending', 'approved', 'rejected']),
  query('search').optional().trim()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation errors', 
        errors: errors.array() 
      });
    }

    const { page = 1, limit = 20, status, search } = req.query;

    const query = { role: 'merchant', isActive: true };
    
    if (status) {
      query['businessInfo.approvalStatus'] = status;
    }

    if (search) {
      query.$or = [
        { 'businessInfo.businessName': { $regex: search, $options: 'i' } },
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    const merchants = await User.find(query)
      .select('-password')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await User.countDocuments(query);

    // Get additional stats for each merchant
    const merchantsWithStats = await Promise.all(
      merchants.map(async (merchant) => {
        const productCount = await Product.countDocuments({ merchant: merchant._id });
        const orderCount = await Order.countDocuments({ 'items.merchant': merchant._id });
        
        return {
          ...merchant.toObject(),
          stats: {
            productCount,
            orderCount
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

// Approve/reject merchant
router.patch('/merchants/:id/approval', [
  body('status').isIn(['approved', 'rejected']).withMessage('Status must be approved or rejected'),
  body('rejectionReason').optional().trim()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation errors', 
        errors: errors.array() 
      });
    }

    const { status, rejectionReason } = req.body;

    const merchant = await User.findOne({ 
      _id: req.params.id, 
      role: 'merchant' 
    });

    if (!merchant) {
      return res.status(404).json({ message: 'Merchant not found' });
    }

    merchant.businessInfo.approvalStatus = status;

    if (status === 'approved') {
      merchant.businessInfo.approvedAt = new Date();
      merchant.businessInfo.rejectedAt = null;
      merchant.businessInfo.rejectionReason = null;
    } else if (status === 'rejected') {
      merchant.businessInfo.rejectedAt = new Date();
      merchant.businessInfo.rejectionReason = rejectionReason;
      merchant.businessInfo.approvedAt = null;
    }

    await merchant.save();

    res.json({
      message: `Merchant ${status} successfully`,
      merchant: merchant.toSafeObject()
    });

  } catch (error) {
    console.error('Update merchant approval error:', error);
    res.status(500).json({ message: 'Failed to update merchant approval' });
  }
});

// Get all orders with advanced filtering
router.get('/orders', [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('status').optional().trim(),
  query('merchant').optional().isMongoId(),
  query('dateFrom').optional().isISO8601(),
  query('dateTo').optional().isISO8601(),
  query('search').optional().trim()
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
      status, 
      merchant, 
      dateFrom, 
      dateTo, 
      search 
    } = req.query;

    const query = {};
    
    if (status) query.status = status;
    if (merchant) query['items.merchant'] = merchant;
    
    if (dateFrom || dateTo) {
      query.createdAt = {};
      if (dateFrom) query.createdAt.$gte = new Date(dateFrom);
      if (dateTo) query.createdAt.$lte = new Date(dateTo);
    }

    if (search) {
      query.$or = [
        { orderNumber: { $regex: search, $options: 'i' } },
        { 'customerInfo.firstName': { $regex: search, $options: 'i' } },
        { 'customerInfo.lastName': { $regex: search, $options: 'i' } },
        { 'customerInfo.email': { $regex: search, $options: 'i' } }
      ];
    }

    const orders = await Order.find(query)
      .populate('customer', 'firstName lastName email')
      .populate('items.merchant', 'businessInfo.businessName firstName lastName')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Order.countDocuments(query);

    // Calculate totals for current query
    const totals = await Order.aggregate([
      { $match: query },
      {
        $group: {
          _id: null,
          totalAmount: { $sum: '$totalAmount' },
          totalAdvanced: { $sum: '$payment.bnpl.advanceAmount' }
        }
      }
    ]);

    res.json({
      orders,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: parseInt(limit)
      },
      totals: totals[0] || { totalAmount: 0, totalAdvanced: 0 }
    });

  } catch (error) {
    console.error('Get admin orders error:', error);
    res.status(500).json({ message: 'Failed to fetch orders' });
  }
});

// Get all products with merchant info
router.get('/products', [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('status').optional().trim(),
  query('category').optional().trim(),
  query('merchant').optional().isMongoId(),
  query('search').optional().trim()
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
      status, 
      category, 
      merchant, 
      search 
    } = req.query;

    const query = {};
    
    if (status) query.status = status;
    if (category) query.category = category;
    if (merchant) query.merchant = merchant;

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { sku: { $regex: search, $options: 'i' } }
      ];
    }

    const products = await Product.find(query)
      .populate('merchant', 'businessInfo.businessName firstName lastName')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Product.countDocuments(query);

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
    console.error('Get admin products error:', error);
    res.status(500).json({ message: 'Failed to fetch products' });
  }
});

// Get all users
router.get('/users', [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('role').optional().isIn(['customer', 'merchant', 'admin']),
  query('search').optional().trim()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation errors', 
        errors: errors.array() 
      });
    }

    const { page = 1, limit = 20, role, search } = req.query;

    const query = { isActive: true };
    
    if (role) query.role = role;

    if (search) {
      query.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { 'businessInfo.businessName': { $regex: search, $options: 'i' } }
      ];
    }

    const users = await User.find(query)
      .select('-password')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await User.countDocuments(query);

    res.json({
      users,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: parseInt(limit)
      }
    });

  } catch (error) {
    console.error('Get admin users error:', error);
    res.status(500).json({ message: 'Failed to fetch users' });
  }
});

module.exports = router;
