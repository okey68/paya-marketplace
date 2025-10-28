const mongoose = require('mongoose');

const supportTicketSchema = new mongoose.Schema({
  ticketNumber: {
    type: String,
    unique: true
  },
  name: {
    type: String,
    required: [true, 'Name is required']
  },
  email: {
    type: String,
    required: [true, 'Email is required']
  },
  subject: {
    type: String,
    required: [true, 'Subject is required']
  },
  message: {
    type: String,
    required: [true, 'Message is required']
  },
  orderNumber: {
    type: String,
    default: null
  },
  order: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    default: null
  },
  merchant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  status: {
    type: String,
    enum: ['open', 'in_progress', 'resolved', 'closed'],
    default: 'open'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  responses: [{
    respondedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    respondedByName: String,
    message: String,
    timestamp: {
      type: Date,
      default: Date.now
    }
  }]
}, {
  timestamps: true
});

// Generate ticket number before saving
supportTicketSchema.pre('save', async function(next) {
  if (!this.ticketNumber) {
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0].replace(/-/g, '');
    
    const startOfDay = new Date(now);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(now);
    endOfDay.setHours(23, 59, 59, 999);
    
    const count = await mongoose.model('SupportTicket').countDocuments({
      createdAt: {
        $gte: startOfDay,
        $lt: endOfDay
      }
    });
    
    this.ticketNumber = `ST-${dateStr}-${String(count + 1).padStart(5, '0')}`;
  }
  next();
});

module.exports = mongoose.model('SupportTicket', supportTicketSchema);
