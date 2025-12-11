const axios = require('axios');

class SlackService {
  constructor() {
    this.webhookUrl = process.env.SLACK_WEBHOOK_URL;
    this.adminPortalUrl = process.env.ADMIN_PORTAL_URL || 'http://localhost:3001';
    this.enabled = !!this.webhookUrl;
    
    // Log initialization status
    console.log('🔔 Slack Service Initialized:', {
      enabled: this.enabled,
      hasWebhookUrl: !!this.webhookUrl,
      webhookUrlLength: this.webhookUrl ? this.webhookUrl.length : 0,
      adminPortalUrl: this.adminPortalUrl
    });
  }

  // Helper to safely format customer name
  formatCustomerName(customerInfo) {
    if (!customerInfo) return 'N/A';
    return [customerInfo.firstName, customerInfo.lastName]
      .filter(Boolean)
      .join(' ') || 'N/A';
  }

  async sendNotification(message) {
    console.log('📤 Attempting to send Slack notification...', {
      enabled: this.enabled,
      messageType: message.text
    });

    if (!this.enabled) {
      console.log('⚠️ Slack notifications disabled - no webhook URL configured');
      return;
    }

    try {
      const response = await axios.post(this.webhookUrl, message);
      console.log('✅ Slack notification sent successfully:', {
        status: response.status,
        messageType: message.text
      });
    } catch (error) {
      console.error('❌ Failed to send Slack notification:', {
        error: error.message,
        response: error.response?.data,
        status: error.response?.status,
        messagePreview: JSON.stringify(message).substring(0, 500)
      });
    }
  }

