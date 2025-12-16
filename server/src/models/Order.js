const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  productName: {
    type: String,
    required: true
  },
  productPrice: {
    type: Number,
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    min: [1, 'Quantity must be at least 1']
  },
  taxRate: {
    type: Number,
    default: 0
  },
  shippingCost: {
    type: Number,
    default: 0
  },
  merchant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  merchantName: {
    type: String,
    required: true
  }
});

const orderSchema = new mongoose.Schema({
  // Order Identification
  orderNumber: {
    type: String,
    unique: true,
    required: true
  },
  
  // Customer Information
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false // Allow null for guest orders
  },
  customerInfo: {
    firstName: { type: String, required: true },
    middleName: { type: String }, // Optional middle name
    lastName: { type: String, required: true },
    email: { type: String, required: true },
    phoneCountryCode: { type: String, default: '+254' },
    phoneNumber: { type: String },
    dateOfBirth: { type: Date, required: true },
    nationalId: { type: String, required: false } // National ID number
  },
  
  // Shipping Address
  shippingAddress: {
    street: { type: String, required: true },
    city: { type: String, required: true },
    county: { type: String, required: true },
    postalCode: { type: String, required: true },
    country: { type: String, default: 'Kenya' }
  },
  
  // Order Items
  items: [orderItemSchema],
  
  // Order Totals
  subtotal: {
    type: Number,
    required: true,
    min: [0, 'Subtotal cannot be negative']
  },
  totalTax: {
    type: Number,
    default: 0,
    min: [0, 'Total tax cannot be negative']
  },
  totalShipping: {
    type: Number,
    default: 0,
    min: [0, 'Total shipping cannot be negative']
  },
  totalAmount: {
    type: Number,
    required: true,
    min: [0, 'Total amount cannot be negative']
  },
  currency: {
    type: String,
    default: 'KES',
    enum: ['KES']
  },
  
  // Order Status
  status: {
    type: String,
    enum: [
      'pending_payment',
      'underwriting',
      'approved',
      'rejected',
      'hr_verification_pending',  // Awaiting HR verification
      'hr_verified',              // HR verification successful
      'hr_unverified',            // HR verification failed
      'order_complete',           // Order complete, ready for merchant fulfillment
      'payment_processing',
      'paid',
      'processing',
      'shipped',
      'delivered',
      'cancelled',
      'refunded'
    ],
    default: 'pending_payment'
  },

  // HR Verification Reference
  hrVerification: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'HRVerification'
  },
  
  // Payment Information
  payment: {
    method: {
      type: String,
      enum: ['paya_bnpl'],
      default: 'paya_bnpl'
    },
    status: {
      type: String,
      enum: ['pending', 'processing', 'completed', 'failed', 'refunded'],
      default: 'pending'
    },
    transactionId: { type: String },
    paidAt: { type: Date },
    
    // BNPL specific fields
    bnpl: {
      loanAmount: { type: Number },
      loanTerm: { type: Number, default: 30 }, // days
      agreementAccepted: { type: Boolean, default: false },
      agreementAcceptedAt: { type: Date },
      agreementPdfPath: { type: String }, // Path to generated BNPL agreement PDF
      dueDate: { type: Date },
      advanceRate: { type: Number, default: 0.99 }, // 99%
      advanceAmount: { type: Number }, // Amount advanced to merchant
      advancedAt: { type: Date },
      // Paya internal agreement signing (admin confirms DocuSign completed)
      payaAgreementSigned: { type: Boolean, default: false },
      payaAgreementSignedAt: { type: Date },
      payaAgreementSignedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      }
    }
  },
  
  // Fulfillment by Merchant
  fulfillment: [{
    merchant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    items: [orderItemSchema],
    status: {
      type: String,
      enum: ['pending', 'processing', 'shipped', 'delivered'],
      default: 'pending'
    },
    trackingNumber: { type: String },
    shippedAt: { type: Date },
    deliveredAt: { type: Date },
    notes: { type: String }
  }],
  
  // Underwriting Result
  underwritingResult: {
    approved: { type: Boolean },
    reason: { type: String },
    thresholds: {
      minAge: { type: Number },
      minIncome: { type: Number },
      minYearsEmployed: { type: Number },
      minCreditScore: { type: Number },
      maxDefaults: { type: Number },
      maxOtherObligations: { type: Number }
    },
    applicantData: {
      age: { type: Number },
      income: { type: Number },
      yearsEmployed: { type: Number },
      creditScore: { type: Number },
      defaults: { type: Number },
      otherObligations: { type: Number }
    },
    evaluatedAt: { type: Date }
  },
  
  // Order Timeline
  timeline: [{
    status: { type: String, required: true },
    timestamp: { type: Date, default: Date.now },
    note: { type: String },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  }],
  
  // Notes and Communication
  customerNotes: { type: String },
  internalNotes: { type: String },
  
  // Cancellation/Refund
  cancellation: {
    reason: { type: String },
    cancelledAt: { type: Date },
    cancelledBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    refundAmount: { type: Number },
    refundedAt: { type: Date }
  },

  // Order Completion (after HR verification and Paya agreement signed)
  completion: {
    completedAt: { type: Date },
    completedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    customerEmailSent: { type: Boolean, default: false },
    customerEmailSentAt: { type: Date },
    merchantEmailSent: { type: Boolean, default: false },
    merchantEmailSentAt: { type: Date }
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
orderSchema.index({ orderNumber: 1 });
orderSchema.index({ customer: 1 });
orderSchema.index({ 'items.merchant': 1 });
orderSchema.index({ status: 1 });
orderSchema.index({ 'payment.status': 1 });
orderSchema.index({ createdAt: -1 });
orderSchema.index({ 'payment.bnpl.dueDate': 1 });
orderSchema.index({ hrVerification: 1 });

// Virtual for merchants involved in order
orderSchema.virtual('merchants').get(function() {
  if (!this.items || !Array.isArray(this.items)) {
    return [];
  }
  const merchantIds = [...new Set(this.items.filter(item => item?.merchant).map(item => item.merchant.toString()))];
  return merchantIds;
});

// Virtual for order age in days
orderSchema.virtual('ageInDays').get(function() {
  return Math.floor((Date.now() - this.createdAt) / (1000 * 60 * 60 * 24));
});

// Pre-save middleware to generate order number
orderSchema.pre('save', function(next) {
  if (!this.orderNumber) {
    // Generate order number: PY-YYYYMMDD-XXXXX
    const date = new Date();
    const dateStr = date.getFullYear().toString() + 
                   (date.getMonth() + 1).toString().padStart(2, '0') + 
                   date.getDate().toString().padStart(2, '0');
    const random = Math.floor(Math.random() * 100000).toString().padStart(5, '0');
    this.orderNumber = `PY-${dateStr}-${random}`;
  }
  
  // Calculate BNPL advance amount
  if (this.payment.method === 'paya_bnpl' && !this.payment.bnpl.advanceAmount) {
    this.payment.bnpl.loanAmount = this.totalAmount;
    this.payment.bnpl.advanceAmount = this.totalAmount * this.payment.bnpl.advanceRate;
    
    // Set due date
    if (!this.payment.bnpl.dueDate) {
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + this.payment.bnpl.loanTerm);
      this.payment.bnpl.dueDate = dueDate;
    }
  }
  
  next();
});

