const express = require('express');
const router = express.Router();
const HRVerification = require('../models/HRVerification');
const hrVerificationService = require('../services/hrVerificationService');
const { authenticateToken, requireRole } = require('../middleware/auth');

/**
 * @route   GET /api/hr-verification
 * @desc    Get all HR verifications with filters
 * @access  Admin
 */
router.get('/', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const {
      status,
      company,
      isEscalated,
      page = 1,
      limit = 20,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const query = {};

    // Filter by status
    if (status) {
      if (status === 'pending') {
        query.status = { $in: ['pending_send', 'email_sent', 'awaiting_response'] };
      } else {
        query.status = status;
      }
    }

    // Filter by company
    if (company) {
      query.company = company;
    }

    // Filter by escalated
    if (isEscalated !== undefined) {
      query.isEscalated = isEscalated === 'true';
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const sort = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };

    const [verifications, total] = await Promise.all([
      HRVerification.find(query)
        .populate('order', 'orderNumber totalAmount status createdAt')
        .populate('customer', 'firstName lastName email')
        .populate('company', 'companyName')
        .populate('reviewedBy', 'firstName lastName')
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit)),
      HRVerification.countDocuments(query)
    ]);

    res.json({
      success: true,
      verifications,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Error fetching verifications:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching verifications',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/hr-verification/stats
 * @desc    Get HR verification statistics
 * @access  Admin
 */
router.get('/stats', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const { from, to } = req.query;

    let dateRange = null;
    if (from && to) {
      dateRange = {
        from: new Date(from),
        to: new Date(to)
      };
    }

    const [stats, pendingCount, escalatedCount] = await Promise.all([
      hrVerificationService.getStatistics(dateRange),
      hrVerificationService.getPendingCount(),
      hrVerificationService.getEscalatedCount()
    ]);

    res.json({
      success: true,
      stats: {
        ...stats,
        pendingCount,
        escalatedCount
      }
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching statistics',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/hr-verification/pending
 * @desc    Get pending verifications
 * @access  Admin
 */
router.get('/pending', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const verifications = await HRVerification.findPending();

    res.json({
      success: true,
      count: verifications.length,
      verifications
    });
  } catch (error) {
    console.error('Error fetching pending verifications:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching pending verifications',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/hr-verification/overdue
 * @desc    Get overdue verifications
 * @access  Admin
 */
router.get('/overdue', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const verifications = await HRVerification.findOverdue();

    res.json({
      success: true,
      count: verifications.length,
      verifications
    });
  } catch (error) {
    console.error('Error fetching overdue verifications:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching overdue verifications',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/hr-verification/:id
 * @desc    Get single verification by ID
 * @access  Admin
 */
router.get('/:id', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const verification = await HRVerification.findById(req.params.id)
      .populate('order')
      .populate('customer', '-password')
      .populate('company')
      .populate('reviewedBy', 'firstName lastName email')
      .populate('customerContact.contactedBy', 'firstName lastName');

    if (!verification) {
      return res.status(404).json({
        success: false,
        message: 'Verification not found'
      });
    }

    res.json({
      success: true,
      verification
    });
  } catch (error) {
    console.error('Error fetching verification:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching verification',
      error: error.message
    });
  }
});

/**
 * @route   POST /api/hr-verification/:id/send-email
 * @desc    Send or resend verification email to HR
 * @access  Admin
 */
router.post('/:id/send-email', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const verification = await HRVerification.findById(req.params.id);

    if (!verification) {
      return res.status(404).json({
        success: false,
        message: 'Verification not found'
      });
    }

    let result;
    if (verification.status === 'pending_send') {
      result = await hrVerificationService.sendVerificationEmail(req.params.id);
    } else {
      result = await hrVerificationService.resendVerificationEmail(req.params.id);
    }

    res.json({
      success: true,
      message: 'Verification email sent successfully',
      verification: result
    });
  } catch (error) {
    console.error('Error sending verification email:', error);
    res.status(500).json({
      success: false,
      message: 'Error sending verification email',
      error: error.message
    });
  }
});

/**
 * @route   PATCH /api/hr-verification/:id/verify
 * @desc    Mark verification as verified (admin confirmation)
 * @access  Admin
 */
router.patch('/:id/verify', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const { notes } = req.body;

    const result = await hrVerificationService.markAsVerified(
      req.params.id,
      req.user.id,
      notes
    );

    res.json({
      success: true,
      message: 'Verification marked as verified',
      verification: result.verification,
      order: result.order
    });
  } catch (error) {
    console.error('Error verifying:', error);
    res.status(500).json({
      success: false,
      message: 'Error marking as verified',
      error: error.message
    });
  }
});

/**
 * @route   PATCH /api/hr-verification/:id/reject
 * @desc    Mark verification as unverified (admin rejection)
 * @access  Admin
 */
router.patch('/:id/reject', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const { reason } = req.body;

    if (!reason) {
      return res.status(400).json({
        success: false,
        message: 'Rejection reason is required'
      });
    }

    const result = await hrVerificationService.markAsUnverified(
      req.params.id,
      req.user.id,
      reason
    );

    res.json({
      success: true,
      message: 'Verification marked as unverified',
      verification: result.verification,
      order: result.order
    });
  } catch (error) {
    console.error('Error rejecting:', error);
    res.status(500).json({
      success: false,
      message: 'Error marking as unverified',
      error: error.message
    });
  }
});

