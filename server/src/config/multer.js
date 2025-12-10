const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Disk storage for payslip documents
const payslipDiskStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'payslip-' + uniqueSuffix + path.extname(file.originalname));
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

// Configure multer for payslip uploads
const uploadPayslip = multer({
  storage: payslipDiskStorage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: documentFileFilter
});

module.exports = {
  uploadPayslip
};
