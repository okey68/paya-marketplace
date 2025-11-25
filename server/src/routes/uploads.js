const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const mongoose = require('mongoose');
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

// File filter to accept images and PDFs
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|pdf|doc|docx/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error('Only images (JPEG, PNG) and documents (PDF, DOC, DOCX) are allowed'));
  }
};

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: fileFilter
});

// @route   POST /api/uploads/business-doc
// @desc    Upload business document
// @access  Private (Merchant)
router.post('/business-doc', authenticateToken, upload.single('document'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const { documentType, category } = req.body;
    
    console.log('Upload request:', { documentType, category, filename: req.file.filename });
    
    // Return file info without saving to database for now
    // The frontend will handle saving during final submission
    const fileInfo = {
      filename: req.file.filename,
      originalName: req.file.originalname,
      path: `/uploads/${req.file.filename}`,
      size: req.file.size,
      uploadDate: new Date()
    };

    res.json({
      message: 'Document uploaded successfully',
      file: fileInfo
    });
  } catch (error) {
    console.error('Business document upload error:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ 
      message: 'Server error during file upload',
      error: error.message 
    });
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

// @route   GET /api/uploads/:id
// @desc    Get file from GridFS by ObjectId (for Shopify images)
// @access  Public (images should be publicly accessible)
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Check if it looks like a MongoDB ObjectId (24 hex characters)
    if (mongoose.Types.ObjectId.isValid(id) && /^[a-f0-9]{24}$/i.test(id)) {
      // Try to serve from GridFS
      const db = mongoose.connection.db;

      if (!db) {
        return res.status(503).json({ message: 'Database connection not ready' });
      }

      const bucket = new mongoose.mongo.GridFSBucket(db, {
        bucketName: 'uploads'
      });

      try {
        const files = await bucket.find({ _id: new mongoose.Types.ObjectId(id) }).toArray();

        if (!files || files.length === 0) {
          return res.status(404).json({ message: 'Image not found in GridFS' });
        }

        const file = files[0];

        // Set appropriate headers
        res.set('Content-Type', file.contentType || 'image/jpeg');
        res.set('Content-Disposition', `inline; filename="${file.filename}"`);
        res.set('Cache-Control', 'public, max-age=86400'); // Cache for 24 hours

        // Stream the file from GridFS to response
        const downloadStream = bucket.openDownloadStream(new mongoose.Types.ObjectId(id));

        downloadStream.on('error', (err) => {
          console.error('GridFS download stream error:', err);
          if (!res.headersSent) {
            res.status(500).json({ message: 'Error streaming file' });
          }
        });

        downloadStream.pipe(res);
        return;
      } catch (gridfsError) {
        console.error('GridFS error:', gridfsError);
        // Fall through to filesystem check
      }
    }

    // If not a valid ObjectId or not found in GridFS, try filesystem
    const filePath = path.join(uploadsDir, id);

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
