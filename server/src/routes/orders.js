const express = require('express');
const { body, query, validationResult } = require('express-validator');
const Order = require('../models/Order');
const Product = require('../models/Product');
const { authenticateToken, requireRole, requireApprovedMerchant } = require('../middleware/auth');
const slackService = require('../../services/slackService');
const hrVerificationService = require('../services/hrVerificationService');

const router = express.Router();

// Create new order (customers and guests)
router.post('/', [
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

    const { items, shippingAddress, customerNotes, payment, customerInfo } = req.body;

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

    // Generate order number
    const date = new Date();
    const dateStr = date.getFullYear().toString() + 
                   (date.getMonth() + 1).toString().padStart(2, '0') + 
                   date.getDate().toString().padStart(2, '0');
    const random = Math.floor(Math.random() * 100000).toString().padStart(5, '0');
    const orderNumber = `PY-${dateStr}-${random}`;

    // Create order
    const order = new Order({
      orderNumber,
      customer: req.user?._id || null, // Allow null for guest orders
      customerInfo: customerInfo || (req.user ? {
        firstName: req.user.firstName,
        lastName: req.user.lastName,
        email: req.user.email,
        phoneCountryCode: req.user.phoneCountryCode,
        phoneNumber: req.user.phoneNumber,
        dateOfBirth: req.user.dateOfBirth,
        kraPin: req.user.kraPin
      } : {
        firstName: 'Guest',
        lastName: 'User',
        email: 'guest@example.com',
        dateOfBirth: new Date('1990-01-01')
      }),
      shippingAddress,
      items: orderItems,
      subtotal,
      totalTax,
      totalShipping,
      totalAmount,
      customerNotes,
      payment: payment || {
        method: 'paya_bnpl',
        status: 'pending'
      },
      status: 'pending_payment', // Always start as pending until fully completed
      timeline: [{
        status: 'pending_payment',
        timestamp: new Date(),
        note: 'BNPL application started'
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

    // Send Slack notifications
    await slackService.notifyNewOrder(order);
    if (payment?.method === 'paya_bnpl') {
      await slackService.notifyBNPLApplication(order);
    }
    await slackService.notifyHighValueOrder(order);

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
      .populate('items.product', 'name images')
      .populate('items.merchant', 'businessInfo.businessName firstName lastName');

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

// Get single merchant order
router.get('/merchant/orders/:id', authenticateToken, requireApprovedMerchant, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('customer', 'firstName lastName email phoneNumber')
      .populate('items.product', 'name images sku')
      .populate('items.merchant', 'businessInfo.businessName firstName lastName');

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Check if merchant has access to this order
    const merchantHasAccess = order.items.some(item => 
      item.merchant._id.toString() === req.user._id.toString()
    );

    if (!merchantHasAccess) {
      return res.status(403).json({ message: 'Access denied to this order' });
    }

    res.json({ order });

  } catch (error) {
    console.error('Get merchant order error:', error);
    res.status(500).json({ message: 'Failed to fetch order' });
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

// Update order status during checkout
router.patch('/:id/status', [
  body('status').isIn(['pending_payment', 'underwriting', 'approved', 'rejected', 'hr_verification_pending', 'hr_verified', 'hr_unverified', 'paid', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded']).withMessage('Invalid status'),
  body('note').optional().trim(),
  body('underwritingResult').optional(),
  body('skipHRVerification').optional().isBoolean()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation errors', 
        errors: errors.array() 
      });
    }

    const { status, note, underwritingResult, skipHRVerification } = req.body;
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Store old status for notification
    const oldStatus = order.status;

    // Update order status
    order.status = status;
    
    // Save underwriting result if provided
    if (underwritingResult) {
      order.underwritingResult = {
        approved: underwritingResult.approved,
        reason: underwritingResult.reasons ? underwritingResult.reasons.join(', ') : '',
        thresholds: underwritingResult.thresholds,
        applicantData: underwritingResult.applicantData,
        evaluatedAt: new Date()
      };
    }
    
    // Add timeline entry
    order.timeline.push({
      status,
      timestamp: new Date(),
      note: note || `Status updated to ${status}`
    });

    // If status is paid, update payment info
    if (status === 'paid' && order.payment.method === 'paya_bnpl') {
      order.payment.status = 'completed';
      order.payment.paidAt = new Date();
      if (order.payment.bnpl) {
        order.payment.bnpl.agreementAccepted = true;
        order.payment.bnpl.agreementAcceptedAt = new Date();
      }
    }

    await order.save();

    // Send Slack notification for status change
    await slackService.notifyOrderStatusChange(order, oldStatus, status);

    // Send specific notifications for BNPL status changes
    if (status === 'approved' && order.payment?.method === 'paya_bnpl') {
      await slackService.notifyBNPLApproval(order);

      // Trigger HR verification after underwriting approval (unless skipped)
      if (!skipHRVerification) {
        try {
          const hrVerification = await hrVerificationService.initiateVerification(order._id);

          // Send verification email to HR
          await hrVerificationService.sendVerificationEmail(hrVerification._id);

          // Reload order to get updated status
          await order.populate('hrVerification');

          return res.json({
            message: 'Order approved. HR verification initiated.',
            order,
            hrVerification: {
              id: hrVerification._id,
              status: hrVerification.status,
              hrEmail: hrVerification.hrContactSnapshot?.email
            }
          });
        } catch (hrError) {
          console.error('HR verification initiation error:', hrError.message);
          // Continue without HR verification if it fails (e.g., no CDL company found)
          // The order remains approved but without HR verification
          return res.json({
            message: 'Order approved. HR verification could not be initiated: ' + hrError.message,
            order,
            hrVerificationError: hrError.message
          });
        }
      }
    } else if (status === 'rejected' && order.payment?.method === 'paya_bnpl') {
      // Extract rejection reasons from the note
      const reasons = note ? note.replace('BNPL application rejected: ', '').split(', ') : ['Application did not meet criteria'];
      await slackService.notifyBNPLRejection(order, reasons);
    }

    res.json({
      message: 'Order status updated successfully',
      order
    });

  } catch (error) {
    console.error('Update order status error:', error);
    res.status(500).json({ message: 'Failed to update order status' });
  }
});

// Get all orders (admin only)
router.get('/admin/orders', authenticateToken, requireRole('admin'), [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 50 }),
  query('status').optional().trim(),
  query('merchant').optional().isMongoId(),
  query('customer').optional().isMongoId()
], async (req, res) => {
  try {
    const { page = 1, limit = 20, status, merchant, customer } = req.query;

    const query = {};
    if (status) query.status = status;
    if (merchant) query['items.merchant'] = merchant;
    if (customer) query.customer = customer;

    const orders = await Order.find(query)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .populate('customer', 'firstName lastName email phoneNumber')
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
    console.error('Get admin orders error:', error);
    res.status(500).json({ message: 'Failed to fetch orders' });
  }
});

// Get single order (admin only)
router.get('/admin/order-detail/:id', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    console.log('Admin order detail route hit with ID:', req.params.id);
    const order = await Order.findById(req.params.id)
      .populate('customer', 'firstName lastName email phoneNumber')
      .populate('items.product', 'name images sku')
      .populate('items.merchant', 'businessInfo.businessName firstName lastName');

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    res.json({ order });

  } catch (error) {
    console.error('Get admin order error:', error);
    res.status(500).json({ message: 'Failed to fetch order' });
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
