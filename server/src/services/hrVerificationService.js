const HRVerification = require('../models/HRVerification');
const CDLCompany = require('../models/CDLCompany');
const Order = require('../models/Order');
const User = require('../models/User');
const UnderwritingModel = require('../models/UnderwritingModel');
const { sendHRVerificationEmail, sendCustomerFollowUpEmail, sendHRReminderEmail } = require('./emailService');
const { generateBNPLAgreement } = require('./pdfService');
const slackService = require('../../services/slackService');
const path = require('path');

/**
 * Initialize HR verification process for an approved order
 * @param {string} orderId - Order ID
 * @returns {Promise<Object>} Created HRVerification document
 */
const initiateVerification = async (orderId) => {
  // Fetch order with customer populated
  const order = await Order.findById(orderId).populate('customer');

  if (!order) {
    throw new Error('Order not found');
  }

  if (!order.customer) {
    throw new Error('Order has no associated customer');
  }

  // Check if verification already exists
  const existingVerification = await HRVerification.findOne({ order: orderId });
  if (existingVerification) {
    throw new Error('HR verification already exists for this order');
  }

  // Get customer's company
  const customer = await User.findById(order.customer._id || order.customer);
  if (!customer) {
    throw new Error('Customer not found');
  }

  // Find CDL company - either from customer's employmentInfo or by employer name
  let company;

  if (customer.employmentInfo?.company) {
    company = await CDLCompany.findById(customer.employmentInfo.company);
  }

  if (!company && customer.employmentInfo?.employerName) {
    company = await CDLCompany.findByNameOrAlias(customer.employmentInfo.employerName);
  }

  if (!company) {
    throw new Error(`No CDL company found for customer. Employer: ${customer.employmentInfo?.employerName || 'Not specified'}`);
  }

  // Get primary HR contact
  const hrContact = company.primaryHRContact;
  if (!hrContact) {
    throw new Error('No HR contact found for company');
  }

  // Get payslip path
  const payslipPath = customer.financialInfo?.payslip?.path
    ? path.join(__dirname, '../../uploads', customer.financialInfo.payslip.path)
    : null;

  // Generate BNPL agreement PDF
  const underwritingModel = await UnderwritingModel.findOne({ isActive: true });
  const loanDetails = underwritingModel
    ? underwritingModel.calculateLoanDetails(order.totalAmount)
    : null;

  const agreementPdfPath = await generateBNPLAgreement({
    order,
    customer,
    loanDetails
  });

  // Create HR verification record
  const hrVerification = new HRVerification({
    order: order._id,
    customer: customer._id,
    company: company._id,

    hrContactSnapshot: {
      companyName: company.companyName,
      contactName: hrContact.name,
      email: hrContact.email,
      phone: hrContact.phone
    },

    customerSnapshot: {
      firstName: customer.firstName,
      lastName: customer.lastName,
      email: customer.email,
      employerName: customer.employmentInfo?.employerName,
      monthlyIncome: customer.employmentInfo?.monthlyIncome
    },

    status: 'pending_send',
    payslipPath: payslipPath,
    payslipOriginalName: customer.financialInfo?.payslip?.originalName,
    agreementPdfPath: agreementPdfPath,

    timeline: [{
      action: 'created',
      details: 'HR verification initiated',
      timestamp: new Date()
    }]
  });

  await hrVerification.save();

  // Update order with verification reference and status using atomic update
  // to avoid parallel save issues with Mongoose document tracking
  await Order.findByIdAndUpdate(order._id, {
    hrVerification: hrVerification._id,
    status: 'hr_verification_pending',
    $push: {
      timeline: {
        status: 'hr_verification_pending',
        note: 'HR verification process initiated',
        timestamp: new Date()
      }
    }
  });

  // Notify via Slack
  try {
    await slackService.notifyHRVerificationCreated(hrVerification, order, company);
  } catch (err) {
    console.error('Failed to send Slack notification:', err.message);
  }

  return hrVerification;
};

/**
 * Send verification email to HR
 * @param {string} verificationId - HRVerification ID
 * @returns {Promise<Object>} Updated HRVerification document
 */