/**
 * @route   POST /api/hr-verification/:id/contact-customer
 * @desc    Contact customer about verification issues
 * @access  Admin
 */
router.post('/:id/contact-customer', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const { reason, method = 'email' } = req.body;

    if (!reason) {
      return res.status(400).json({
        success: false,
        message: 'Contact reason is required'
      });
    }

    const verification = await hrVerificationService.contactCustomer(
      req.params.id,
      req.user.id,
      reason,
      method
    );

    res.json({
      success: true,
      message: 'Customer contacted successfully',
      verification
    });
  } catch (error) {
    console.error('Error contacting customer:', error);
    res.status(500).json({
      success: false,
      message: 'Error contacting customer',
      error: error.message
    });
  }
});

/**
 * @route   POST /api/hr-verification/:id/resend-email
 * @desc    Resend verification email to HR
 * @access  Admin
 */
router.post('/:id/resend-email', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const verification = await hrVerificationService.resendVerificationEmail(req.params.id);

    res.json({
      success: true,
      message: 'Email resent successfully',
      verification
    });
  } catch (error) {
    console.error('Error resending email:', error);
    res.status(500).json({
      success: false,
      message: 'Error resending email',
      error: error.message
    });
  }
});

/**
 * @route   POST /api/hr-verification/:id/escalate
 * @desc    Manually escalate a verification
 * @access  Admin
 */
router.post('/:id/escalate', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const { reason } = req.body;

    const verification = await HRVerification.findById(req.params.id);

    if (!verification) {
      return res.status(404).json({
        success: false,
        message: 'Verification not found'
      });
    }

    await verification.escalate(reason || 'Manually escalated by admin');

    res.json({
      success: true,
      message: 'Verification escalated',
      verification
    });
  } catch (error) {
    console.error('Error escalating:', error);
    res.status(500).json({
      success: false,
      message: 'Error escalating verification',
      error: error.message
    });
  }
});

/**
 * @route   POST /api/hr-verification/:id/cancel
 * @desc    Cancel a verification
 * @access  Admin
 */
router.post('/:id/cancel', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const { reason } = req.body;

    const verification = await HRVerification.findById(req.params.id);

    if (!verification) {
      return res.status(404).json({
        success: false,
        message: 'Verification not found'
      });
    }

    await verification.cancel(reason || 'Cancelled by admin', req.user.id);

    res.json({
      success: true,
      message: 'Verification cancelled',
      verification
    });
  } catch (error) {
    console.error('Error cancelling:', error);
    res.status(500).json({
      success: false,
      message: 'Error cancelling verification',
      error: error.message
    });
  }
});

/**
 * @route   POST /api/hr-verification/trigger-timeout-check
 * @desc    Manually trigger timeout check (for testing)
 * @access  Admin
 */
router.post('/trigger-timeout-check', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const escalatedCount = await hrVerificationService.checkTimeouts();

    res.json({
      success: true,
      message: `Timeout check completed. Escalated: ${escalatedCount}`,
      escalatedCount
    });
  } catch (error) {
    console.error('Error during timeout check:', error);
    res.status(500).json({
      success: false,
      message: 'Error during timeout check',
      error: error.message
    });
  }
});

/**
 * @route   POST /api/hr-verification/trigger-reminders
 * @desc    Manually trigger reminder sending (for testing)
 * @access  Admin
 */
router.post('/trigger-reminders', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const reminderCount = await hrVerificationService.sendReminders();

    res.json({
      success: true,
      message: `Reminders sent: ${reminderCount}`,
      reminderCount
    });
  } catch (error) {
    console.error('Error sending reminders:', error);
    res.status(500).json({
      success: false,
      message: 'Error sending reminders',
      error: error.message
    });
  }
});

module.exports = router;
