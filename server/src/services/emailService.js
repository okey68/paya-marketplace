const axios = require('axios');
const fs = require('fs');
const path = require('path');

// Paya Email API Configuration
const API_KEY = process.env.PAYA_API_KEY || 'pk_live_3e32c86b96e0b15a1737a17b6e3fcfbf5ed910f3fd6e78510d80a33233fd1579';
const API_URL = process.env.PAYA_EMAIL_API_URL || 'https://dev.getpaya.com/api/v1/external/email/send';

/**
 * Send email via Paya external API
 * @param {Object} options - Email options
 * @param {string} options.to - Recipient email address
 * @param {string} options.subject - Email subject
 * @param {string} options.body - Email body (HTML or plain text)
 * @param {string} options.from - Sender email (optional, uses default)
 * @param {Array} options.attachments - Array of attachment objects (optional)
 * @returns {Promise<Object>} API response with messageId
 */
const sendEmail = async (options) => {
  try {
    const { to, subject, body, from, attachments = [] } = options;

    if (!to || !subject || !body) {
      throw new Error('Missing required email fields: to, subject, body');
    }

    console.log(`Sending email to: ${to}, subject: ${subject}`);

    // Prepare attachments as base64 if file paths provided
    const processedAttachments = await Promise.all(
      attachments.map(async (attachment) => {
        if (attachment.path && fs.existsSync(attachment.path)) {
          const fileContent = fs.readFileSync(attachment.path);
          return {
            filename: attachment.filename || path.basename(attachment.path),
            content: fileContent.toString('base64'),
            contentType: attachment.contentType || getMimeType(attachment.path)
          };
        }
        // If already base64 encoded, pass through
        return attachment;
      })
    );

    const payload = {
      to,
      subject,
      body,
      from: from || process.env.HR_VERIFICATION_FROM_EMAIL || 'noreply@paya.co.ke',
      attachments: processedAttachments.length > 0 ? processedAttachments : undefined
    };

    const response = await axios.post(
      API_URL,
      payload,
      {
        headers: {
          'X-API-Key': API_KEY,
          'Content-Type': 'application/json'
        },
        timeout: 30000 // 30 second timeout
      }
    );

    console.log(`Email sent successfully to: ${to}`);

    return {
      success: true,
      messageId: response.data?.messageId || response.data?.id || `msg_${Date.now()}`,
      data: response.data
    };
  } catch (error) {
    console.error('Failed to send email:', error.message);
    if (error.response) {
      console.error('API Error Response:', error.response.data);
    }
    throw new Error(`Failed to send email: ${error.message}`);
  }
};

/**
 * Send HR verification email with payslip and agreement attached
 * @param {Object} options - Email options
 * @param {string} options.hrEmail - HR email address
 * @param {string} options.hrName - HR contact name
 * @param {string} options.companyName - Company name
 * @param {string} options.customerName - Customer full name
 * @param {string} options.orderNumber - Order number
 * @param {string} options.payslipPath - Path to payslip file
 * @param {string} options.agreementPath - Path to BNPL agreement PDF
 * @param {number} options.monthlyIncome - Customer's declared monthly income
 * @returns {Promise<Object>} API response
 */
const sendHRVerificationEmail = async (options) => {
  const {
    hrEmail,
    hrName,
    companyName,
    customerName,
    orderNumber,
    payslipPath,
    agreementPath,
    monthlyIncome
  } = options;

  const subject = `Employment Verification Request - ${customerName} - Order #${orderNumber}`;

  const body = generateHRVerificationEmailBody({
    hrName,
    companyName,
    customerName,
    orderNumber,
    monthlyIncome
  });

  const attachments = [];

  if (payslipPath && fs.existsSync(payslipPath)) {
    attachments.push({
      path: payslipPath,
      filename: `Payslip_${customerName.replace(/\s+/g, '_')}.pdf`
    });
  }

  if (agreementPath && fs.existsSync(agreementPath)) {
    attachments.push({
      path: agreementPath,
      filename: `BNPL_Agreement_${orderNumber}.pdf`
    });
  }

  return sendEmail({
    to: hrEmail,
    subject,
    body,
    attachments
  });
};

/**
 * Generate HR verification email body
 */
