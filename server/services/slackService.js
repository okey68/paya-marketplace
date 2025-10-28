const axios = require('axios');

class SlackService {
  constructor() {
    this.webhookUrl = process.env.SLACK_WEBHOOK_URL;
    this.adminPortalUrl = process.env.ADMIN_PORTAL_URL || 'http://localhost:3001';
    this.enabled = !!this.webhookUrl;
  }

  async sendNotification(message) {
    if (!this.enabled) {
      console.log('Slack notifications disabled - no webhook URL configured');
      return;
    }

    try {
      await axios.post(this.webhookUrl, message);
      console.log('Slack notification sent successfully');
    } catch (error) {
      console.error('Failed to send Slack notification:', error.message);
    }
  }

  // New Order Notification
  async notifyNewOrder(order) {
    const orderUrl = `${this.adminPortalUrl}/orders/${order._id}`;
    
    const message = {
      text: '🛍️ New Order Received',
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
              text: `*Order Number:*\n${order.orderNumber}`
            },
            {
              type: 'mrkdwn',
              text: `*Total Amount:*\nKsh ${order.totalAmount?.toLocaleString() || 'N/A'}`
            },
            {
              type: 'mrkdwn',
              text: `*Customer:*\n${order.customerInfo?.firstName} ${order.customerInfo?.lastName}`
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
            text: `*Items:* ${order.items?.length || 0} item(s)`
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
              text: `*Customer:*\n${order.customerInfo?.firstName} ${order.customerInfo?.lastName}`
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
              text: `*Customer:*\n${order.customerInfo?.firstName} ${order.customerInfo?.lastName}`
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
              text: `*Contact:*\n${merchant.firstName} ${merchant.lastName}`
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
              text: `*Customer:*\n${order.customerInfo?.firstName} ${order.customerInfo?.lastName}`
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
              text: `*Customer:*\n${order.customerInfo?.firstName} ${order.customerInfo?.lastName}`
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
              text: `*Customer:*\n${order.customerInfo?.firstName} ${order.customerInfo?.lastName}`
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
              text: `*Customer:*\n${order.customerInfo?.firstName} ${order.customerInfo?.lastName}`
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
}

module.exports = new SlackService();
