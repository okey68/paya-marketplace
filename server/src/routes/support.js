const express = require('express');
const { body, validationResult } = require('express-validator');
const SupportTicket = require('../models/SupportTicket');
const Order = require('../models/Order');
const { authenticateToken, requireRole } = require('../middleware/auth');
const slackService = require('../../services/slackService');

const router = express.Router();

// Submit a support ticket (public)
router.post('/submit',
  [
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('email').isEmail().withMessage('Valid email is required'),
    body('subject').trim().notEmpty().withMessage('Subject is required'),
    body('message').trim().notEmpty().withMessage('Message is required'),
    body('orderNumber').optional()
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { name, email, subject, message, orderNumber } = req.body;

      const ticketData = {
        name,
        email,
        subject,
        message,
        orderNumber: orderNumber || null
      };

      // If order number provided, find the order and merchant
      if (orderNumber) {
        const order = await Order.findOne({ orderNumber }).populate('items.merchant');
        if (order) {
          ticketData.order = order._id;
          // Get merchant from first item (assuming single merchant per order for now)
          if (order.items && order.items.length > 0 && order.items[0].merchant) {
            ticketData.merchant = order.items[0].merchant;
          }
        }
      }

      const ticket = new SupportTicket(ticketData);
      await ticket.save();

      // Send Slack notification
      await slackService.notifySupportTicket(ticket);

      res.status(201).json({
        message: 'Support ticket submitted successfully',
        ticket: {
          ticketNumber: ticket.ticketNumber,
          status: ticket.status
        }
      });
    } catch (error) {
      console.error('Error submitting support ticket:', error);
      console.error('Error stack:', error.stack);
      res.status(500).json({ 
        message: 'Failed to submit support ticket',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
);

// Get all tickets (admin only)
router.get('/admin/tickets', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const { status, priority, search, page = 1, limit = 20 } = req.query;

    const query = {};
    if (status) query.status = status;
    if (priority) query.priority = priority;
    if (search) {
      query.$or = [
        { ticketNumber: { $regex: search, $options: 'i' } },
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { subject: { $regex: search, $options: 'i' } }
      ];
    }

    const tickets = await SupportTicket.find(query)
      .populate({
        path: 'order',
        select: 'orderNumber totalAmount'
      })
      .populate({
        path: 'merchant',
        select: 'fullName businessInfo.businessName'
      })
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit))
      .lean();

    const total = await SupportTicket.countDocuments(query);

    res.json({
      tickets,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Error fetching support tickets:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ 
      message: 'Failed to fetch support tickets',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Get merchant's tickets (merchant only)
router.get('/merchant/tickets', authenticateToken, async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;

    const query = { merchant: req.user._id };
    if (status) query.status = status;

    const tickets = await SupportTicket.find(query)
      .populate({
        path: 'order',
        select: 'orderNumber totalAmount'
      })
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit))
      .lean();

    const total = await SupportTicket.countDocuments(query);

    res.json({
      tickets,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Error fetching merchant tickets:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ 
      message: 'Failed to fetch tickets',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Get single ticket details
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const ticket = await SupportTicket.findById(req.params.id)
      .populate({
        path: 'order',
        select: 'orderNumber totalAmount customerInfo'
      })
      .populate({
        path: 'merchant',
        select: 'fullName businessInfo.businessName'
      })
      .populate({
        path: 'responses.respondedBy',
        select: 'fullName'
      })
      .lean();

    if (!ticket) {
      return res.status(404).json({ message: 'Ticket not found' });
    }

    // Check permissions
    const isAdmin = req.user.role === 'admin';
    const isMerchant = ticket.merchant && ticket.merchant._id.toString() === req.user._id.toString();

    if (!isAdmin && !isMerchant) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json(ticket);
  } catch (error) {
    console.error('Error fetching ticket:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ 
      message: 'Failed to fetch ticket',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Update ticket status (admin or merchant)
router.patch('/:id/status', authenticateToken, async (req, res) => {
  try {
    const { status, priority } = req.body;

    const ticket = await SupportTicket.findById(req.params.id);
    if (!ticket) {
      return res.status(404).json({ message: 'Ticket not found' });
    }

    // Check permissions
    const isAdmin = req.user.role === 'admin';
    const isMerchant = ticket.merchant && ticket.merchant._id.toString() === req.user._id.toString();

    if (!isAdmin && !isMerchant) {
      return res.status(403).json({ message: 'Access denied' });
    }

    if (status) ticket.status = status;
    if (priority && isAdmin) ticket.priority = priority; // Only admin can change priority

    await ticket.save();

    res.json({ message: 'Ticket updated successfully', ticket });
  } catch (error) {
    console.error('Error updating ticket:', error);
    res.status(500).json({ message: 'Failed to update ticket' });
  }
});

// Add response to ticket
router.post('/:id/response', authenticateToken, async (req, res) => {
  try {
    const { message } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({ message: 'Response message is required' });
    }

    const ticket = await SupportTicket.findById(req.params.id);
    if (!ticket) {
      return res.status(404).json({ message: 'Ticket not found' });
    }

    // Check permissions
    const isAdmin = req.user.role === 'admin';
    const isMerchant = ticket.merchant && ticket.merchant._id.toString() === req.user._id.toString();

    if (!isAdmin && !isMerchant) {
      return res.status(403).json({ message: 'Access denied' });
    }

    ticket.responses.push({
      respondedBy: req.user._id,
      respondedByName: req.user.fullName || req.user.businessInfo?.businessName || 'Support Team',
      message: message.trim()
    });

    // Update status to in_progress if it was open
    if (ticket.status === 'open') {
      ticket.status = 'in_progress';
    }

    await ticket.save();

    res.json({ message: 'Response added successfully', ticket });
  } catch (error) {
    console.error('Error adding response:', error);
    res.status(500).json({ message: 'Failed to add response' });
  }
});

module.exports = router;
