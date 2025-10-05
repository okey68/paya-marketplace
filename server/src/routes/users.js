const express = require('express');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const { authenticateToken, requireOwnershipOrAdmin } = require('../middleware/auth');

const router = express.Router();

// Get user profile
router.get('/profile', authenticateToken, async (req, res) => {
  try {
    res.json({
      user: req.user.toSafeObject()
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ message: 'Failed to get profile' });
  }
});

// Update user profile
router.put('/profile', authenticateToken, [
  body('firstName').optional().trim().isLength({ min: 1, max: 50 }),
  body('lastName').optional().trim().isLength({ min: 1, max: 50 }),
  body('phoneNumber').optional().trim(),
  body('address.street').optional().trim(),
  body('address.city').optional().trim(),
  body('address.county').optional().trim(),
  body('address.postalCode').optional().trim()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation errors', 
        errors: errors.array() 
      });
    }

    const allowedFields = ['firstName', 'lastName', 'phoneNumber', 'address'];
    const updates = {};

    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) {
        if (field === 'address' && typeof req.body[field] === 'object') {
          updates[field] = { ...req.user.address, ...req.body[field] };
        } else {
          updates[field] = req.body[field];
        }
      }
    });

    const user = await User.findByIdAndUpdate(
      req.user._id,
      updates,
      { new: true, runValidators: true }
    );

    res.json({
      message: 'Profile updated successfully',
      user: user.toSafeObject()
    });

  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ message: 'Failed to update profile' });
  }
});

// Update business information (merchants only)
router.put('/business-info', authenticateToken, [
  body('businessName').optional().trim().isLength({ min: 1 }),
  body('businessEmail').optional().isEmail().normalizeEmail(),
  body('businessRegistrationNumber').optional().trim(),
  body('businessType').optional().trim()
], async (req, res) => {
  try {
    if (req.user.role !== 'merchant') {
      return res.status(403).json({ message: 'Merchant access required' });
    }

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation errors', 
        errors: errors.array() 
      });
    }

    const allowedFields = ['businessName', 'businessEmail', 'businessRegistrationNumber', 'businessType'];
    const updates = {};

    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) {
        updates[`businessInfo.${field}`] = req.body[field];
      }
    });

    const user = await User.findByIdAndUpdate(
      req.user._id,
      updates,
      { new: true, runValidators: true }
    );

    res.json({
      message: 'Business information updated successfully',
      user: user.toSafeObject()
    });

  } catch (error) {
    console.error('Update business info error:', error);
    res.status(500).json({ message: 'Failed to update business information' });
  }
});

// Deactivate account
router.patch('/deactivate', authenticateToken, [
  body('reason').optional().trim()
], async (req, res) => {
  try {
    const { reason } = req.body;

    await User.findByIdAndUpdate(req.user._id, {
      isActive: false,
      deactivatedAt: new Date(),
      deactivationReason: reason
    });

    res.json({ message: 'Account deactivated successfully' });

  } catch (error) {
    console.error('Deactivate account error:', error);
    res.status(500).json({ message: 'Failed to deactivate account' });
  }
});

// Get user by ID (admin only or self)
router.get('/:id', authenticateToken, requireOwnershipOrAdmin('id'), async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      user: user.toSafeObject()
    });

  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ message: 'Failed to get user' });
  }
});

module.exports = router;
