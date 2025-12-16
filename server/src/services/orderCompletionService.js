const Order = require('../models/Order');
const User = require('../models/User');
const { sendOrderCompletionCustomerEmail, sendOrderCompletionMerchantEmail } = require('./emailService');
const slackService = require('../../services/slackService');

/**
 * Mark Paya agreement as signed by admin
 * @param {string} orderId - Order ID
 * @param {string} adminId - Admin user ID
 * @returns {Promise<Object>} Updated order
 */
const markPayaAgreementSigned = async (orderId, adminId) => {
  const order = await Order.findById(orderId);

  if (!order) {
    throw new Error('Order not found');
  }

  if (order.payment?.bnpl?.payaAgreementSigned) {
    throw new Error('Agreement is already marked as signed');
  }

  // Update agreement signed status
  if (!order.payment) order.payment = {};
  if (!order.payment.bnpl) order.payment.bnpl = {};

  order.payment.bnpl.payaAgreementSigned = true;
  order.payment.bnpl.payaAgreementSignedAt = new Date();
  order.payment.bnpl.payaAgreementSignedBy = adminId;

  // Add timeline entry
  order.timeline.push({
    status: order.status,
    note: 'Paya BNPL agreement marked as signed by admin',
    updatedBy: adminId,
    timestamp: new Date()
  });

  await order.save();

  console.log(`Agreement marked as signed for order ${order.orderNumber} by admin ${adminId}`);

  return order;
};

/**
 * Complete an order after HR verification and Paya agreement signing
 * Sends notification emails to customer and merchant(s)
 * @param {string} orderId - Order ID
 * @param {string} adminId - Admin user ID completing the order
 * @returns {Promise<Object>} Updated order
 */
