const multer = require('multer');
const { GridFsStorage } = require('multer-gridfs-storage');
const path = require('path');

// MongoDB connection URI
const mongoURI = process.env.MONGODB_URI || 'mongodb+srv://okey68_db_user:6PyTMOIkvsQF5cRh@college.gd8jyma.mongodb.net/paya-marketplace?retryWrites=true&w=majority';

// Create storage engine for business documents
const businessDocStorage = new GridFsStorage({
  url: mongoURI,
  file: (req, file) => {
    return new Promise((resolve, reject) => {
      const filename = `${Date.now()}-${file.originalname}`;
      const fileInfo = {
        filename: filename,
        bucketName: 'uploads',
        metadata: {
          originalName: file.originalname,
          uploadedBy: req.user?.userId || 'unknown',
          uploadDate: new Date(),
          fileType: 'business-document',
          documentType: req.body.documentType || 'general'
        }
      };
      resolve(fileInfo);
    });
  }
});

// Create storage engine for product images
const productImageStorage = new GridFsStorage({
  url: mongoURI,
  file: (req, file) => {
    return new Promise((resolve, reject) => {
      const filename = `${Date.now()}-${file.originalname}`;
      const fileInfo = {
        filename: filename,
        bucketName: 'uploads',
        metadata: {
          originalName: file.originalname,
          uploadedBy: req.user?.userId || 'unknown',
          uploadDate: new Date(),
          fileType: 'product-image',
          productId: req.body.productId || null
        }
      };
      resolve(fileInfo);
    });
  }
});

// File filter for documents (PDF, DOC, DOCX, JPG, PNG)
const documentFileFilter = (req, file, cb) => {
  const allowedTypes = /pdf|doc|docx|jpg|jpeg|png/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error('Only PDF, DOC, DOCX, JPG, and PNG files are allowed for documents'));
  }
};

// File filter for images (JPG, JPEG, PNG, GIF, WEBP)
const imageFileFilter = (req, file, cb) => {
  const allowedTypes = /jpg|jpeg|png|gif|webp/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error('Only JPG, JPEG, PNG, GIF, and WEBP files are allowed for images'));
  }
};

// Configure multer for business documents
const uploadBusinessDoc = multer({
  storage: businessDocStorage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: documentFileFilter
});

// Configure multer for product images
const uploadProductImage = multer({
  storage: productImageStorage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: imageFileFilter
});

module.exports = {
  uploadBusinessDoc,
  uploadProductImage
};
