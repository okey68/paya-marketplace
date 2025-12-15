const express = require('express');
const router = express.Router();
const CDLCompany = require('../models/CDLCompany');
const { authenticateToken, requireRole } = require('../middleware/auth');

/**
 * @route   GET /api/cdl-companies
 * @desc    Get all CDL companies (with optional search)
 * @access  Admin/Public (limited fields for public)
 */
router.get('/', async (req, res) => {
  try {
    const { search, active, limit = 50 } = req.query;

    const query = {};

    // Filter by active status
    if (active !== undefined) {
      query.isActive = active === 'true';
    } else {
      query.isActive = true; // Default to active only
    }

    // Search by name or alias
    if (search) {
      query.$or = [
        { companyName: { $regex: search, $options: 'i' } },
        { aliases: { $regex: search, $options: 'i' } }
      ];
    }

    const companies = await CDLCompany.find(query)
      .select('companyName aliases hrContacts industry isActive verificationStats')
      .sort({ companyName: 1 })
      .limit(parseInt(limit));

    res.json({
      success: true,
      count: companies.length,
      companies
    });
  } catch (error) {
    console.error('Error fetching CDL companies:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching companies',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/cdl-companies/:id
 * @desc    Get single CDL company by ID
 * @access  Admin
 */
router.get('/:id', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const company = await CDLCompany.findById(req.params.id);

    if (!company) {
      return res.status(404).json({
        success: false,
        message: 'Company not found'
      });
    }

    res.json({
      success: true,
      company
    });
  } catch (error) {
    console.error('Error fetching company:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching company',
      error: error.message
    });
  }
});

/**
 * @route   POST /api/cdl-companies
 * @desc    Create new CDL company
 * @access  Admin
 */
router.post('/', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const {
      companyName,
      aliases,
      hrContacts,
      industry,
      website,
      address,
      notes
    } = req.body;

    // Validate required fields
    if (!companyName) {
      return res.status(400).json({
        success: false,
        message: 'Company name is required'
      });
    }

    if (!hrContacts || hrContacts.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'At least one HR contact is required'
      });
    }

    // Check for duplicate company name
    const existingCompany = await CDLCompany.findOne({
      companyName: { $regex: new RegExp(`^${companyName}$`, 'i') }
    });

    if (existingCompany) {
      return res.status(400).json({
        success: false,
        message: 'Company with this name already exists'
      });
    }

    // Ensure at least one HR contact has an email
    const hasValidContact = hrContacts.some(contact => contact.email);
    if (!hasValidContact) {
      return res.status(400).json({
        success: false,
        message: 'At least one HR contact must have an email address'
      });
    }

    // Set first contact as primary if none specified
    const processedContacts = hrContacts.map((contact, index) => ({
      ...contact,
      isPrimary: contact.isPrimary || (index === 0 && !hrContacts.some(c => c.isPrimary))
    }));

    const company = new CDLCompany({
      companyName,
      aliases: aliases || [],
      hrContacts: processedContacts,
      industry,
      website,
      address,
      notes,
      createdBy: req.user.id
    });

    await company.save();

    res.status(201).json({
      success: true,
      message: 'Company created successfully',
      company
    });
  } catch (error) {
    console.error('Error creating company:', error);

    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Company with this name already exists'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error creating company',
      error: error.message
    });
  }
});

/**
 * @route   PATCH /api/cdl-companies/:id
 * @desc    Update CDL company
 * @access  Admin
 */