const sendVerificationEmail = async (verificationId) => {
  const verification = await HRVerification.findById(verificationId)
    .populate('order')
    .populate('company');

  if (!verification) {
    throw new Error('Verification not found');
  }

  if (verification.status !== 'pending_send') {
    throw new Error(`Cannot send email. Current status: ${verification.status}`);
  }

  // Send email
  const emailResult = await sendHRVerificationEmail({
    hrEmail: verification.hrContactSnapshot.email,
    hrName: verification.hrContactSnapshot.contactName,
    companyName: verification.hrContactSnapshot.companyName,
    customerName: `${verification.customerSnapshot.firstName} ${verification.customerSnapshot.lastName}`,
    orderNumber: verification.order.orderNumber,
    payslipPath: verification.payslipPath,
    agreementPath: verification.agreementPdfPath,
    monthlyIncome: verification.customerSnapshot.monthlyIncome
  });

  // Update verification status
  await verification.markEmailSent(
    emailResult.messageId,
    `Employment Verification Request - ${verification.customerSnapshot.firstName} ${verification.customerSnapshot.lastName}`
  );

  // Notify via Slack
  try {
    await slackService.notifyHRVerificationSent(verification);
  } catch (err) {
    console.error('Failed to send Slack notification:', err.message);
  }

  return verification;
};

/**
 * Mark verification as verified (admin action)
 * @param {string} verificationId - HRVerification ID
 * @param {string} adminId - Admin user ID
 * @param {string} notes - Admin notes
 * @returns {Promise<Object>} Updated documents
 */
const markAsVerified = async (verificationId, adminId, notes = null) => {
  const verification = await HRVerification.findById(verificationId)
    .populate('order')
    .populate('company');

  if (!verification) {
    throw new Error('Verification not found');
  }

  // Mark verification as verified
  await verification.markAsVerified(adminId, notes);

  // Update order status using atomic update to avoid parallel save issues
  await Order.findByIdAndUpdate(verification.order._id || verification.order, {
    status: 'hr_verified',
    $push: {
      timeline: {
        status: 'hr_verified',
        note: 'HR verification completed successfully',
        updatedBy: adminId,
        timestamp: new Date()
      }
    }
  });
  const order = await Order.findById(verification.order._id || verification.order);

  // Update company verification stats
  const company = await CDLCompany.findById(verification.company._id || verification.company);
  const responseDays = verification.responseTimeDays;
  await company.updateVerificationStats(true, responseDays);

  // Notify via Slack
  try {
    await slackService.notifyHRVerificationCompleted(verification, true);
  } catch (err) {
    console.error('Failed to send Slack notification:', err.message);
  }

  return { verification, order };
};

/**
 * Mark verification as unverified (admin action)
 * @param {string} verificationId - HRVerification ID
 * @param {string} adminId - Admin user ID
 * @param {string} reason - Rejection reason
 * @returns {Promise<Object>} Updated documents
 */
const markAsUnverified = async (verificationId, adminId, reason) => {
  if (!reason) {
    throw new Error('Reason is required for rejection');
  }

  const verification = await HRVerification.findById(verificationId)
    .populate('order')
    .populate('company');

  if (!verification) {
    throw new Error('Verification not found');
  }

  // Mark verification as unverified
  await verification.markAsUnverified(adminId, reason);

  // Update order status using atomic update to avoid parallel save issues
  await Order.findByIdAndUpdate(verification.order._id || verification.order, {
    status: 'hr_unverified',
    $push: {
      timeline: {
        status: 'hr_unverified',
        note: `HR verification failed: ${reason}`,
        updatedBy: adminId,
        timestamp: new Date()
      }
    }
  });
  const order = await Order.findById(verification.order._id || verification.order);

  // Update company verification stats
  const company = await CDLCompany.findById(verification.company._id || verification.company);
  const responseDays = verification.responseTimeDays;
  await company.updateVerificationStats(false, responseDays);

  // Notify via Slack
  try {
    await slackService.notifyHRVerificationCompleted(verification, false, reason);
  } catch (err) {
    console.error('Failed to send Slack notification:', err.message);
  }

  return { verification, order };
};

/**
 * Contact customer about verification issues (admin action)
 * @param {string} verificationId - HRVerification ID
 * @param {string} adminId - Admin user ID
 * @param {string} reason - Reason for contact
 * @param {string} method - Contact method ('email', 'phone', 'both')
 * @returns {Promise<Object>} Updated verification
 */
