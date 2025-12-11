const mongoose = require('mongoose');

const timelineEntrySchema = new mongoose.Schema({
  action: {
    type: String,
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  performedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  details: {
    type: String
  }
}, { _id: true });

const hrVerificationSchema = new mongoose.Schema({
  // References
  order: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    required: true
  },
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  company: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'CDLCompany',
    required: true
  },

  // HR Contact snapshot (in case company details change)
  hrContactSnapshot: {
    companyName: { type: String },
    contactName: { type: String },
    email: { type: String, required: true },
    phone: { type: String }
  },

  // Customer info snapshot
  customerSnapshot: {
    firstName: { type: String },
    lastName: { type: String },
    email: { type: String },
    employerName: { type: String },
    monthlyIncome: { type: Number }
  },

  // Verification Status
  status: {
    type: String,
    enum: [
      'pending_send',        // Initial state - waiting to send email
      'email_sent',          // Email dispatched to HR
      'awaiting_response',   // Waiting for HR reply
      'verified',            // Admin confirmed verified
      'unverified',          // Admin confirmed not verified
      'customer_contacted',  // Customer notified of issues
      'timeout',             // No response, escalated to admin
      'cancelled'            // Order cancelled
    ],
    default: 'pending_send'
  },

  // Documents
  payslipPath: {
    type: String
  },
  payslipOriginalName: {
    type: String
  },
  agreementPdfPath: {
    type: String
  },

  // Email Tracking
  emailSentAt: {
    type: Date
  },
  emailMessageId: {
    type: String
  },
  emailSubject: {
    type: String
  },

  // Reminder Tracking
  remindersSent: [{
    sentAt: { type: Date },
    messageId: { type: String }
  }],
  maxReminders: {
    type: Number,
    default: 2
  },

  // Response Deadline
  responseDeadline: {
    type: Date
  },

  // Admin Review
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  reviewedAt: {
    type: Date
  },
  reviewNotes: {
    type: String
  },

  // Verification Result
  verificationResult: {
    verified: { type: Boolean },
    reason: { type: String },
    verifiedBy: {
      type: String,
      enum: ['admin_manual', 'auto_timeout']
    }
  },

  // Customer Contact (if unverified)
  customerContact: {
    contactedAt: { type: Date },
    contactReason: { type: String },
    contactMethod: {
      type: String,
      enum: ['email', 'phone', 'both']
    },
    contactedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    customerResponse: { type: String },
    customerRespondedAt: { type: Date }
  },

  // Timeline for audit trail
  timeline: [timelineEntrySchema],

  // Priority flag for urgent cases
  isPriority: {
    type: Boolean,
    default: false
  },

  // Flags
  isEscalated: {
    type: Boolean,
    default: false
  },
  escalatedAt: {
    type: Date
  },
  escalationReason: {
    type: String
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
hrVerificationSchema.index({ order: 1 }, { unique: true });
hrVerificationSchema.index({ customer: 1 });
hrVerificationSchema.index({ company: 1 });
hrVerificationSchema.index({ status: 1 });
hrVerificationSchema.index({ emailSentAt: 1 });
hrVerificationSchema.index({ responseDeadline: 1 });
hrVerificationSchema.index({ isEscalated: 1, status: 1 });
hrVerificationSchema.index({ createdAt: -1 });

// Virtual for days since email sent
hrVerificationSchema.virtual('daysSinceEmailSent').get(function() {
  if (!this.emailSentAt) return null;
  return Math.floor((Date.now() - this.emailSentAt) / (1000 * 60 * 60 * 24));
});

// Virtual for is overdue
hrVerificationSchema.virtual('isOverdue').get(function() {
  if (!this.responseDeadline) return false;
  return Date.now() > this.responseDeadline;
});

// Virtual for response time in days (if completed)
hrVerificationSchema.virtual('responseTimeDays').get(function() {
  if (!this.emailSentAt || !this.reviewedAt) return null;
  return Math.floor((this.reviewedAt - this.emailSentAt) / (1000 * 60 * 60 * 24));
});

// Method to add timeline entry
hrVerificationSchema.methods.addTimelineEntry = function(action, details, performedBy = null) {
  this.timeline.push({
    action,
    details,
    performedBy,
    timestamp: new Date()
  });
};

// Method to mark as email sent
hrVerificationSchema.methods.markEmailSent = function(messageId, subject) {
  this.status = 'email_sent';
  this.emailSentAt = new Date();
  this.emailMessageId = messageId;
  this.emailSubject = subject;

  // Set response deadline (72 hours from now)
  const deadline = new Date();
  deadline.setHours(deadline.getHours() + (process.env.HR_VERIFICATION_TIMEOUT_HOURS || 72));
  this.responseDeadline = deadline;

  this.addTimelineEntry('email_sent', `Verification email sent to ${this.hrContactSnapshot.email}`);

  return this.save();
};

// Method to add reminder
hrVerificationSchema.methods.addReminder = function(messageId) {
  this.remindersSent.push({
    sentAt: new Date(),
    messageId
  });

  this.addTimelineEntry('reminder_sent', `Reminder #${this.remindersSent.length} sent to HR`);

  return this.save();
};

// Method to mark as verified
hrVerificationSchema.methods.markAsVerified = function(adminId, notes = null) {
  this.status = 'verified';
  this.reviewedBy = adminId;
  this.reviewedAt = new Date();
  this.reviewNotes = notes;
  this.verificationResult = {
    verified: true,
    reason: notes || 'Verified by admin',
    verifiedBy: 'admin_manual'
  };

  this.addTimelineEntry('verified', notes || 'Payslip verified by admin', adminId);

  return this.save();
};

// Method to mark as unverified
hrVerificationSchema.methods.markAsUnverified = function(adminId, reason) {
  this.status = 'unverified';
  this.reviewedBy = adminId;
  this.reviewedAt = new Date();
  this.reviewNotes = reason;
  this.verificationResult = {
    verified: false,
    reason: reason,
    verifiedBy: 'admin_manual'
  };

  this.addTimelineEntry('unverified', reason, adminId);

  return this.save();
};

// Method to escalate
hrVerificationSchema.methods.escalate = function(reason) {
  this.isEscalated = true;
  this.escalatedAt = new Date();
  this.escalationReason = reason;

  if (this.status === 'email_sent' || this.status === 'awaiting_response') {
    this.status = 'timeout';
  }

  this.addTimelineEntry('escalated', reason);

  return this.save();
};

// Method to record customer contact
hrVerificationSchema.methods.recordCustomerContact = function(adminId, reason, method = 'email') {
  this.status = 'customer_contacted';
  this.customerContact = {
    contactedAt: new Date(),
    contactReason: reason,
    contactMethod: method,
    contactedBy: adminId
  };

  this.addTimelineEntry('customer_contacted', `Customer contacted: ${reason}`, adminId);

  return this.save();
};

// Method to cancel
hrVerificationSchema.methods.cancel = function(reason, performedBy = null) {
  this.status = 'cancelled';
  this.addTimelineEntry('cancelled', reason, performedBy);

  return this.save();
};

// Static method to find pending verifications
hrVerificationSchema.statics.findPending = function(options = {}) {
  const query = {
    status: { $in: ['pending_send', 'email_sent', 'awaiting_response'] }
  };

  if (options.company) query.company = options.company;
  if (options.isEscalated !== undefined) query.isEscalated = options.isEscalated;

  return this.find(query)
    .populate('order', 'orderNumber totalAmount')
    .populate('customer', 'firstName lastName email')
    .populate('company', 'companyName')
    .sort({ createdAt: -1 });
};

// Static method to find overdue verifications
hrVerificationSchema.statics.findOverdue = function() {
  return this.find({
    status: { $in: ['email_sent', 'awaiting_response'] },
    responseDeadline: { $lt: new Date() },
    isEscalated: false
  })
    .populate('order', 'orderNumber totalAmount')
    .populate('customer', 'firstName lastName email')
    .populate('company', 'companyName');
};

// Static method to find verifications needing reminder
hrVerificationSchema.statics.findNeedingReminder = function(reminderHours = 48) {
  const reminderThreshold = new Date();
  reminderThreshold.setHours(reminderThreshold.getHours() - reminderHours);

  return this.find({
    status: { $in: ['email_sent', 'awaiting_response'] },
    emailSentAt: { $lt: reminderThreshold },
    $expr: { $lt: [{ $size: '$remindersSent' }, '$maxReminders'] }
  })
    .populate('order', 'orderNumber')
    .populate('company', 'companyName hrContacts');
};

// Static method to get verification statistics
hrVerificationSchema.statics.getStatistics = async function(dateRange = null) {
  const matchStage = {};

  if (dateRange) {
    matchStage.createdAt = {
      $gte: dateRange.from,
      $lte: dateRange.to
    };
  }

  const stats = await this.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: null,
        total: { $sum: 1 },
        verified: {
          $sum: { $cond: [{ $eq: ['$status', 'verified'] }, 1, 0] }
        },
        unverified: {
          $sum: { $cond: [{ $eq: ['$status', 'unverified'] }, 1, 0] }
        },
        pending: {
          $sum: {
            $cond: [
              { $in: ['$status', ['pending_send', 'email_sent', 'awaiting_response']] },
              1,
              0
            ]
          }
        },
        escalated: {
          $sum: { $cond: ['$isEscalated', 1, 0] }
        },
        timeout: {
          $sum: { $cond: [{ $eq: ['$status', 'timeout'] }, 1, 0] }
        }
      }
    }
  ]);

  return stats[0] || {
    total: 0,
    verified: 0,
    unverified: 0,
    pending: 0,
    escalated: 0,
    timeout: 0
  };
};

module.exports = mongoose.model('HRVerification', hrVerificationSchema);