router.patch('/:id', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const {
      companyName,
      aliases,
      hrContacts,
      industry,
      website,
      address,
      notes,
      isActive
    } = req.body;

    const company = await CDLCompany.findById(req.params.id);

    if (!company) {
      return res.status(404).json({
        success: false,
        message: 'Company not found'
      });
    }

    // Check for duplicate name if changing
    if (companyName && companyName !== company.companyName) {
      const existingCompany = await CDLCompany.findOne({
        companyName: { $regex: new RegExp(`^${companyName}$`, 'i') },
        _id: { $ne: req.params.id }
      });

      if (existingCompany) {
        return res.status(400).json({
          success: false,
          message: 'Company with this name already exists'
        });
      }
    }

    // Update fields
    if (companyName) company.companyName = companyName;
    if (aliases !== undefined) company.aliases = aliases;
    if (hrContacts !== undefined) {
      // Validate HR contacts
      if (hrContacts.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'At least one HR contact is required'
        });
      }
      company.hrContacts = hrContacts;
    }
    if (industry !== undefined) company.industry = industry;
    if (website !== undefined) company.website = website;
    if (address !== undefined) company.address = address;
    if (notes !== undefined) company.notes = notes;
    if (isActive !== undefined) company.isActive = isActive;

    company.updatedBy = req.user.id;

    await company.save();

    res.json({
      success: true,
      message: 'Company updated successfully',
      company
    });
  } catch (error) {
    console.error('Error updating company:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating company',
      error: error.message
    });
  }
});

/**
 * @route   DELETE /api/cdl-companies/:id
 * @desc    Deactivate CDL company (soft delete)
 * @access  Admin
 */
router.delete('/:id', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const company = await CDLCompany.findById(req.params.id);

    if (!company) {
      return res.status(404).json({
        success: false,
        message: 'Company not found'
      });
    }

    // Soft delete - just deactivate
    company.isActive = false;
    company.updatedBy = req.user.id;
    await company.save();

    res.json({
      success: true,
      message: 'Company deactivated successfully'
    });
  } catch (error) {
    console.error('Error deactivating company:', error);
    res.status(500).json({
      success: false,
      message: 'Error deactivating company',
      error: error.message
    });
  }
});

/**
 * @route   POST /api/cdl-companies/:id/hr-contacts
 * @desc    Add HR contact to company
 * @access  Admin
 */
router.post('/:id/hr-contacts', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const { name, email, phone, isPrimary } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required for HR contact'
      });
    }

    const company = await CDLCompany.findById(req.params.id);

    if (!company) {
      return res.status(404).json({
        success: false,
        message: 'Company not found'
      });
    }

    // If setting as primary, unset others
    if (isPrimary) {
      company.hrContacts.forEach(contact => {
        contact.isPrimary = false;
      });
    }

    company.hrContacts.push({
      name,
      email,
      phone,
      isPrimary: isPrimary || false
    });

    company.updatedBy = req.user.id;
    await company.save();

    res.json({
      success: true,
      message: 'HR contact added successfully',
      company
    });
  } catch (error) {
    console.error('Error adding HR contact:', error);
    res.status(500).json({
      success: false,
      message: 'Error adding HR contact',
      error: error.message
    });
  }
});

/**
 * @route   DELETE /api/cdl-companies/:id/hr-contacts/:contactId
 * @desc    Remove HR contact from company
 * @access  Admin
 */
router.delete('/:id/hr-contacts/:contactId', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const company = await CDLCompany.findById(req.params.id);

    if (!company) {
      return res.status(404).json({
        success: false,
        message: 'Company not found'
      });
    }

    const contactIndex = company.hrContacts.findIndex(
      c => c._id.toString() === req.params.contactId
    );

    if (contactIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'HR contact not found'
      });
    }

    // Don't allow removing last contact
    if (company.hrContacts.length === 1) {
      return res.status(400).json({
        success: false,
        message: 'Cannot remove the last HR contact'
      });
    }

    company.hrContacts.splice(contactIndex, 1);
    company.updatedBy = req.user.id;
    await company.save();

    res.json({
      success: true,
      message: 'HR contact removed successfully',
      company
    });
  } catch (error) {
    console.error('Error removing HR contact:', error);
    res.status(500).json({
      success: false,
      message: 'Error removing HR contact',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/cdl-companies/:id/stats
 * @desc    Get company verification statistics
 * @access  Admin
 */
router.get('/:id/stats', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const company = await CDLCompany.findById(req.params.id)
      .select('companyName verificationStats');

    if (!company) {
      return res.status(404).json({
        success: false,
        message: 'Company not found'
      });
    }

    res.json({
      success: true,
      companyName: company.companyName,
      stats: company.verificationStats,
      successRate: company.verificationSuccessRate
    });
  } catch (error) {
    console.error('Error fetching company stats:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching company statistics',
      error: error.message
    });
  }
});

module.exports = router;