const contactCustomer = async (verificationId, adminId, reason, method = 'email') => {
  if (!reason) {
    throw new Error('Reason is required');
  }

  const verification = await HRVerification.findById(verificationId)
    .populate('order')
    .populate('customer');

  if (!verification) {
    throw new Error('Verification not found');
  }

  // Send email to customer if method includes email
  if (method === 'email' || method === 'both') {
    const customer = await User.findById(verification.customer._id || verification.customer);

    await sendCustomerFollowUpEmail({
      customerEmail: customer.email,
      customerName: `${customer.firstName} ${customer.lastName}`,
      orderNumber: verification.order.orderNumber,
      reason
    });
  }

  // Record the customer contact
  await verification.recordCustomerContact(adminId, reason, method);

  return verification;
};

/**
 * Resend verification email to HR
 * @param {string} verificationId - HRVerification ID
 * @returns {Promise<Object>} Updated verification
 */
const resendVerificationEmail = async (verificationId) => {
  const verification = await HRVerification.findById(verificationId)
    .populate('order');

  if (!verification) {
    throw new Error('Verification not found');
  }

  // Send as reminder if already sent before
  if (verification.emailSentAt) {
    const emailResult = await sendHRReminderEmail({
      hrEmail: verification.hrContactSnapshot.email,
      hrName: verification.hrContactSnapshot.contactName,
      customerName: `${verification.customerSnapshot.firstName} ${verification.customerSnapshot.lastName}`,
      orderNumber: verification.order.orderNumber,
      originalSentDate: verification.emailSentAt
    });

    await verification.addReminder(emailResult.messageId);
  } else {
    // Send as initial email
    verification.status = 'pending_send';
    await verification.save();
    await sendVerificationEmail(verificationId);
  }

  return verification;
};

/**
 * Check for overdue verifications and escalate them
 * Called by scheduler
 */
const checkTimeouts = async () => {
  const overdueVerifications = await HRVerification.findOverdue();

  console.log(`Found ${overdueVerifications.length} overdue HR verifications`);

  for (const verification of overdueVerifications) {
    try {
      await verification.escalate('Response deadline exceeded - no HR response received');

      // Notify admin via Slack
      await slackService.notifyHRVerificationTimeout(verification);

      console.log(`Escalated verification ${verification._id} for order ${verification.order?.orderNumber}`);
    } catch (err) {
      console.error(`Failed to escalate verification ${verification._id}:`, err.message);
    }
  }

  return overdueVerifications.length;
};

/**
 * Send reminders to HR for pending verifications
 * Called by scheduler
 */
const sendReminders = async () => {
  const reminderHours = parseInt(process.env.HR_VERIFICATION_REMINDER_HOURS) || 48;
  const verificationsNeedingReminder = await HRVerification.findNeedingReminder(reminderHours);

  console.log(`Found ${verificationsNeedingReminder.length} verifications needing reminder`);

  for (const verification of verificationsNeedingReminder) {
    try {
      await resendVerificationEmail(verification._id);
      console.log(`Sent reminder for verification ${verification._id}`);
    } catch (err) {
      console.error(`Failed to send reminder for ${verification._id}:`, err.message);
    }
  }

  return verificationsNeedingReminder.length;
};

/**
 * Cancel verification (when order is cancelled)
 * @param {string} orderId - Order ID
 * @param {string} reason - Cancellation reason
 * @param {string} performedBy - User ID who cancelled
 */
const cancelVerification = async (orderId, reason, performedBy = null) => {
  const verification = await HRVerification.findOne({ order: orderId });

  if (verification && !['verified', 'unverified', 'cancelled'].includes(verification.status)) {
    await verification.cancel(reason, performedBy);
    return verification;
  }

  return null;
};

/**
 * Get verification statistics
 * @param {Object} dateRange - Optional date range { from, to }
 */
const getStatistics = async (dateRange = null) => {
  return HRVerification.getStatistics(dateRange);
};

/**
 * Get pending verifications count for dashboard
 */
const getPendingCount = async () => {
  return HRVerification.countDocuments({
    status: { $in: ['pending_send', 'email_sent', 'awaiting_response'] }
  });
};

/**
 * Get escalated verifications count for dashboard
 */
const getEscalatedCount = async () => {
  return HRVerification.countDocuments({
    isEscalated: true,
    status: { $nin: ['verified', 'unverified', 'cancelled'] }
  });
};

module.exports = {
  initiateVerification,
  sendVerificationEmail,
  markAsVerified,
  markAsUnverified,
  contactCustomer,
  resendVerificationEmail,
  checkTimeouts,
  sendReminders,
  cancelVerification,
  getStatistics,
  getPendingCount,
  getEscalatedCount
};