  // New Order Notification
  async notifyNewOrder(order) {
    console.log('📋 Order data for Slack notification:', {
      orderId: order._id,
      orderNumber: order.orderNumber,
      customerInfo: order.customerInfo,
      hasCustomerInfo: !!order.customerInfo,
      firstName: order.customerInfo?.firstName,
      lastName: order.customerInfo?.lastName
    });
    
    const baseUrl = this.adminPortalUrl.replace(/\/$/, ''); // Remove trailing slash
    const orderUrl = `${baseUrl}/orders/${order._id}`;
    const customerName = [order.customerInfo?.firstName, order.customerInfo?.lastName]
      .filter(Boolean)
      .join(' ') || 'N/A';
    
    console.log('🔗 Generated order URL:', orderUrl);
    
    const message = {
      text: `🛍️ New Order: ${order.orderNumber} - ${customerName} - Ksh ${order.totalAmount?.toLocaleString()}`,
      blocks: [
        {
          type: 'header',
          text: {
            type: 'plain_text',
            text: '🛍️ New Order Received',
            emoji: true
          }
        },
        {
          type: 'section',
          fields: [
            {
              type: 'mrkdwn',
              text: `*Order Number:*\n${order.orderNumber || 'N/A'}`
            },
            {
              type: 'mrkdwn',
              text: `*Total Amount:*\nKsh ${order.totalAmount?.toLocaleString() || '0'}`
            },
            {
              type: 'mrkdwn',
              text: `*Customer:*\n${customerName}`
            },
            {
              type: 'mrkdwn',
              text: `*Payment Method:*\n${order.payment?.method === 'paya_bnpl' ? 'BNPL' : order.payment?.method || 'N/A'}`
            }
          ]
        },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `*Items:* ${order.items?.length || 0} item(s)\n<${orderUrl}|View Order Details>`
          }
        }
      ]
    };

    await this.sendNotification(message);
  }

  // BNPL Application Notification
  async notifyBNPLApplication(order) {
    const orderUrl = `${this.adminPortalUrl}/orders/${order._id}`;
    
    const message = {
      text: '💳 New BNPL Application',
      blocks: [
        {
          type: 'header',
          text: {
            type: 'plain_text',
            text: '💳 New BNPL Application',
            emoji: true
          }
        },
        {
          type: 'section',
          fields: [
            {
              type: 'mrkdwn',
              text: `*Order Number:*\n${order.orderNumber}`
            },
            {
              type: 'mrkdwn',
              text: `*Loan Amount:*\nKsh ${order.payment?.bnpl?.loanAmount?.toLocaleString() || 'N/A'}`
            },
            {
              type: 'mrkdwn',
              text: `*Customer:*\n${this.formatCustomerName(order.customerInfo)}`
            },
            {
              type: 'mrkdwn',
              text: `*Status:*\n${order.status}`
            }
          ]
        },
        {
          type: 'actions',
          elements: [
            {
              type: 'button',
              text: {
                type: 'plain_text',
                text: 'Review Application',
                emoji: true
              },
              url: orderUrl,
              style: 'primary'
            }
          ]
        }
      ]
    };

    await this.sendNotification(message);
  }

  // Order Status Change Notification
  async notifyOrderStatusChange(order, oldStatus, newStatus) {
    const orderUrl = `${this.adminPortalUrl}/orders/${order._id}`;
    
    const statusEmoji = {
      pending: '⏳',
      underwriting: '🔍',
      approved: '✅',
      paid: '💰',
      processing: '📦',
      shipped: '🚚',
      delivered: '✅',
      cancelled: '❌',
      refunded: '↩️'
    };

    const message = {
      text: `${statusEmoji[newStatus] || '📋'} Order Status Updated`,
      blocks: [
        {
          type: 'header',
          text: {
            type: 'plain_text',
            text: `${statusEmoji[newStatus] || '📋'} Order Status Updated`,
            emoji: true
          }
        },
        {
          type: 'section',
          fields: [
            {
              type: 'mrkdwn',
              text: `*Order Number:*\n${order.orderNumber}`
            },
            {
              type: 'mrkdwn',
              text: `*Status Change:*\n${oldStatus} → ${newStatus}`
            },
            {
              type: 'mrkdwn',
              text: `*Customer:*\n${this.formatCustomerName(order.customerInfo)}`
            },
            {
              type: 'mrkdwn',
              text: `*Total:*\nKsh ${order.totalAmount?.toLocaleString() || 'N/A'}`
            }
          ]
        },
        {
          type: 'actions',
          elements: [
            {
              type: 'button',
              text: {
                type: 'plain_text',
                text: 'View Order',
                emoji: true
              },
              url: orderUrl,
              style: 'primary'
            }
          ]
        }
      ]
    };

    await this.sendNotification(message);
  }

  // Support Ticket Notification
  async notifySupportTicket(ticket) {
    const ticketUrl = `${this.adminPortalUrl}/support/${ticket._id}`;
    
    const message = {
      text: '🎫 New Support Ticket',
      blocks: [
        {
          type: 'header',
          text: {
            type: 'plain_text',
            text: '🎫 New Support Ticket',
            emoji: true
          }
        },
        {
          type: 'section',
          fields: [
            {
              type: 'mrkdwn',
              text: `*Ticket Number:*\n${ticket.ticketNumber}`
            },
            {
              type: 'mrkdwn',
              text: `*Priority:*\n${ticket.priority || 'Normal'}`
            },
            {
              type: 'mrkdwn',
              text: `*Customer:*\n${ticket.name}`
            },
            {
              type: 'mrkdwn',
              text: `*Email:*\n${ticket.email}`
            }
          ]
        },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `*Subject:*\n${ticket.subject}`
          }
        },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `*Message:*\n${ticket.message.substring(0, 200)}${ticket.message.length > 200 ? '...' : ''}`
          }
        },
        {
          type: 'actions',
          elements: [
            {
              type: 'button',
              text: {
                type: 'plain_text',
                text: 'View Ticket',
                emoji: true
              },
              url: ticketUrl,
              style: 'primary'
            }
          ]
        }
      ]
    };

    if (ticket.orderNumber) {
      message.blocks[1].fields.push({
        type: 'mrkdwn',
        text: `*Order Number:*\n${ticket.orderNumber}`
      });
    }

    await this.sendNotification(message);
  }

  // Merchant Application Notification
  async notifyMerchantApplication(merchant) {
    const merchantUrl = `${this.adminPortalUrl}/merchants/${merchant._id}`;
    
    const message = {
      text: '🏪 New Merchant Application',
      blocks: [
        {
          type: 'header',
          text: {
            type: 'plain_text',
            text: '🏪 New Merchant Application',
            emoji: true
          }
        },
        {
          type: 'section',
          fields: [
            {
              type: 'mrkdwn',
              text: `*Business Name:*\n${merchant.businessInfo?.businessName || 'N/A'}`
            },
            {
              type: 'mrkdwn',
              text: `*Business Type:*\n${merchant.businessInfo?.businessType || 'N/A'}`
            },
            {
              type: 'mrkdwn',
              text: `*Contact:*\n${this.formatCustomerName(merchant)}`
            },
            {
              type: 'mrkdwn',
              text: `*Email:*\n${merchant.email}`
            }
          ]
        },
        {
          type: 'actions',
          elements: [
            {
              type: 'button',
              text: {
                type: 'plain_text',
                text: 'Review Application',
                emoji: true
              },
              url: merchantUrl,
              style: 'primary'
            }
          ]
        }
      ]
    };

    await this.sendNotification(message);
  }

  // High Value Order Alert
  async notifyHighValueOrder(order, threshold = 50000) {
    if (order.totalAmount < threshold) return;

    const orderUrl = `${this.adminPortalUrl}/orders/${order._id}`;
    
    const message = {
      text: '🚨 High Value Order Alert',
      blocks: [
        {
          type: 'header',
          text: {
            type: 'plain_text',
            text: '🚨 High Value Order Alert',
            emoji: true
          }
        },
        {
          type: 'section',
          fields: [
            {
              type: 'mrkdwn',
              text: `*Order Number:*\n${order.orderNumber}`
            },
            {
              type: 'mrkdwn',
              text: `*Total Amount:*\nKsh ${order.totalAmount?.toLocaleString()}`
            },
            {
              type: 'mrkdwn',
              text: `*Customer:*\n${this.formatCustomerName(order.customerInfo)}`
            },
            {
              type: 'mrkdwn',
              text: `*Payment Method:*\n${order.payment?.method === 'paya_bnpl' ? 'BNPL' : order.payment?.method || 'N/A'}`
            }
          ]
        },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: '⚠️ *This order exceeds the high value threshold and may require additional review.*'
          }
        },
        {
          type: 'actions',
          elements: [
            {
              type: 'button',
              text: {
                type: 'plain_text',
                text: 'Review Order',
                emoji: true
              },
              url: orderUrl,
              style: 'danger'
            }
          ]
        }
      ]
    };

    await this.sendNotification(message);
  }

  // Payment Failure Notification
  async notifyPaymentFailure(order, reason) {
    const orderUrl = `${this.adminPortalUrl}/orders/${order._id}`;
    
    const message = {
      text: '❌ Payment Failure',
      blocks: [
        {
          type: 'header',
          text: {
            type: 'plain_text',
            text: '❌ Payment Failure',
            emoji: true
          }
        },
        {
          type: 'section',
          fields: [
            {
              type: 'mrkdwn',
              text: `*Order Number:*\n${order.orderNumber}`
            },
            {
              type: 'mrkdwn',
              text: `*Amount:*\nKsh ${order.totalAmount?.toLocaleString()}`
            },
            {
              type: 'mrkdwn',
              text: `*Customer:*\n${this.formatCustomerName(order.customerInfo)}`
            },
            {
              type: 'mrkdwn',
              text: `*Reason:*\n${reason || 'Unknown'}`
            }
          ]
        },
        {
          type: 'actions',
          elements: [
            {
              type: 'button',
              text: {
                type: 'plain_text',
                text: 'View Order',
                emoji: true
              },
              url: orderUrl,
              style: 'danger'
            }
          ]
        }
      ]
    };

    await this.sendNotification(message);
  }

  // BNPL Application Rejected Notification
  async notifyBNPLRejection(order, reasons) {
    const orderUrl = `${this.adminPortalUrl}/orders/${order._id}`;
    
    // Format reasons as bullet points
    const reasonsList = reasons.map(r => `• ${r}`).join('\n');
    
    const message = {
      text: '❌ BNPL Application Rejected',
      blocks: [
        {
          type: 'header',
          text: {
            type: 'plain_text',
            text: '❌ BNPL Application Rejected',
            emoji: true
          }
        },
        {
          type: 'section',
          fields: [
            {
              type: 'mrkdwn',
              text: `*Order Number:*\n${order.orderNumber}`
            },
            {
              type: 'mrkdwn',
              text: `*Loan Amount:*\nKsh ${order.payment?.bnpl?.loanAmount?.toLocaleString() || order.totalAmount?.toLocaleString() || 'N/A'}`
            },
            {
              type: 'mrkdwn',
              text: `*Customer:*\n${this.formatCustomerName(order.customerInfo)}`
            },
            {
              type: 'mrkdwn',
              text: `*Email:*\n${order.customerInfo?.email || 'N/A'}`
            }
          ]
        },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `*Rejection Reasons:*\n${reasonsList}`
          }
        },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: '⚠️ *Customer may need assistance or follow-up*'
          }
        },
        {
          type: 'actions',
          elements: [
            {
              type: 'button',
              text: {
                type: 'plain_text',
                text: 'View Order',
                emoji: true
              },
              url: orderUrl,
              style: 'danger'
            }
          ]
        }
      ]
    };

    await this.sendNotification(message);
  }

  // BNPL Application Approved Notification
  async notifyBNPLApproval(order) {
    const orderUrl = `${this.adminPortalUrl}/orders/${order._id}`;

    const message = {
      text: '✅ BNPL Application Approved',
      blocks: [
        {
          type: 'header',
          text: {
            type: 'plain_text',
            text: '✅ BNPL Application Approved',
            emoji: true
          }
        },
        {
          type: 'section',
          fields: [
            {
              type: 'mrkdwn',
              text: `*Order Number:*\n${order.orderNumber}`
            },
            {
              type: 'mrkdwn',
              text: `*Loan Amount:*\nKsh ${order.payment?.bnpl?.loanAmount?.toLocaleString() || order.totalAmount?.toLocaleString() || 'N/A'}`
            },
            {
              type: 'mrkdwn',
              text: `*Customer:*\n${this.formatCustomerName(order.customerInfo)}`
            },
            {
              type: 'mrkdwn',
              text: `*Status:*\nApproved ✅`
            }
          ]
        },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: '🎉 *Customer can now proceed with BNPL agreement*'
          }
        },
        {
          type: 'actions',
          elements: [
            {
              type: 'button',
              text: {
                type: 'plain_text',
                text: 'View Order',
                emoji: true
              },
              url: orderUrl,
              style: 'primary'
            }
          ]
        }
      ]
    };

    await this.sendNotification(message);
  }

  // HR Verification Created Notification
  async notifyHRVerificationCreated(verification, order, company) {
    const verificationUrl = `${this.adminPortalUrl}/hr-verifications/${verification._id}`;

    const message = {
      text: '📋 HR Verification Initiated',
      blocks: [
        {
          type: 'header',
          text: {
            type: 'plain_text',
            text: '📋 HR Verification Initiated',
            emoji: true
          }
        },
        {
          type: 'section',
          fields: [
            {
              type: 'mrkdwn',
              text: `*Order Number:*\n${order.orderNumber}`
            },
            {
              type: 'mrkdwn',
              text: `*Customer:*\n${verification.customerSnapshot?.firstName} ${verification.customerSnapshot?.lastName}`
            },
            {
              type: 'mrkdwn',
              text: `*Company:*\n${company.companyName}`
            },
            {
              type: 'mrkdwn',
              text: `*HR Contact:*\n${verification.hrContactSnapshot?.email}`
            }
          ]
        },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: '📧 *Verification email will be sent to HR shortly*'
          }
        },
        {
          type: 'actions',
          elements: [
            {
              type: 'button',
              text: {
                type: 'plain_text',
                text: 'View Verification',
                emoji: true
              },
              url: verificationUrl,
              style: 'primary'
            }
          ]
        }
      ]
    };

    await this.sendNotification(message);
  }

  // HR Verification Email Sent Notification
  async notifyHRVerificationSent(verification) {
    const verificationUrl = `${this.adminPortalUrl}/hr-verifications/${verification._id}`;

    const message = {
      text: '📧 HR Verification Email Sent',
      blocks: [
        {
          type: 'header',
          text: {
            type: 'plain_text',
            text: '📧 HR Verification Email Sent',
            emoji: true
          }
        },
        {
          type: 'section',
          fields: [
            {
              type: 'mrkdwn',
              text: `*Order Number:*\n${verification.order?.orderNumber || 'N/A'}`
            },
            {
              type: 'mrkdwn',
              text: `*Customer:*\n${verification.customerSnapshot?.firstName} ${verification.customerSnapshot?.lastName}`
            },
            {
              type: 'mrkdwn',
              text: `*Sent To:*\n${verification.hrContactSnapshot?.email}`
            },
            {
              type: 'mrkdwn',
              text: `*Deadline:*\n${verification.responseDeadline ? new Date(verification.responseDeadline).toLocaleDateString('en-KE') : 'N/A'}`
            }
          ]
        },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: '⏳ *Awaiting HR response. Will escalate if no response within deadline.*'
          }
        },
        {
          type: 'actions',
          elements: [
            {
              type: 'button',
              text: {
                type: 'plain_text',
                text: 'View Verification',
                emoji: true
              },
              url: verificationUrl,
              style: 'primary'
            }
          ]
        }
      ]
    };

    await this.sendNotification(message);
  }

  // HR Verification Completed Notification
  async notifyHRVerificationCompleted(verification, isVerified, reason = null) {
    const verificationUrl = `${this.adminPortalUrl}/hr-verifications/${verification._id}`;
    const emoji = isVerified ? '✅' : '❌';
    const status = isVerified ? 'Verified' : 'Not Verified';
    const headerEmoji = isVerified ? '✅' : '⚠️';
    const style = isVerified ? 'primary' : 'danger';

    const message = {
      text: `${headerEmoji} HR Verification ${status}`,
      blocks: [
        {
          type: 'header',
          text: {
            type: 'plain_text',
            text: `${headerEmoji} HR Verification ${status}`,
            emoji: true
          }
        },
        {
          type: 'section',
          fields: [
            {
              type: 'mrkdwn',
              text: `*Order Number:*\n${verification.order?.orderNumber || 'N/A'}`
            },
            {
              type: 'mrkdwn',
              text: `*Customer:*\n${verification.customerSnapshot?.firstName} ${verification.customerSnapshot?.lastName}`
            },
            {
              type: 'mrkdwn',
              text: `*Company:*\n${verification.hrContactSnapshot?.companyName || 'N/A'}`
            },
            {
              type: 'mrkdwn',
              text: `*Result:*\n${emoji} ${status}`
            }
          ]
        }
      ]
    };

    if (reason && !isVerified) {
      message.blocks.push({
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*Reason:*\n${reason}`
        }
      });
    }

    if (isVerified) {
      message.blocks.push({
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: '🎉 *Order can now proceed to completion and fund advance*'
        }
      });
    } else {
      message.blocks.push({
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: '⚠️ *Customer may need to be contacted for clarification*'
        }
      });
    }

    message.blocks.push({
      type: 'actions',
      elements: [
        {
          type: 'button',
          text: {
            type: 'plain_text',
            text: 'View Details',
            emoji: true
          },
          url: verificationUrl,
          style: style
        }
      ]
    });

    await this.sendNotification(message);
  }

  // HR Verification Timeout Notification
  async notifyHRVerificationTimeout(verification) {
    const verificationUrl = `${this.adminPortalUrl}/hr-verifications/${verification._id}`;

    const message = {
      text: '🚨 HR Verification Timeout - Action Required',
      blocks: [
        {
          type: 'header',
          text: {
            type: 'plain_text',
            text: '🚨 HR Verification Timeout',
            emoji: true
          }
        },
        {
          type: 'section',
          fields: [
            {
              type: 'mrkdwn',
              text: `*Order Number:*\n${verification.order?.orderNumber || 'N/A'}`
            },
            {
              type: 'mrkdwn',
              text: `*Customer:*\n${verification.customerSnapshot?.firstName} ${verification.customerSnapshot?.lastName}`
            },
            {
              type: 'mrkdwn',
              text: `*Company:*\n${verification.hrContactSnapshot?.companyName || 'N/A'}`
            },
            {
              type: 'mrkdwn',
              text: `*Days Waiting:*\n${verification.daysSinceEmailSent || 'N/A'} days`
            }
          ]
        },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: '⚠️ *No response received from HR within the deadline. Manual review required.*'
          }
        },
        {
          type: 'actions',
          elements: [
            {
              type: 'button',
              text: {
                type: 'plain_text',
                text: 'Review Now',
                emoji: true
              },
              url: verificationUrl,
              style: 'danger'
            }
          ]
        }
      ]
    };

    await this.sendNotification(message);
  }

  // HR Verification Pending Review Notification (for admin dashboard)
  async notifyHRVerificationPendingReview(count) {
    const verificationListUrl = `${this.adminPortalUrl}/hr-verifications?status=pending`;

    const message = {
      text: `📋 ${count} HR Verification(s) Pending Review`,
      blocks: [
        {
          type: 'header',
          text: {
            type: 'plain_text',
            text: '📋 HR Verifications Pending Review',
            emoji: true
          }
        },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `You have *${count}* HR verification(s) awaiting admin review.`
          }
        },
        {
          type: 'actions',
          elements: [
            {
              type: 'button',
              text: {
                type: 'plain_text',
                text: 'View All Pending',
                emoji: true
              },
              url: verificationListUrl,
              style: 'primary'
            }
          ]
        }
      ]
    };

    await this.sendNotification(message);
  }
}

module.exports = new SlackService();
