const mongoose = require('mongoose');

const hrContactSchema = new mongoose.Schema({
  name: {
    type: String,
    trim: true
  },
  email: {
    type: String,
    required: [true, 'HR contact email is required'],
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  phone: {
    type: String,
    trim: true
  },
  isPrimary: {
    type: Boolean,
    default: false
  }
}, { _id: true });

const cdlCompanySchema = new mongoose.Schema({
  // Company Information
  companyName: {
    type: String,
    required: [true, 'Company name is required'],
    unique: true,
    trim: true
  },
  aliases: [{
    type: String,
    trim: true
  }],

  // HR Contacts
  hrContacts: {
    type: [hrContactSchema],
    validate: {
      validator: function(v) {
        return v && v.length > 0;
      },
      message: 'At least one HR contact is required'
    }
  },

  // Company Details
  industry: {
    type: String,
    trim: true
  },
  website: {
    type: String,
    trim: true
  },
  address: {
    street: { type: String, trim: true },
    city: { type: String, trim: true },
    county: { type: String, trim: true },
    country: { type: String, default: 'Kenya' }
  },

  // Status
  isActive: {
    type: Boolean,
    default: true
  },

  // Verification Statistics
  verificationStats: {
    totalRequests: {
      type: Number,
      default: 0
    },
    verifiedCount: {
      type: Number,
      default: 0
    },
    unverifiedCount: {
      type: Number,
      default: 0
    },
    averageResponseDays: {
      type: Number,
      default: null
    },
    lastVerificationAt: {
      type: Date
    }
  },

  // Notes
  notes: {
    type: String,
    trim: true
  },

  // Audit
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
cdlCompanySchema.index({ companyName: 1 });
cdlCompanySchema.index({ aliases: 1 });
cdlCompanySchema.index({ isActive: 1 });
cdlCompanySchema.index({ 'hrContacts.email': 1 });

// Virtual for primary HR contact
cdlCompanySchema.virtual('primaryHRContact').get(function() {
  if (!this.hrContacts || this.hrContacts.length === 0) return null;
  const primary = this.hrContacts.find(c => c.isPrimary);
  return primary || this.hrContacts[0];
});

// Virtual for verification success rate
cdlCompanySchema.virtual('verificationSuccessRate').get(function() {
  if (this.verificationStats.totalRequests === 0) return null;
  return Math.round((this.verificationStats.verifiedCount / this.verificationStats.totalRequests) * 100);
});

// Method to get primary HR email
cdlCompanySchema.methods.getPrimaryHREmail = function() {
  const primary = this.hrContacts.find(c => c.isPrimary);
  return primary ? primary.email : (this.hrContacts[0]?.email || null);
};

// Method to update verification stats
cdlCompanySchema.methods.updateVerificationStats = async function(isVerified, responseDays) {
  this.verificationStats.totalRequests += 1;

  if (isVerified) {
    this.verificationStats.verifiedCount += 1;
  } else {
    this.verificationStats.unverifiedCount += 1;
  }

  // Update average response days
  if (responseDays !== null && responseDays !== undefined) {
    const currentAvg = this.verificationStats.averageResponseDays || 0;
    const currentTotal = this.verificationStats.totalRequests - 1;

    if (currentTotal === 0) {
      this.verificationStats.averageResponseDays = responseDays;
    } else {
      this.verificationStats.averageResponseDays =
        ((currentAvg * currentTotal) + responseDays) / this.verificationStats.totalRequests;
    }
  }

  this.verificationStats.lastVerificationAt = new Date();

  return this.save();
};

// Static method to find by name or alias
cdlCompanySchema.statics.findByNameOrAlias = function(name) {
  const searchName = name.toLowerCase().trim();
  return this.findOne({
    isActive: true,
    $or: [
      { companyName: { $regex: new RegExp(`^${searchName}$`, 'i') } },
      { aliases: { $regex: new RegExp(`^${searchName}$`, 'i') } }
    ]
  });
};

// Static method to search companies
cdlCompanySchema.statics.searchCompanies = function(query, options = {}) {
  const searchQuery = {
    isActive: options.includeInactive ? { $in: [true, false] } : true
  };

  if (query) {
    searchQuery.$or = [
      { companyName: { $regex: query, $options: 'i' } },
      { aliases: { $regex: query, $options: 'i' } }
    ];
  }

  return this.find(searchQuery)
    .sort({ companyName: 1 })
    .limit(options.limit || 50);
};

module.exports = mongoose.model('CDLCompany', cdlCompanySchema);