// Method to add timeline entry
orderSchema.methods.addTimelineEntry = function(status, note, updatedBy) {
  this.timeline.push({
    status,
    note,
    updatedBy,
    timestamp: new Date()
  });
  
  this.status = status;
  return this.save();
};

// Method to update payment status
orderSchema.methods.updatePaymentStatus = function(status, transactionId) {
  this.payment.status = status;
  
  if (transactionId) {
    this.payment.transactionId = transactionId;
  }
  
  if (status === 'completed') {
    this.payment.paidAt = new Date();
    this.payment.bnpl.advancedAt = new Date();
    this.status = 'processing';
    
    this.addTimelineEntry('paid', 'Payment completed via Paya BNPL');
  }
  
  return this.save();
};

// Method to update fulfillment status
orderSchema.methods.updateFulfillmentStatus = function(merchantId, status, trackingNumber, notes) {
  const fulfillment = this.fulfillment.find(f => f.merchant.toString() === merchantId.toString());
  
  if (fulfillment) {
    fulfillment.status = status;
    if (trackingNumber) fulfillment.trackingNumber = trackingNumber;
    if (notes) fulfillment.notes = notes;
    
    if (status === 'shipped') {
      fulfillment.shippedAt = new Date();
    } else if (status === 'delivered') {
      fulfillment.deliveredAt = new Date();
    }
  }
  
  // Update overall order status if all fulfillments are complete
  const allDelivered = this.fulfillment.every(f => f.status === 'delivered');
  if (allDelivered) {
    this.status = 'delivered';
    this.addTimelineEntry('delivered', 'All items delivered');
  }
  
  return this.save();
};

// Static method to find orders by merchant
orderSchema.statics.findByMerchant = function(merchantId, options = {}) {
  const query = { 'items.merchant': merchantId };
  
  if (options.status) query.status = options.status;
  if (options.dateFrom) query.createdAt = { $gte: options.dateFrom };
  if (options.dateTo) query.createdAt = { ...query.createdAt, $lte: options.dateTo };
  
  return this.find(query).sort({ createdAt: -1 });
};

// Static method to get order statistics
orderSchema.statics.getOrderStats = function(merchantId, dateRange) {
  const matchStage = { 'items.merchant': new mongoose.Types.ObjectId(merchantId) };
  
  if (dateRange) {
    matchStage.createdAt = {
      $gte: dateRange.from,
      $lte: dateRange.to
    };
  }
  
  return this.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: null,
        totalOrders: { $sum: 1 },
        totalRevenue: { $sum: '$totalAmount' },
        averageOrderValue: { $avg: '$totalAmount' },
        totalAdvanced: { $sum: '$payment.bnpl.advanceAmount' }
      }
    }
  ]);
};

module.exports = mongoose.model('Order', orderSchema);
