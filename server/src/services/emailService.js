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
  sendHRReminderEmail
};
