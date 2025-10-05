const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  // Basic Info
  firstName: {
    type: String,
    required: [true, 'First name is required'],
    trim: true,
    maxlength: [50, 'First name cannot exceed 50 characters']
  },
  lastName: {
    type: String,
    required: [true, 'Last name is required'],
    trim: true,
    maxlength: [50, 'Last name cannot exceed 50 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters']
  },
  
  // User Role
  role: {
    type: String,
    enum: ['customer', 'merchant', 'admin'],
    default: 'customer'
  },
  
  // Customer-specific fields
  dateOfBirth: {
    type: Date,
    required: function() { return this.role === 'customer'; }
  },
  kraPin: {
    type: String,
    required: function() { return this.role === 'customer'; },
    trim: true,
    uppercase: true
  },
  phoneNumber: {
    type: String,
    trim: true
  },
  
  // Address
  address: {
    street: { type: String, trim: true },
    city: { type: String, trim: true },
    county: { type: String, trim: true },
    postalCode: { type: String, trim: true },
    country: { type: String, default: 'Kenya' }
  },
  
  // Account Status
  isActive: {
    type: Boolean,
    default: true
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  
  // Merchant-specific fields (populated when role is merchant)
  businessInfo: {
    businessName: { type: String, trim: true },
    businessEmail: { type: String, lowercase: true, trim: true },
    businessRegistrationNumber: { type: String, trim: true },
    businessType: { type: String, trim: true },
    taxId: { type: String, trim: true },
    
    // Business documents
    documents: {
      businessFormation: {
        filename: { type: String, default: null },
        originalName: { type: String, default: null },
        path: { type: String, default: null },
        size: { type: Number, default: null },
        uploadDate: { type: Date, default: null }
      },
      businessPermit: {
        filename: { type: String, default: null },
        originalName: { type: String, default: null },
        path: { type: String, default: null },
        size: { type: Number, default: null },
        uploadDate: { type: Date, default: null }
      }
    },
    
    // Business status
    approvalStatus: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending'
    },
    approvedAt: { type: Date },
    rejectedAt: { type: Date },
    rejectionReason: { type: String }
  },
  
  // Timestamps
  lastLogin: { type: Date },
  profileCompletedAt: { type: Date }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
userSchema.index({ email: 1 });
userSchema.index({ role: 1 });
userSchema.index({ 'businessInfo.approvalStatus': 1 });
userSchema.index({ isActive: 1 });

// Virtual for full name
userSchema.virtual('fullName').get(function() {
  return `${this.firstName} ${this.lastName}`;
});

// Virtual to check if profile is complete
userSchema.virtual('isProfileComplete').get(function() {
  const basicComplete = this.firstName && this.lastName && this.email;
  
  if (this.role === 'customer') {
    return basicComplete && this.dateOfBirth && this.kraPin && this.address.street;
  }
  
  if (this.role === 'merchant') {
    return basicComplete && 
           this.businessInfo.businessName && 
           this.businessInfo.businessEmail &&
           this.businessInfo.documents.businessFormation.filename &&
           this.businessInfo.documents.businessPermit.filename;
  }
  
  return basicComplete;
});

// Pre-save middleware to hash password
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare password
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Method to get safe user data (without password)
userSchema.methods.toSafeObject = function() {
  const user = this.toObject();
  delete user.password;
  return user;
};

// Static method to find merchants by approval status
userSchema.statics.findMerchantsByStatus = function(status) {
  return this.find({ 
    role: 'merchant', 
    'businessInfo.approvalStatus': status,
    isActive: true 
  });
};

module.exports = mongoose.model('User', userSchema);
