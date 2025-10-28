# Slack Notifications Setup Guide

This guide will help you set up Slack notifications for the Paya Marketplace admin team.

## Overview

The Slack integration sends real-time notifications to your `#paya-marketplace` channel for:

- 🛍️ **New Orders** - When customers place orders
- 💳 **BNPL Applications** - When customers apply for Buy Now, Pay Later
- 📋 **Order Status Changes** - When orders move through different stages
- 🎫 **Support Tickets** - When customers submit support requests
- 🏪 **Merchant Applications** - When new merchants register
- 🚨 **High Value Orders** - Orders exceeding Ksh 50,000
- ❌ **Payment Failures** - When payments fail

## Setup Instructions

### 1. Create a Slack Incoming Webhook

1. Go to your Slack workspace
2. Navigate to **Apps** → **Manage** → **Custom Integrations** → **Incoming Webhooks**
3. Click **Add to Slack**
4. Select the `#paya-marketplace` channel
5. Click **Add Incoming WebHooks integration**
6. Copy the **Webhook URL** (it will look like: `https://hooks.slack.com/services/T00000000/B00000000/XXXXXXXXXXXXXXXXXXXX`)

### 2. Configure Environment Variables

Add the following to your `.env` file:

```env
# Slack Configuration
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/WEBHOOK/URL
ADMIN_PORTAL_URL=http://localhost:3001

# For production
# ADMIN_PORTAL_URL=https://admin.payamarketplace.com
```

### 3. Restart Your Server

```bash
npm run dev
```

## Notification Types

### New Order Notification
Sent when a customer places an order.

**Includes:**
- Order number (e.g., #PY-20251019-12345)
- Total amount
- Customer name
- Payment method
- Number of items
- Link to view order in admin portal

### BNPL Application Notification
Sent when a customer applies for BNPL financing.

**Includes:**
- Order number
- Loan amount
- Customer name
- Application status
- Link to review application

### Order Status Change Notification
Sent when an order status changes.

**Includes:**
- Order number
- Status change (e.g., pending → approved)
- Customer name
- Total amount
- Link to view order

### Support Ticket Notification
Sent when a customer submits a support ticket.

**Includes:**
- Ticket number
- Priority level
- Customer name and email
- Subject and message preview
- Order number (if related to an order)
- Link to view ticket

### Merchant Application Notification
Sent when a new merchant registers.

**Includes:**
- Business name
- Business type
- Contact person
- Email
- Link to review application

### High Value Order Alert
Sent for orders exceeding Ksh 50,000.

**Includes:**
- Order number
- Total amount (highlighted)
- Customer name
- Payment method
- Warning message
- Link to review order

### Payment Failure Notification
Sent when a payment fails.

**Includes:**
- Order number
- Amount
- Customer name
- Failure reason
- Link to view order

## Customization

### Change High Value Threshold

Edit `/server/services/slackService.js`:

```javascript
async notifyHighValueOrder(order, threshold = 50000) {
  // Change 50000 to your desired threshold
}
```

### Disable Specific Notifications

Comment out specific notification calls in the route files:

```javascript
// await slackService.notifyHighValueOrder(order); // Disabled
```

### Customize Message Format

Edit the message blocks in `/server/services/slackService.js` for each notification type.

## Testing

### Test Slack Integration

```bash
# Create a test order through the API or UI
# Check your #paya-marketplace Slack channel for notifications
```

### Verify Webhook URL

```bash
curl -X POST -H 'Content-type: application/json' \
--data '{"text":"Test notification from Paya Marketplace"}' \
YOUR_WEBHOOK_URL
```

## Troubleshooting

### Notifications Not Appearing

1. **Check webhook URL**: Verify `SLACK_WEBHOOK_URL` in `.env`
2. **Check channel**: Ensure webhook is configured for `#paya-marketplace`
3. **Check logs**: Look for "Slack notification sent successfully" or error messages
4. **Test webhook**: Use curl command above to test webhook directly

### Notifications Disabled

If you see "Slack notifications disabled - no webhook URL configured" in logs:
- Add `SLACK_WEBHOOK_URL` to your `.env` file
- Restart the server

### Wrong Channel

If notifications go to the wrong channel:
- Recreate the webhook for the correct channel
- Update `SLACK_WEBHOOK_URL` in `.env`

## Admin Portal Links

All notifications include direct links to the admin portal. Make sure:

1. `ADMIN_PORTAL_URL` is set correctly in `.env`
2. Admin portal routes match the URLs in notifications:
   - `/orders/:id` - Order details
   - `/support/:id` - Support ticket details
   - `/merchants/:id` - Merchant details

## Security Notes

- ⚠️ **Never commit** your `SLACK_WEBHOOK_URL` to version control
- ⚠️ Keep your `.env` file secure
- ⚠️ Rotate webhook URL if compromised
- ⚠️ Use environment-specific webhooks for dev/staging/production

## Support

For issues or questions:
- Check server logs for error messages
- Verify Slack webhook configuration
- Test webhook URL directly
- Contact the development team

---

**Last Updated:** October 2025