const completeOrder = async (orderId, adminId) => {
  const order = await Order.findById(orderId)
    .populate('customer')
    .populate('items.merchant')
    .populate('hrVerification');

  if (!order) {
    throw new Error('Order not found');
  }

  // Validation: Order must be HR verified
  if (order.status !== 'hr_verified') {
    throw new Error(`Order must be HR verified before completion. Current status: ${order.status}`);
  }

  // Validation: Agreement must be signed
  if (!order.payment?.bnpl?.payaAgreementSigned) {
    throw new Error('Paya agreement must be signed before completing the order');
  }

  // Initialize completion object
  if (!order.completion) {
    order.completion = {};
  }

  // Update order status
  order.status = 'order_complete';
  order.completion.completedAt = new Date();
  order.completion.completedBy = adminId;

  // Add timeline entry
  order.timeline.push({
    status: 'order_complete',
    note: 'Order completed. Customer and merchant notifications sent.',
    updatedBy: adminId,
    timestamp: new Date()
  });

  // Get customer name (with middle name support)
  const customerName = order.customerInfo.middleName
    ? `${order.customerInfo.firstName} ${order.customerInfo.middleName} ${order.customerInfo.lastName}`
    : `${order.customerInfo.firstName} ${order.customerInfo.lastName}`;

  // Calculate estimated delivery (7 days from now)
  const estimatedDelivery = new Date();
  estimatedDelivery.setDate(estimatedDelivery.getDate() + 7);

  // Get primary merchant name
  const primaryMerchantName = order.items[0]?.merchantName || 'Paya Marketplace';

  // Send customer email (Shopify-style)
  try {
    await sendOrderCompletionCustomerEmail({
      customerEmail: order.customerInfo.email,
      customerName,
      merchantName: primaryMerchantName,
      orderNumber: order.orderNumber,
      orderItems: order.items,
      shippingAddress: order.shippingAddress,
      subtotal: order.subtotal,
      totalAmount: order.totalAmount,
      estimatedDeliveryDate: estimatedDelivery
    });

    order.completion.customerEmailSent = true;
    order.completion.customerEmailSentAt = new Date();
    console.log(`Customer email sent to ${order.customerInfo.email} for order ${order.orderNumber}`);
  } catch (emailError) {
    console.error('Failed to send customer completion email:', emailError.message);
    // Continue - email failure shouldn't block order completion
  }

  // Send merchant emails (one per unique merchant)
  const merchantIds = [...new Set(order.items.map(item =>
    item.merchant?._id?.toString() || item.merchant?.toString()
  ).filter(Boolean))];

  let merchantEmailsSent = 0;

  for (const merchantId of merchantIds) {
    try {
      const merchant = await User.findById(merchantId);
      if (!merchant) {
        console.log(`Merchant ${merchantId} not found, skipping email`);
        continue;
      }

      // Get items for this merchant
      const merchantItems = order.items.filter(item => {
        const itemMerchantId = item.merchant?._id?.toString() || item.merchant?.toString();
        return itemMerchantId === merchantId;
      });

      // Calculate merchant's total
      const merchantTotal = merchantItems.reduce(
        (sum, item) => sum + (item.productPrice * item.quantity),
        0
      );

      const merchantName = merchant.businessInfo?.businessName ||
        `${merchant.firstName} ${merchant.lastName}`;

      await sendOrderCompletionMerchantEmail({
        merchantEmail: merchant.email,
        merchantName,
        orderNumber: order.orderNumber,
        customerName,
        orderItems: merchantItems,
        shippingAddress: order.shippingAddress,
        totalAmount: merchantTotal
      });

      merchantEmailsSent++;
      console.log(`Merchant email sent to ${merchant.email} for order ${order.orderNumber}`);
    } catch (emailError) {
      console.error(`Failed to send merchant email to ${merchantId}:`, emailError.message);
      // Continue with other merchants
    }
  }

  if (merchantEmailsSent > 0) {
    order.completion.merchantEmailSent = true;
    order.completion.merchantEmailSentAt = new Date();
  }

  await order.save();

  // Send Slack notification
  try {
    await slackService.sendNotification({
      text: `✅ Order Completed: #${order.orderNumber}`,
      blocks: [
        {
          type: 'header',
          text: {
            type: 'plain_text',
            text: '✅ Order Completed',
            emoji: true
          }
        },
        {
          type: 'section',
          fields: [
            {
              type: 'mrkdwn',
              text: `*Order:*\n#${order.orderNumber}`
            },
            {
              type: 'mrkdwn',
              text: `*Customer:*\n${customerName}`
            },
            {
              type: 'mrkdwn',
              text: `*Total:*\nKES ${order.totalAmount.toLocaleString()}`
            },
            {
              type: 'mrkdwn',
              text: `*Merchants Notified:*\n${merchantEmailsSent}`
            }
          ]
        },
        {
          type: 'context',
          elements: [
            {
              type: 'mrkdwn',
              text: `Customer email: ${order.completion.customerEmailSent ? '✓ Sent' : '✗ Failed'} | Merchant emails: ${merchantEmailsSent > 0 ? '✓ Sent' : '✗ Failed'}`
            }
          ]
        }
      ]
    });
  } catch (slackError) {
    console.error('Failed to send Slack notification:', slackError.message);
  }

  console.log(`Order ${order.orderNumber} completed by admin ${adminId}`);

  return order;
};

/**
 * Get order completion status
 * @param {string} orderId - Order ID
 * @returns {Promise<Object>} Completion status details
 */
const getCompletionStatus = async (orderId) => {
  const order = await Order.findById(orderId)
    .select('status payment.bnpl.payaAgreementSigned payment.bnpl.payaAgreementSignedAt completion')
    .lean();

  if (!order) {
    throw new Error('Order not found');
  }

  return {
    orderStatus: order.status,
    isHRVerified: order.status === 'hr_verified' || order.status === 'order_complete',
    isAgreementSigned: order.payment?.bnpl?.payaAgreementSigned || false,
    agreementSignedAt: order.payment?.bnpl?.payaAgreementSignedAt,
    isCompleted: order.status === 'order_complete',
    completion: order.completion,
    canComplete: order.status === 'hr_verified' && order.payment?.bnpl?.payaAgreementSigned
  };
};

module.exports = {
  markPayaAgreementSigned,
  completeOrder,
  getCompletionStatus
};
