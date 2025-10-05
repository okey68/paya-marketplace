const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { authenticateToken } = require('../middleware/auth');
const User = require('../models/User');

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Simple multer configuration for now
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

// @route   POST /api/uploads/business-doc
// @desc    Upload business document
// @access  Private (Merchant)
router.post('/business-doc', authenticateToken, upload.single('document'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const { documentType } = req.body;
    
    // Update user's business documents
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Update the specific document type
    if (documentType === 'businessFormation') {
      user.businessInfo.documents.businessFormation = {
        filename: req.file.filename,
        originalName: req.file.originalname,
        path: req.file.path,
        size: req.file.size,
        uploadDate: new Date()
      };
    } else if (documentType === 'businessPermit') {
      user.businessInfo.documents.businessPermit = {
        filename: req.file.filename,
        originalName: req.file.originalname,
        path: req.file.path,
        size: req.file.size,
        uploadDate: new Date()
      };
    }

    await user.save();

    res.json({
      message: 'Document uploaded successfully',
      file: {
        id: req.file.filename,
        filename: req.file.filename,
        originalName: req.file.originalname,
        size: req.file.size,
        documentType
      }
    });
  } catch (error) {
    console.error('Business document upload error:', error);
    res.status(500).json({ message: 'Server error during file upload' });
  }
});

// @route   POST /api/uploads/product-image
// @desc    Upload product image
// @access  Private (Merchant)
router.post('/product-image', authenticateToken, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    res.json({
      message: 'Product image uploaded successfully',
      file: {
        id: req.file.filename,
        filename: req.file.filename,
        originalName: req.file.originalname,
        size: req.file.size
      }
    });
  } catch (error) {
    console.error('Product image upload error:', error);
    res.status(500).json({ message: 'Server error during file upload' });
  }
});

// @route   GET /api/uploads/:filename
// @desc    Get uploaded file
// @access  Private
router.get('/:filename', authenticateToken, async (req, res) => {
  try {
    const { filename } = req.params;
    const filePath = path.join(uploadsDir, filename);
    
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: 'File not found' });
    }

    res.sendFile(filePath);
  } catch (error) {
    console.error('File retrieval error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/uploads/:filename
// @desc    Delete uploaded file
// @access  Private
router.delete('/:filename', authenticateToken, async (req, res) => {
  try {
    const { filename } = req.params;
    const filePath = path.join(uploadsDir, filename);
    
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    res.json({ message: 'File deleted successfully' });
  } catch (error) {
    console.error('File deletion error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
