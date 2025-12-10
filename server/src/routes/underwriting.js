const express = require('express');
const router = express.Router();
const UnderwritingModel = require('../models/UnderwritingModel');
const User = require('../models/User');
const { authenticateToken, requireRole } = require('../middleware/auth');
const { uploadPayslip } = require('../config/multer');
const { body, validationResult } = require('express-validator');

// Middleware aliases
const protect = authenticateToken;
const adminOnly = requireRole('admin');

// Upload payslip and financial information
router.post('/upload-financial-info', uploadPayslip.single('payslip'), [
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('monthlyIncome').isNumeric().withMessage('Monthly income must be a number'),
  body('monthlyDebt').isNumeric().withMessage('Monthly debt must be a number')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    const { email, monthlyIncome, monthlyDebt } = req.body;

    // Find user by email
    let user = await User.findOne({ email, isActive: true });
    
    if (!user) {
      return res.status(404).json({ message: 'User not found. Please complete customer information first.' });
    }

    // Update employment and financial information
    user.employmentInfo = user.employmentInfo || {};
    user.employmentInfo.monthlyIncome = parseFloat(monthlyIncome);

    user.financialInfo = user.financialInfo || {};
    user.financialInfo.monthlyDebt = parseFloat(monthlyDebt);
    user.financialInfo.otherObligations = parseFloat(monthlyDebt); // Use debt as other obligations

    // Store payslip information if file was uploaded
    if (req.file) {
      user.financialInfo.payslip = {
        filename: req.file.filename,
        originalName: req.file.originalname,
        uploadDate: new Date(),
        path: req.file.path
      };
    }

    await user.save();

    res.json({
      message: 'Financial information uploaded successfully',
      financialInfo: {
        monthlyIncome: user.employmentInfo.monthlyIncome,
        monthlyDebt: user.financialInfo.monthlyDebt,
        payslipUploaded: !!req.file,
        email: user.email
      }
    });
  } catch (error) {
    console.error('Error uploading financial information:', error);
    res.status(500).json({ message: 'Error uploading financial information', error: error.message });
  }
});

// Add Next of Kin for BNPL Agreement
router.post('/add-next-of-kin', [
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('nextOfKin.firstName').trim().isLength({ min: 1 }).withMessage('Next of kin first name is required'),
  body('nextOfKin.lastName').trim().isLength({ min: 1 }).withMessage('Next of kin last name is required'),
  body('nextOfKin.relationship').trim().isLength({ min: 1 }).withMessage('Relationship is required'),
  body('nextOfKin.phoneNumber').trim().isLength({ min: 1 }).withMessage('Next of kin phone number is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    const { email, nextOfKin } = req.body;

    // Find user by email
    const user = await User.findOne({ email, isActive: true });
    
    if (!user) {
      return res.status(404).json({ message: 'User not found. Please complete previous steps first.' });
    }

    // Update next of kin information
    user.nextOfKin = {
      firstName: nextOfKin.firstName,
      lastName: nextOfKin.lastName,
      relationship: nextOfKin.relationship,
      phoneCountryCode: nextOfKin.phoneCountryCode || '+254',
      phoneNumber: nextOfKin.phoneNumber,
      email: nextOfKin.email || ''
    };

    await user.save();

    res.json({
      message: 'Next of kin information added successfully',
      nextOfKin: {
        firstName: user.nextOfKin.firstName,
        lastName: user.nextOfKin.lastName,
        relationship: user.nextOfKin.relationship,
        phoneNumber: `${user.nextOfKin.phoneCountryCode}${user.nextOfKin.phoneNumber}`,
        email: user.nextOfKin.email
      }
    });
  } catch (error) {
    console.error('Error adding next of kin:', error);
    res.status(500).json({ message: 'Error adding next of kin information', error: error.message });
  }
});

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
    const { applicant, loanAmount, email } = req.body;
    
    // Get active model
    const model = await UnderwritingModel.findOne({ isActive: true });
    
    if (!model) {
      return res.status(404).json({ message: 'No active underwriting model found' });
    }

    // If email is provided, fetch user data to enrich applicant info
    let enrichedApplicant = { ...applicant };
    
    if (email) {
      const user = await User.findOne({ email, isActive: true });
      
      if (user) {
        // Use user's stored financial information
        enrichedApplicant = {
          ...enrichedApplicant,
          income: user.employmentInfo?.monthlyIncome || applicant.income,
          yearsEmployed: user.employmentInfo?.yearsEmployed || applicant.yearsEmployed || 1,
          creditScore: user.financialInfo?.creditScore || applicant.creditScore || 650,
          defaults: user.financialInfo?.defaultCount || applicant.defaults || 0,
          otherObligations: user.financialInfo?.monthlyDebt || user.financialInfo?.otherObligations || applicant.otherObligations || 0
        };

        // Calculate age from dateOfBirth if available
        if (user.dateOfBirth) {
          const today = new Date();
          const birthDate = new Date(user.dateOfBirth);
          let age = today.getFullYear() - birthDate.getFullYear();
          const monthDiff = today.getMonth() - birthDate.getMonth();
          if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
            age--;
          }
          enrichedApplicant.age = age;
        }
      }
    }
    
    // Evaluate applicant (pass loan amount for income ratio check)
    const evaluation = model.evaluateApplicant(enrichedApplicant, loanAmount);
    
    // Calculate loan details if approved
    let loanDetails = null;
    if (evaluation.approved && loanAmount) {
      loanDetails = model.calculateLoanDetails(loanAmount);
    }
    
    res.json({
      evaluation,
      loanDetails,
      modelVersion: model.version,
      thresholds: model.metrics,
      applicantData: enrichedApplicant // Return enriched data for transparency
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
