const express = require('express');
const router = express.Router();
const UnderwritingModel = require('../models/UnderwritingModel');
const { authenticateToken, requireRole } = require('../middleware/auth');

// Middleware aliases
const protect = authenticateToken;
const adminOnly = requireRole('admin');

// Get active underwriting model
router.get('/model', protect, adminOnly, async (req, res) => {
  try {
    let model = await UnderwritingModel.findOne({ isActive: true }).sort({ createdAt: -1 });
    
    // If no model exists, create default one
    if (!model) {
      model = await UnderwritingModel.create({
        createdBy: req.user._id
      });
    }
    
    res.json(model);
  } catch (error) {
    console.error('Error fetching underwriting model:', error);
    res.status(500).json({ message: 'Error fetching underwriting model', error: error.message });
  }
});

// Update underwriting model
router.put('/model', protect, adminOnly, async (req, res) => {
  try {
    const { metrics, parameters } = req.body;
    
    // Validate payment schedule sums to 100
    if (parameters.paymentSchedule) {
      const sum = parameters.paymentSchedule.reduce((acc, val) => acc + val, 0);
      if (sum !== 100) {
        return res.status(400).json({ message: 'Payment schedule percentages must sum to 100%' });
      }
    }
    
    // Get current active model to determine next version number
    const currentModel = await UnderwritingModel.findOne({ isActive: true });
    const nextVersion = currentModel ? currentModel.version + 1 : 1;
    
    // Deactivate all existing models
    await UnderwritingModel.updateMany({}, { isActive: false });
    
    // Create new model version (never overwrite)
    const model = await UnderwritingModel.create({
      metrics,
      parameters,
      version: nextVersion,
      isActive: true,
      createdBy: req.user._id,
      updatedBy: req.user._id
    });
    
    res.json(model);
  } catch (error) {
    console.error('Error updating underwriting model:', error);
    res.status(500).json({ message: 'Error updating underwriting model', error: error.message });
  }
});

// Test applicant against model (public endpoint for BNPL checkout)
router.post('/model/test', async (req, res) => {
  try {
    const { applicant, loanAmount } = req.body;
    
    // Get active model
    const model = await UnderwritingModel.findOne({ isActive: true });
    
    if (!model) {
      return res.status(404).json({ message: 'No active underwriting model found' });
    }
    
    // Evaluate applicant (pass loan amount for income ratio check)
    const evaluation = model.evaluateApplicant(applicant, loanAmount);
    
    // Calculate loan details if approved
    let loanDetails = null;
    if (evaluation.approved && loanAmount) {
      loanDetails = model.calculateLoanDetails(loanAmount);
    }
    
    res.json({
      evaluation,
      loanDetails,
      modelVersion: model.version,
      thresholds: model.metrics
    });
  } catch (error) {
    console.error('Error testing applicant:', error);
    res.status(500).json({ message: 'Error testing applicant', error: error.message });
  }
});

// Get model history (all versions)
router.get('/model/history', protect, adminOnly, async (req, res) => {
  try {
    const models = await UnderwritingModel.find()
      .sort({ version: -1 })
      .populate('createdBy', 'firstName lastName email')
      .populate('updatedBy', 'firstName lastName email');
    
    res.json(models);
  } catch (error) {
    console.error('Error fetching model history:', error);
    res.status(500).json({ message: 'Error fetching model history', error: error.message });
  }
});

module.exports = router;
