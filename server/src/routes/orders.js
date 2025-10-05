const express = require('express');
const { body, query, validationResult } = require('express-validator');
const Order = require('../models/Order');
const Product = require('../models/Product');
const { authenticateToken, requireRole, requireApprovedMerchant } = require('../middleware/auth');

const router = express.Router();

// Create new order (customers only)
router.post('/', authenticateToken, requireRole('customer'), [
  body('items').isArray({ min: 1 }).withMessage('Order must contain at least one item'),
  body('items.*.product').isMongoId().withMessage('Invalid product ID'),
  body('items.*.quantity').isInt({ min: 1 }).withMessage('Quantity must be at least 1'),
  body('shippingAddress.street').trim().isLength({ min: 1 }).withMessage('Street address is required'),
  body('shippingAddress.city').trim().isLength({ min: 1 }).withMessage('City is required'),
  body('shippingAddress.county').trim().isLength({ min: 1 }).withMessage('County is required'),
  body('shippingAddress.postalCode').trim().isLength({ min: 1 }).withMessage('Postal code is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation errors', 
        errors: errors.array() 
      });
    }

    const { items, shippingAddress, customerNotes } = req.body;

    // Validate products and calculate totals
    const orderItems = [];
    let subtotal = 0;
    let totalTax = 0;
    let totalShipping = 0;

    for (const item of items) {
      const product = await Product.findById(item.product).populate('merchant');
      
      if (!product || !product.isAvailable) {
        return res.status(400).json({ 
          message: `Product ${product?.name || 'unknown'} is not available` 
        });
      }

      // Check inventory
      if (product.inventory.trackInventory && product.inventory.quantity < item.quantity) {
        return res.status(400).json({ 
          message: `Insufficient inventory for ${product.name}. Available: ${product.inventory.quantity}` 
        });
      }

      const itemSubtotal = product.price * item.quantity;
      const itemTax = itemSubtotal * product.taxRate;
      const itemShipping = product.shippingCost * item.quantity;

      orderItems.push({
        product: product._id,
        productName: product.name,
        productPrice: product.price,
        quantity: item.quantity,
        taxRate: product.taxRate,
        shippingCost: product.shippingCost,
        merchant: product.merchant._id,
        merchantName: product.merchant.businessInfo?.businessName || 
                     `${product.merchant.firstName} ${product.merchant.lastName}`
      });

      subtotal += itemSubtotal;
      totalTax += itemTax;
      totalShipping += itemShipping;
    }

    const totalAmount = subtotal + totalTax + totalShipping;

    // Create order
    const order = new Order({
      customer: req.user._id,
      customerInfo: {
        firstName: req.user.firstName,
        lastName: req.user.lastName,
        email: req.user.email,
        phoneNumber: req.user.phoneNumber,
        dateOfBirth: req.user.dateOfBirth,
        kraPin: req.user.kraPin
      },
      shippingAddress,
      items: orderItems,
      subtotal,
      totalTax,
      totalShipping,
      totalAmount,
      customerNotes,
      timeline: [{
        status: 'pending_payment',
        timestamp: new Date(),
        note: 'Order created'
      }]
    });

    // Create fulfillment entries for each merchant
    const merchantGroups = {};
    orderItems.forEach(item => {
      const merchantId = item.merchant.toString();
      if (!merchantGroups[merchantId]) {
        merchantGroups[merchantId] = [];
      }
      merchantGroups[merchantId].push(item);
    });

    order.fulfillment = Object.keys(merchantGroups).map(merchantId => ({
      merchant: merchantId,
      items: merchantGroups[merchantId],
      status: 'pending'
    }));

    await order.save();

    res.status(201).json({
      message: 'Order created successfully',
      order
    });

  } catch (error) {
    console.error('Create order error:', error);
    res.status(500).json({ message: 'Failed to create order' });
  }
});

// Complete BNPL payment process
router.post('/:id/complete-payment', authenticateToken, requireRole('customer'), [
  body('agreementAccepted').isBoolean().withMessage('Agreement acceptance is required'),
  body('transactionId').optional().trim()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation errors', 
        errors: errors.array() 
      });
    }

    const { agreementAccepted, transactionId } = req.body;

    if (!agreementAccepted) {
      return res.status(400).json({ message: 'BNPL agreement must be accepted' });
    }

    const order = await Order.findOne({ 
      _id: req.params.id, 
      customer: req.user._id,
      status: 'pending_payment'
    });

    if (!order) {
      return res.status(404).json({ message: 'Order not found or already processed' });
    }

    // Update payment status
    order.payment.bnpl.agreementAccepted = true;
    order.payment.bnpl.agreementAcceptedAt = new Date();
    
    await order.updatePaymentStatus('completed', transactionId);

    // Reduce inventory for all products
    for (const item of order.items) {
      const product = await Product.findById(item.product);
      if (product && product.inventory.trackInventory) {
        await product.reduceInventory(item.quantity);
      }
    }

    res.json({
      message: 'Payment completed successfully',
      order
    });

  } catch (error) {
    console.error('Complete payment error:', error);
    res.status(500).json({ message: 'Failed to complete payment' });
  }
});

// Get customer's orders
router.get('/my-orders', authenticateToken, requireRole('customer'), [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 50 }),
  query('status').optional().trim()
], async (req, res) => {
  try {
    const { page = 1, limit = 20, status } = req.query;

    const query = { customer: req.user._id };
    if (status) query.status = status;

    const orders = await Order.find(query)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .populate('items.product', 'name images')
      .populate('items.merchant', 'businessInfo.businessName firstName lastName');

    const total = await Order.countDocuments(query);

    res.json({
      orders,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: parseInt(limit)
      }
    });

  } catch (error) {
    console.error('Get customer orders error:', error);
    res.status(500).json({ message: 'Failed to fetch orders' });
  }
});