const generateHRVerificationEmailBody = (options) => {
  const { hrName, companyName, customerName, orderNumber, monthlyIncome } = options;

  const greeting = hrName ? `Dear ${hrName},` : 'Dear HR Department,';
  const formattedIncome = monthlyIncome
    ? `KES ${monthlyIncome.toLocaleString()}`
    : 'as shown on the attached payslip';

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background-color: #1a365d; color: white; padding: 20px; text-align: center; }
    .content { padding: 20px; background-color: #f8f9fa; }
    .highlight { background-color: #e7f3ff; padding: 15px; border-left: 4px solid #1a365d; margin: 15px 0; }
    .response-box { background-color: #fff; border: 2px solid #1a365d; padding: 15px; margin: 20px 0; }
    .footer { font-size: 12px; color: #666; padding: 20px; text-align: center; }
    ul { margin: 10px 0; padding-left: 20px; }
    li { margin: 5px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h2>Paya - Employment Verification Request</h2>
    </div>
    <div class="content">
      <p>${greeting}</p>

      <p>We are requesting employment verification for <strong>${customerName}</strong> who has applied
      for a Buy Now Pay Later (BNPL) agreement with Paya.</p>

      <div class="highlight">
        <strong>Reference Number:</strong> ${orderNumber}<br>
        <strong>Employee Name:</strong> ${customerName}<br>
        <strong>Company:</strong> ${companyName}<br>
        <strong>Declared Monthly Income:</strong> ${formattedIncome}
      </div>

      <p><strong>Attached Documents:</strong></p>
      <ul>
        <li>Customer's Payslip</li>
        <li>BNPL Agreement (for your reference)</li>
      </ul>

      <div class="response-box">
        <p><strong>Please reply to this email with one of the following:</strong></p>
        <ul>
          <li><strong>VERIFIED</strong> - if the attached payslip is authentic and the employee details are correct</li>
          <li><strong>NOT VERIFIED</strong> - if there are any discrepancies or concerns</li>
        </ul>

        <p><strong>Questions to verify:</strong></p>
        <ol>
          <li>Is ${customerName} currently employed at ${companyName}?</li>
          <li>Is the salary shown on the attached payslip accurate?</li>
        </ol>
      </div>

      <p>If you have any questions or require additional information, please reply to this email
      or contact us at <a href="mailto:support@paya.co.ke">support@paya.co.ke</a>.</p>

      <p>Thank you for your prompt assistance.</p>

      <p>Best regards,<br>
      <strong>Paya Verification Team</strong></p>
    </div>
    <div class="footer">
      <p>This is an automated message from Paya. Please do not share this email or its attachments
      with unauthorized parties.</p>
      <p>&copy; ${new Date().getFullYear()} Paya. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
  `.trim();
};

/**
 * Send customer follow-up email when verification fails
 * @param {Object} options - Email options
 */
const sendCustomerFollowUpEmail = async (options) => {
  const { customerEmail, customerName, orderNumber, reason } = options;

  const subject = `Action Required: Order #${orderNumber} - Additional Information Needed`;

  const body = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background-color: #1a365d; color: white; padding: 20px; text-align: center; }
    .content { padding: 20px; background-color: #f8f9fa; }
    .alert { background-color: #fff3cd; border: 1px solid #ffc107; padding: 15px; margin: 15px 0; }
    .footer { font-size: 12px; color: #666; padding: 20px; text-align: center; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h2>Paya - Action Required</h2>
    </div>
    <div class="content">
      <p>Dear ${customerName},</p>

      <p>Thank you for your recent order with Paya (Order #${orderNumber}).</p>

      <div class="alert">
        <strong>We need additional information to complete your order verification:</strong>
        <p>${reason}</p>
      </div>

      <p>Please contact us at <a href="mailto:support@paya.co.ke">support@paya.co.ke</a> or reply to this email
      with the requested information.</p>

      <p>We apologize for any inconvenience and appreciate your cooperation.</p>

      <p>Best regards,<br>
      <strong>Paya Support Team</strong></p>
    </div>
    <div class="footer">
      <p>&copy; ${new Date().getFullYear()} Paya. All rights reserved.</p>
    </div>
  </div>
</body>
  `.trim();

  return sendEmail({
    to: customerEmail,
    subject,
    body
  });
};

/**
 * Send HR reminder email
 * @param {Object} options - Email options
 */
const sendHRReminderEmail = async (options) => {
  const { hrEmail, hrName, customerName, orderNumber, originalSentDate } = options;

  const subject = `Reminder: Employment Verification Request - ${customerName} - Order #${orderNumber}`;

  const daysSince = Math.floor((Date.now() - new Date(originalSentDate)) / (1000 * 60 * 60 * 24));
  const greeting = hrName ? `Dear ${hrName},` : 'Dear HR Department,';

  const body = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background-color: #1a365d; color: white; padding: 20px; text-align: center; }
    .content { padding: 20px; background-color: #f8f9fa; }
    .reminder { background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 15px 0; }
    .footer { font-size: 12px; color: #666; padding: 20px; text-align: center; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h2>Paya - Verification Reminder</h2>
    </div>
    <div class="content">
      <p>${greeting}</p>

      <div class="reminder">
        <strong>Reminder:</strong> This is a follow-up to our employment verification request sent ${daysSince} day(s) ago.
      </div>

      <p>We are still awaiting your response regarding the employment verification for:</p>
      <ul>
        <li><strong>Employee:</strong> ${customerName}</li>
        <li><strong>Reference:</strong> Order #${orderNumber}</li>
      </ul>

      <p>Please reply with <strong>VERIFIED</strong> or <strong>NOT VERIFIED</strong> at your earliest convenience.</p>

      <p>If you did not receive the original email or need the documents resent, please reply to this email.</p>

      <p>Thank you for your assistance.</p>

      <p>Best regards,<br>
      <strong>Paya Verification Team</strong></p>
    </div>
    <div class="footer">
      <p>&copy; ${new Date().getFullYear()} Paya. All rights reserved.</p>
    </div>
  </div>
</body>
  `.trim();

  return sendEmail({
    to: hrEmail,
    subject,
    body
  });
};

/**
 * Send order completion email to customer (Shopify-style)
 * @param {Object} options - Email options
 * @param {string} options.customerEmail - Customer email address
 * @param {string} options.customerName - Customer full name
 * @param {string} options.merchantName - Primary merchant name
 * @param {string} options.orderNumber - Order number
 * @param {Array} options.orderItems - Array of order items
 * @param {Object} options.shippingAddress - Shipping address object
 * @param {number} options.subtotal - Order subtotal
 * @param {number} options.totalAmount - Total amount
 * @param {Date} options.estimatedDeliveryDate - Estimated delivery date
 * @returns {Promise<Object>} API response
 */
const sendOrderCompletionCustomerEmail = async (options) => {
  const {
    customerEmail,
    customerName,
    merchantName,
    orderNumber,
    orderItems,
    shippingAddress,
    subtotal,
    totalAmount,
    estimatedDeliveryDate
  } = options;

  const subject = `Order Confirmed - #${orderNumber}`;

  // Format currency
  const formatCurrency = (amount) => {
    return `KSh${(amount || 0).toLocaleString('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  // Format delivery date
  const deliveryDateStr = estimatedDeliveryDate
    ? new Date(estimatedDeliveryDate).toLocaleDateString('en-US', {
        weekday: 'long',
        day: 'numeric',
        month: 'short'
      })
    : 'To be confirmed';

  // Generate items HTML
  const itemsHtml = orderItems.map(item => `
    <tr>
      <td style="padding: 15px 0; border-bottom: 1px solid #e5e5e5;">
        <div style="display: flex; align-items: center;">
          <div style="width: 60px; height: 60px; background-color: #f5f5f5; border-radius: 8px; margin-right: 15px; display: flex; align-items: center; justify-content: center;">
            <span style="font-size: 24px;">📦</span>
          </div>
          <div>
            <div style="font-weight: 500; color: #333;">${item.productName}</div>
            <div style="color: #666; font-size: 14px;">× ${item.quantity}</div>
          </div>
        </div>
      </td>
      <td style="padding: 15px 0; border-bottom: 1px solid #e5e5e5; text-align: right; font-weight: 600;">
        ${formatCurrency(item.productPrice * item.quantity)}
      </td>
    </tr>
  `).join('');

  // Format billing address
  const billingAddressHtml = `
    ${customerName}<br>
    ${shippingAddress.street}<br>
    ${shippingAddress.city}, ${shippingAddress.county}<br>
    ${shippingAddress.postalCode}<br>
    ${shippingAddress.country || 'Kenya'}
  `;

  const body = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f4f4f4; }
    .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; }
    .header { padding: 20px 30px; border-bottom: 1px solid #e5e5e5; display: flex; justify-content: space-between; align-items: center; }
    .merchant-name { font-size: 18px; font-weight: 600; color: #333; }
    .order-number { font-size: 14px; color: #666; }
    .thank-you { padding: 40px 30px; text-align: center; }
    .thank-you h1 { margin: 0 0 10px; font-size: 24px; font-weight: 500; }
    .thank-you p { margin: 0 0 20px; color: #666; }
    .delivery-info { background-color: #f8f9fa; padding: 15px 30px; margin: 0 30px 30px; border-radius: 8px; }
    .btn { display: inline-block; background-color: #1a365d; color: #ffffff; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 500; margin-right: 15px; }
    .link { color: #1a365d; text-decoration: underline; }
    .order-summary { padding: 0 30px 30px; }
    .order-summary h3 { font-size: 16px; font-weight: 600; margin: 0 0 15px; color: #333; }
    .totals { padding: 20px 30px; background-color: #f8f9fa; }
    .total-row { display: flex; justify-content: space-between; padding: 8px 0; }
    .total-final { font-weight: bold; font-size: 18px; border-top: 2px solid #333; padding-top: 15px; margin-top: 10px; }
    .customer-info { padding: 30px; background-color: #f8f9fa; margin: 30px; border-radius: 8px; }
    .customer-info h4 { margin: 0 0 15px; font-size: 14px; font-weight: 600; color: #333; }
    .customer-info p { margin: 0 0 15px; color: #555; font-size: 14px; }
    .payment-method { background-color: #e8f5e9; padding: 10px 15px; border-radius: 6px; display: inline-block; color: #2e7d32; font-weight: 500; }
    .footer { padding: 30px; text-align: center; color: #666; font-size: 12px; border-top: 1px solid #e5e5e5; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="merchant-name">${merchantName}</div>
      <div class="order-number">ORDER #${orderNumber}</div>
    </div>

    <div class="thank-you">
      <h1>Thank you for your purchase!</h1>
      <p>You'll receive an email when your order is ready for pickup or shipped.</p>
      <p><strong>Estimated delivery: ${deliveryDateStr}</strong></p>
    </div>

    <div class="order-summary">
      <h3>Order summary</h3>
      <table style="width: 100%; border-collapse: collapse;">
        ${itemsHtml}
      </table>
    </div>

    <div class="totals">
      <div class="total-row">
        <span>Subtotal</span>
        <span>${formatCurrency(subtotal)}</span>
      </div>
      <div class="total-row">
        <span>Shipping</span>
        <span>KSh0.00</span>
      </div>
      <div class="total-row">
        <span>Taxes</span>
        <span>KSh0.00</span>
      </div>
      <div class="total-row total-final">
        <span>Total</span>
        <span>${formatCurrency(totalAmount)}</span>
      </div>
      <div class="total-row" style="color: #666;">
        <span>Total paid today</span>
        <span>KSh0.00</span>
      </div>
    </div>

    <div class="customer-info">
      <h4>Customer information</h4>
      <p><strong>Billing address</strong><br>${billingAddressHtml}</p>
      <p><strong>Payment</strong><br><span class="payment-method">Lipa pole pole (BNPL)</span></p>
    </div>

    <div class="footer">
      <p>If you have any questions, reply to this email or contact us at <a href="mailto:support@paya.co.ke">support@paya.co.ke</a></p>
      <p>&copy; ${new Date().getFullYear()} Paya. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
  `.trim();

  return sendEmail({
    to: customerEmail,
    subject,
    body
  });
};

/**
 * Send order notification email to merchant
 * @param {Object} options - Email options
 * @param {string} options.merchantEmail - Merchant email address
 * @param {string} options.merchantName - Merchant business name
 * @param {string} options.orderNumber - Order number
 * @param {string} options.customerName - Customer full name
 * @param {Array} options.orderItems - Array of merchant's order items
 * @param {Object} options.shippingAddress - Shipping address object
 * @param {number} options.totalAmount - Total amount for this merchant
 * @returns {Promise<Object>} API response
 */
const sendOrderCompletionMerchantEmail = async (options) => {
  const {
    merchantEmail,
    merchantName,
    orderNumber,
    customerName,
    orderItems,
    shippingAddress,
    totalAmount
  } = options;

  const subject = `New Order Ready for Fulfillment - #${orderNumber}`;

  // Format currency
  const formatCurrency = (amount) => {
    return `KSh${(amount || 0).toLocaleString('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  // Generate items HTML
  const itemsHtml = orderItems.map(item => `
    <tr>
      <td style="padding: 12px; border-bottom: 1px solid #e5e5e5;">${item.productName}</td>
      <td style="padding: 12px; border-bottom: 1px solid #e5e5e5; text-align: center;">${item.quantity}</td>
      <td style="padding: 12px; border-bottom: 1px solid #e5e5e5; text-align: right;">${formatCurrency(item.productPrice)}</td>
      <td style="padding: 12px; border-bottom: 1px solid #e5e5e5; text-align: right; font-weight: 600;">${formatCurrency(item.productPrice * item.quantity)}</td>
    </tr>
  `).join('');

  // Format shipping address
  const shippingAddressHtml = `
    ${customerName}<br>
    ${shippingAddress.street}<br>
    ${shippingAddress.city}, ${shippingAddress.county}<br>
    ${shippingAddress.postalCode}<br>
    ${shippingAddress.country || 'Kenya'}
  `;

  const body = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f4f4f4; }
    .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; }
    .header { background-color: #1a365d; color: white; padding: 25px 30px; }
    .header h2 { margin: 0; font-size: 20px; }
    .content { padding: 30px; }
    .alert-box { background-color: #e8f5e9; border-left: 4px solid #4caf50; padding: 15px 20px; margin-bottom: 25px; }
    .alert-box h3 { margin: 0 0 5px; color: #2e7d32; }
    .section { margin-bottom: 25px; }
    .section h4 { margin: 0 0 10px; color: #1a365d; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px; }
    .info-box { background-color: #f8f9fa; padding: 15px; border-radius: 6px; }
    table { width: 100%; border-collapse: collapse; }
    th { background-color: #f8f9fa; padding: 12px; text-align: left; font-weight: 600; border-bottom: 2px solid #e5e5e5; }
    .total-row { background-color: #f8f9fa; font-weight: bold; }
    .footer { padding: 20px 30px; text-align: center; color: #666; font-size: 12px; border-top: 1px solid #e5e5e5; }
    .btn { display: inline-block; background-color: #4caf50; color: #ffffff; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 500; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h2>📦 New Order Ready for Fulfillment</h2>
    </div>

    <div class="content">
      <div class="alert-box">
        <h3>Action Required</h3>
        <p style="margin: 0;">Please prepare and ship the following order.</p>
      </div>

      <div class="section">
        <h4>Order Details</h4>
        <div class="info-box">
          <p style="margin: 5px 0;"><strong>Order Number:</strong> ${orderNumber}</p>
          <p style="margin: 5px 0;"><strong>Customer:</strong> ${customerName}</p>
          <p style="margin: 5px 0;"><strong>Date:</strong> ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
        </div>
      </div>

      <div class="section">
        <h4>Items to Fulfill</h4>
        <table>
          <thead>
            <tr>
              <th>Product</th>
              <th style="text-align: center;">Qty</th>
              <th style="text-align: right;">Unit Price</th>
              <th style="text-align: right;">Total</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHtml}
            <tr class="total-row">
              <td colspan="3" style="padding: 12px; text-align: right;">Order Total:</td>
              <td style="padding: 12px; text-align: right;">${formatCurrency(totalAmount)}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="section">
        <h4>Shipping Address</h4>
        <div class="info-box">
          ${shippingAddressHtml}
        </div>
      </div>

      <p style="text-align: center; margin-top: 30px;">
        <a href="https://merchant.paya.co.ke/orders" class="btn">View Order in Dashboard</a>
      </p>
    </div>

    <div class="footer">
      <p>If you have any questions, contact us at <a href="mailto:merchant-support@paya.co.ke">merchant-support@paya.co.ke</a></p>
      <p>&copy; ${new Date().getFullYear()} Paya. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
  `.trim();

  return sendEmail({
    to: merchantEmail,
    subject,
    body
  });
};

/**
 * Get MIME type from file extension
 */
const getMimeType = (filePath) => {
  const ext = path.extname(filePath).toLowerCase();
  const mimeTypes = {
    '.pdf': 'application/pdf',
    '.doc': 'application/msword',
    '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.gif': 'image/gif'
  };
  return mimeTypes[ext] || 'application/octet-stream';
};

module.exports = {
  sendEmail,
  sendHRVerificationEmail,
  sendCustomerFollowUpEmail,
  sendHRReminderEmail,
  sendOrderCompletionCustomerEmail,
  sendOrderCompletionMerchantEmail
};
