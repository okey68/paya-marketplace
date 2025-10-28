const express = require('express');
const { body, query, validationResult } = require('express-validator');
const User = require('../models/User');
const Product = require('../models/Product');
const Order = require('../models/Order');
const { authenticateToken, requireRole } = require('../middleware/auth');

// Sample products data
const sampleProducts = [
  {
    name: 'iPhone 15 Pro',
    description: 'Latest iPhone with titanium design, A17 Pro chip, and advanced camera system. Perfect for photography and professional use.',
    price: 120000,
    category: 'Electronics',
    stock: 25,
    sku: 'IPH15PRO001',
    weight: 0.187,
    dimensions: { length: 14.67, width: 7.09, height: 0.83 },
    tags: ['smartphone', 'apple', 'premium', 'camera'],
    status: 'active'
  },
  {
    name: 'Samsung Galaxy S24 Ultra',
    description: 'Flagship Android phone with S Pen, 200MP camera, and AI features. Built for productivity and creativity.',
    price: 135000,
    category: 'Electronics',
    stock: 18,
    sku: 'SAM24ULTRA001',
    weight: 0.232,
    dimensions: { length: 16.26, width: 7.90, height: 0.86 },
    tags: ['smartphone', 'samsung', 'android', 's-pen'],
    status: 'active'
  },
  {
    name: 'MacBook Air M3',
    description: 'Ultra-thin laptop with M3 chip, all-day battery life, and stunning Retina display. Perfect for students and professionals.',
    price: 180000,
    category: 'Electronics',
    stock: 12,
    sku: 'MBA13M3001',
    weight: 1.24,
    dimensions: { length: 30.41, width: 21.5, height: 1.13 },
    tags: ['laptop', 'apple', 'macbook', 'portable'],
    status: 'active'
  },
  {
    name: 'Sony WH-1000XM5 Headphones',
    description: 'Industry-leading noise canceling headphones with exceptional sound quality and 30-hour battery life.',
    price: 45000,
    category: 'Electronics',
    stock: 35,
    sku: 'SONYWH1000XM5',
    weight: 0.249,
    dimensions: { length: 26.4, width: 19.5, height: 8.0 },
    tags: ['headphones', 'sony', 'noise-canceling', 'wireless'],
    status: 'active'
  },
  {
    name: 'Nike Air Max 270',
    description: 'Comfortable lifestyle sneakers with Max Air unit for all-day comfort. Perfect for casual wear and light exercise.',
    price: 15000,
    category: 'Clothing',
    stock: 50,
    sku: 'NIKEAM270001',
    weight: 0.4,
    dimensions: { length: 32, width: 12, height: 11 },
    tags: ['shoes', 'nike', 'sneakers', 'casual'],
    status: 'active'
  },
  {
    name: 'Levi\'s 501 Original Jeans',
    description: 'Classic straight-leg jeans with authentic fit and timeless style. Made from premium denim.',
    price: 8500,
    category: 'Clothing',
    stock: 40,
    sku: 'LEVI501001',
    weight: 0.6,
    dimensions: { length: 110, width: 45, height: 2 },
    tags: ['jeans', 'levis', 'denim', 'classic'],
    status: 'active'
  },
  {
    name: 'Instant Pot Duo 7-in-1',
    description: 'Multi-functional pressure cooker that replaces 7 kitchen appliances. Perfect for quick and healthy meals.',
    price: 12000,
    category: 'Appliances',
    stock: 22,
    sku: 'INSTPOT7IN1',
    weight: 5.7,
    dimensions: { length: 33, width: 31.5, height: 32.5 },
    tags: ['kitchen', 'pressure-cooker', 'appliance', 'cooking'],
    status: 'active'
  },
  {
    name: 'Dyson V15 Detect Vacuum',
    description: 'Powerful cordless vacuum with laser dust detection and intelligent suction adjustment.',
    price: 85000,
    category: 'Appliances',
    stock: 8,
    sku: 'DYSONV15DET',
    weight: 3.0,
    dimensions: { length: 125, width: 25, height: 25 },
    tags: ['vacuum', 'dyson', 'cordless', 'cleaning'],
    status: 'active'
  },
  {
    name: 'The Psychology of Money',
    description: 'Bestselling book about the psychology behind financial decisions. Essential reading for personal finance.',
    price: 2500,
    category: 'Other',
    stock: 100,
    sku: 'PSYCHMONEY001',
    weight: 0.3,
    dimensions: { length: 23, width: 15, height: 2 },
    tags: ['book', 'finance', 'psychology', 'bestseller'],
    status: 'active'
  },
  {
    name: 'Yoga Mat Premium',
    description: 'High-quality non-slip yoga mat with excellent cushioning. Perfect for yoga, pilates, and home workouts.',
    price: 4500,
    category: 'Other',
    stock: 60,
    sku: 'YOGAMATPREM',
    weight: 1.2,
    dimensions: { length: 183, width: 61, height: 0.6 },
    tags: ['yoga', 'fitness', 'exercise', 'mat'],
    status: 'active'
  }
];

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

    // 2. Create/Update Merchant Account
    const existingMerchant = await User.findOne({ email: 'merchant@paya.com' });
    
    if (existingMerchant) {
      // Update existing merchant with correct businessInfo structure
      existingMerchant.businessInfo = {
        businessName: 'Test Merchant Store',
        businessDescription: 'A test merchant store for development and testing',
        businessCategory: 'Electronics',
        businessRegistrationNumber: 'TEST-BIZ-001',
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
        approvalStatus: 'approved',
        approvedAt: new Date(),
        approvedBy: 'system'
      };
      await existingMerchant.save();
      results.merchant = 'Merchant account updated with approval';
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
        businessInfo: {
          businessName: 'Test Merchant Store',
          businessDescription: 'A test merchant store for development and testing',
          businessCategory: 'Electronics',
          businessRegistrationNumber: 'TEST-BIZ-001',
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
          approvalStatus: 'approved',
          approvedAt: new Date(),
          approvedBy: 'system'
        }
      });

      await merchantUser.save();
      results.merchant = 'Merchant account created successfully';
    }

    // 3. Create Sample Products
    const merchant = await User.findOne({ email: 'merchant@paya.com' });
    if (merchant) {
      const existingProducts = await Product.countDocuments();
      if (existingProducts === 0) {
        const merchantName = merchant.businessInfo?.businessName || 'Test Merchant Store';
        const productsWithMerchant = sampleProducts.map(product => ({
          ...product,
          merchant: merchant._id,
          merchantName: merchantName,
          inventory: {
            quantity: product.stock,
            lowStockThreshold: 5,
            trackInventory: true
          }
        }));
        
        await Product.insertMany(productsWithMerchant);
        results.products = `Created ${sampleProducts.length} sample products`;
      } else {
        results.products = `${existingProducts} products already exist`;
      }
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
          averageOrderValue: { $avg: '$totalAmount' }
        }
      },
      {
        $project: {
          totalRevenue: 1,
          totalAdvanced: { $floor: { $multiply: ['$totalRevenue', 0.99] } },
          averageOrderValue: 1
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
      .select('firstName lastName email role createdAt businessInfo.businessName')
      .lean();

    const recentOrdersList = await Order.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('customer', 'firstName lastName')
      .select('orderNumber totalAmount status createdAt')
      .lean();

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

// Get single merchant details
router.get('/merchants/:id', async (req, res) => {
  try {
    const merchant = await User.findOne({ 
      _id: req.params.id, 
      role: 'merchant' 
    }).select('-password');

    if (!merchant) {
      return res.status(404).json({ message: 'Merchant not found' });
    }

    // Get additional stats for the merchant
    const productCount = await Product.countDocuments({ merchant: merchant._id });
    const orderCount = await Order.countDocuments({ 'items.merchant': merchant._id });
    
    const merchantWithStats = {
      ...merchant.toObject(),
      stats: {
        productCount,
        orderCount
      }
    };

    res.json(merchantWithStats);

  } catch (error) {
    console.error('Get merchant details error:', error);
    res.status(500).json({ message: 'Failed to fetch merchant details' });
  }
});

// Get merchant's products
router.get('/merchants/:id/products', async (req, res) => {
  try {
    const merchant = await User.findOne({ 
      _id: req.params.id, 
      role: 'merchant' 
    });

    if (!merchant) {
      return res.status(404).json({ message: 'Merchant not found' });
    }

    const products = await Product.find({ merchant: req.params.id })
      .sort({ createdAt: -1 });

    res.json(products);

  } catch (error) {
    console.error('Get merchant products error:', error);
    res.status(500).json({ message: 'Failed to fetch merchant products' });
  }
});

// Get merchant's orders
router.get('/merchants/:id/orders', async (req, res) => {
  try {
    const merchant = await User.findOne({ 
      _id: req.params.id, 
      role: 'merchant' 
    });

    if (!merchant) {
      return res.status(404).json({ message: 'Merchant not found' });
    }

    const orders = await Order.find({ 'items.merchant': req.params.id })
      .populate('customer', 'firstName lastName email')
      .sort({ createdAt: -1 });

    res.json(orders);

  } catch (error) {
    console.error('Get merchant orders error:', error);
    res.status(500).json({ message: 'Failed to fetch merchant orders' });
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

    // Update both legacy and new approval status fields
    merchant.businessInfo.approvalStatus = status;
    
    // Initialize payaApproval if it doesn't exist
    if (!merchant.businessInfo.payaApproval) {
      merchant.businessInfo.payaApproval = {};
    }
    
    merchant.businessInfo.payaApproval.status = status;

    if (status === 'approved') {
      merchant.businessInfo.approvedAt = new Date();
      merchant.businessInfo.payaApproval.approvedAt = new Date();
      merchant.businessInfo.payaApproval.approvedBy = req.user?._id;
      merchant.businessInfo.rejectedAt = null;
      merchant.businessInfo.rejectionReason = null;
      merchant.businessInfo.payaApproval.rejectedAt = null;
      merchant.businessInfo.payaApproval.rejectionReason = null;
    } else if (status === 'rejected') {
      merchant.businessInfo.rejectedAt = new Date();
      merchant.businessInfo.rejectionReason = rejectionReason;
      merchant.businessInfo.payaApproval.rejectedAt = new Date();
      merchant.businessInfo.payaApproval.rejectionReason = rejectionReason;
      merchant.businessInfo.approvedAt = null;
      merchant.businessInfo.payaApproval.approvedAt = null;
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

// Approve/reject bank approval for merchant
router.patch('/merchants/:id/bank-approval', [
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

    // Initialize bankApproval if it doesn't exist
    if (!merchant.businessInfo.bankApproval) {
      merchant.businessInfo.bankApproval = {};
    }
    
    merchant.businessInfo.bankApproval.status = status;

    if (status === 'approved') {
      merchant.businessInfo.bankApproval.approvedAt = new Date();
      merchant.businessInfo.bankApproval.approvedBy = req.user?._id;
      merchant.businessInfo.bankApproval.rejectedAt = null;
      merchant.businessInfo.bankApproval.rejectionReason = null;
    } else if (status === 'rejected') {
      merchant.businessInfo.bankApproval.rejectedAt = new Date();
      merchant.businessInfo.bankApproval.rejectionReason = rejectionReason;
      merchant.businessInfo.bankApproval.approvedAt = null;
    }

    await merchant.save();

    res.json({
      message: `Bank approval ${status} successfully`,
      merchant: merchant.toSafeObject()
    });

  } catch (error) {
    console.error('Update bank approval error:', error);
    res.status(500).json({ message: 'Failed to update bank approval' });
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
          totalPaid: { 
            $sum: { 
              $cond: [
                { $eq: ['$status', 'paid'] }, 
                '$totalAmount', 
                0
              ] 
            } 
          },
          totalApproved: { 
            $sum: { 
              $cond: [
                { $in: ['$status', ['approved', 'paid']] }, 
                '$totalAmount', 
                0
              ] 
            } 
          }
        }
      },
      {
        $project: {
          totalAmount: 1,
          totalAdvanced: { $floor: { $multiply: ['$totalAmount', 0.99] } },
          totalRemitted: '$totalPaid',
          totalOutstanding: { 
            $subtract: [
              { $floor: { $multiply: ['$totalApproved', 0.99] } },
              '$totalPaid'
            ]
          }
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
      totals: totals[0] || { 
        totalAmount: 0, 
        totalAdvanced: 0,
        totalRemitted: 0,
        totalOutstanding: 0
      }
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