// Get merchant's orders
router.get('/merchant/orders', authenticateToken, requireApprovedMerchant, [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 50 }),
  query('status').optional().trim(),
  query('dateFrom').optional().isISO8601(),
  query('dateTo').optional().isISO8601()
], async (req, res) => {
  try {
    const { page = 1, limit = 20, status, dateFrom, dateTo } = req.query;

    const options = { status };
    if (dateFrom) options.dateFrom = new Date(dateFrom);
    if (dateTo) options.dateTo = new Date(dateTo);

    const orders = await Order.findByMerchant(req.user._id, options)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .populate('customer', 'firstName lastName email phoneNumber')
      .populate('items.product', 'name images');

    const totalQuery = { 'items.merchant': req.user._id };
    if (status) totalQuery.status = status;
    if (dateFrom || dateTo) {
      totalQuery.createdAt = {};
      if (dateFrom) totalQuery.createdAt.$gte = new Date(dateFrom);
      if (dateTo) totalQuery.createdAt.$lte = new Date(dateTo);
    }

    const total = await Order.countDocuments(totalQuery);

    res.json({
      orders,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: parseInt(limit)
      }
    });

  } catch (error) {
    console.error('Get merchant orders error:', error);
    res.status(500).json({ message: 'Failed to fetch merchant orders' });
  }
});

// Get merchant order statistics
router.get('/merchant/stats', authenticateToken, requireApprovedMerchant, [
  query('period').optional().isIn(['7d', '30d', '6m', '1y']).withMessage('Invalid period')
], async (req, res) => {
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

    const dateFrom = dateRanges[period];

    const stats = await Order.getOrderStats(req.user._id, { from: dateFrom, to: now });

    // Get recent orders
    const recentOrders = await Order.findByMerchant(req.user._id, { dateFrom })
      .limit(5)
      .populate('customer', 'firstName lastName');

    res.json({
      period,
      stats: stats[0] || {
        totalOrders: 0,
        totalRevenue: 0,
        averageOrderValue: 0,
        totalAdvanced: 0
      },
      recentOrders
    });

  } catch (error) {
    console.error('Get merchant stats error:', error);
    res.status(500).json({ message: 'Failed to fetch merchant statistics' });
  }
});

// Update order fulfillment status (merchant only)
router.patch('/:id/fulfillment', authenticateToken, requireApprovedMerchant, [
  body('status').isIn(['processing', 'shipped', 'delivered']).withMessage('Invalid fulfillment status'),
  body('trackingNumber').optional().trim(),
  body('notes').optional().trim()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation errors', 
        errors: errors.array() 
      });
    }

    const { status, trackingNumber, notes } = req.body;

    const order = await Order.findOne({ 
      _id: req.params.id,
      'items.merchant': req.user._id
    });

    if (!order) {
      return res.status(404).json({ message: 'Order not found or access denied' });
    }

    await order.updateFulfillmentStatus(req.user._id, status, trackingNumber, notes);

    res.json({
      message: 'Fulfillment status updated successfully',
      order
    });

  } catch (error) {
    console.error('Update fulfillment error:', error);
    res.status(500).json({ message: 'Failed to update fulfillment status' });
  }
});

// Get single order details
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    let query = { _id: req.params.id };

    // Restrict access based on user role
    if (req.user.role === 'customer') {
      query.customer = req.user._id;
    } else if (req.user.role === 'merchant') {
      query['items.merchant'] = req.user._id;
    }
    // Admins can access any order

    const order = await Order.findOne(query)
      .populate('customer', 'firstName lastName email phoneNumber')
      .populate('items.product', 'name images')
      .populate('items.merchant', 'businessInfo.businessName firstName lastName')
      .populate('fulfillment.merchant', 'businessInfo.businessName firstName lastName');

    if (!order) {
      return res.status(404).json({ message: 'Order not found or access denied' });
    }

    res.json(order);

  } catch (error) {
    console.error('Get order error:', error);
    res.status(500).json({ message: 'Failed to fetch order' });
  }
});

// Cancel order (customer only, within time limit)
router.patch('/:id/cancel', authenticateToken, requireRole('customer'), [
  body('reason').optional().trim()
], async (req, res) => {
  try {
    const { reason } = req.body;

    const order = await Order.findOne({ 
      _id: req.params.id, 
      customer: req.user._id 
    });

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    if (!['pending_payment', 'paid', 'processing'].includes(order.status)) {
      return res.status(400).json({ message: 'Order cannot be cancelled at this stage' });
    }

    // Check if order is within cancellation window (e.g., 1 hour)
    const hoursSinceOrder = (Date.now() - order.createdAt) / (1000 * 60 * 60);
    if (hoursSinceOrder > 1 && order.status !== 'pending_payment') {
      return res.status(400).json({ message: 'Cancellation window has expired' });
    }

    order.status = 'cancelled';
    order.cancellation = {
      reason,
      cancelledAt: new Date(),
      cancelledBy: req.user._id
    };

    await order.addTimelineEntry('cancelled', `Order cancelled: ${reason}`, req.user._id);

    // Restore inventory
    for (const item of order.items) {
      const product = await Product.findById(item.product);
      if (product && product.inventory.trackInventory) {
        await product.increaseInventory(item.quantity);
      }
    }

    res.json({
      message: 'Order cancelled successfully',
      order
    });

  } catch (error) {
    console.error('Cancel order error:', error);
    res.status(500).json({ message: 'Failed to cancel order' });
  }
});

module.exports = router;
