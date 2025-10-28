# Shopify App Submission Guide

## ✅ Compliance Requirements Implemented

Your Paya Products app now meets all Shopify's automated check requirements:

### 1. ✅ Immediately Authenticates After Install
- OAuth flow starts immediately when merchant clicks "Install"
- Proper state validation for security
- Session management for merchant tracking

### 2. ✅ Immediately Redirects to App UI After Authentication
- After successful OAuth, merchants are redirected to: `http://localhost:3003/products?shopify=connected`
- In production, this will be your production merchant portal URL

### 3. ✅ Provides Mandatory Compliance Webhooks
Three GDPR-compliant webhooks are automatically registered:
- **customers/data_request** - Handles customer data access requests
- **customers/redact** - Handles customer data deletion requests
- **shop/redact** - Handles shop uninstall and data deletion

### 4. ✅ Verifies Webhooks with HMAC Signatures
- All webhook endpoints verify HMAC-SHA256 signatures
- Uses your API Secret to validate authenticity
- Rejects unauthorized webhook requests

### 5. ⚠️ Uses a Valid TLS Certificate
- **For local testing**: Not applicable (localhost)
- **For production**: You'll need to deploy to a server with HTTPS/TLS

---

## 🚀 Before Running Automated Checks

### Step 1: Deploy to Production (Required for TLS Check)

You need to deploy your backend server to a production environment with HTTPS. Options:

#### Option A: Railway (Recommended - Easy)
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Deploy from server directory
cd server
railway up
```

#### Option B: Heroku
```bash
# Install Heroku CLI
brew tap heroku/brew && brew install heroku

# Login and create app
heroku login
heroku create paya-marketplace-api

# Deploy
git push heroku main
```

#### Option C: DigitalOcean App Platform
- Connect your GitHub repo
- Auto-deploys with HTTPS included

### Step 2: Update Environment Variables in Production

Set these environment variables in your production environment:

```bash
# Shopify Credentials
SHOPIFY_API_KEY=b7ef94121575d7a518eda729ffca6fc4
SHOPIFY_API_SECRET=aa9462c5e4579f5ff6f264e7d638d55f
SHOPIFY_SCOPES=read_products,read_inventory

# Production URLs (update with your actual domains)
SHOPIFY_REDIRECT_URI=https://your-api-domain.com/api/integrations/shopify/callback
APP_URL=https://your-merchant-portal-domain.com
SHOPIFY_WEBHOOK_URL=https://your-api-domain.com

# Database
MONGODB_URI=your-production-mongodb-uri

# JWT
JWT_SECRET=your-secure-jwt-secret
SESSION_SECRET=your-secure-session-secret

# Other required vars
NODE_ENV=production
PORT=5001
```

### Step 3: Update Shopify App Settings

In your Shopify Partner Dashboard, update:

1. **App URL**: `https://your-api-domain.com`
2. **Allowed redirection URL(s)**: 
   - `https://your-api-domain.com/api/integrations/shopify/callback`

---

## 🧪 Testing Locally Before Submission

### Test OAuth Flow
1. Start your local servers: `npm run dev`
2. Go to merchant portal: `http://localhost:3003`
3. Login as a merchant
4. Go to Products page
5. Click "Connect Shopify Store"
6. Enter a test store name
7. Complete OAuth flow

### Test Webhook Endpoints (Using ngrok for local testing)

```bash
# Install ngrok
brew install ngrok

# Start ngrok tunnel
ngrok http 5001

# Copy the HTTPS URL (e.g., https://abc123.ngrok.io)
# Update your .env:
SHOPIFY_WEBHOOK_URL=https://abc123.ngrok.io

# Test webhooks by triggering them from Shopify admin
```

---

## 📋 Running Shopify's Automated Checks

Once deployed to production:

1. Go to your Shopify Partner Dashboard
2. Navigate to your "Paya Products" app
3. Go to **Distribution** → **App Store Listing**
4. Scroll to **"Automated checks for common errors"**
5. Click **"Run checks"**

### Expected Results:
- ✅ Immediately authenticates after install
- ✅ Immediately redirects to app UI after authentication
- ✅ Provides mandatory compliance webhooks
- ✅ Verifies webhooks with HMAC signatures
- ✅ Uses a valid TLS certificate (if deployed with HTTPS)

---

## 🔧 Troubleshooting

### If "Immediately authenticates after install" fails:
- Ensure your OAuth flow starts immediately when app is installed
- Check that `SHOPIFY_API_KEY` and `SHOPIFY_API_SECRET` are correct

### If "Immediately redirects to app UI" fails:
- Verify `APP_URL` environment variable is set correctly
- Check that the callback redirects to your merchant portal

### If "Provides mandatory compliance webhooks" fails:
- Ensure webhooks are being registered during OAuth callback
- Check server logs for webhook registration errors
- Verify webhook URLs are publicly accessible (HTTPS)

### If "Verifies webhooks with HMAC" fails:
- Confirm HMAC verification is working in webhook handlers
- Test with Shopify's webhook testing tool
- Ensure `SHOPIFY_API_SECRET` matches your app credentials

### If "Uses a valid TLS certificate" fails:
- Deploy to a production environment with HTTPS
- Use a service like Railway, Heroku, or DigitalOcean
- Ensure your domain has a valid SSL certificate

---

## 📝 App Submission Checklist

Before submitting your app for review:

- [ ] App is deployed to production with HTTPS
- [ ] All environment variables are set correctly
- [ ] OAuth flow works end-to-end
- [ ] Webhooks are publicly accessible
- [ ] All automated checks pass
- [ ] App listing information is complete:
  - [ ] App name and description
  - [ ] App icon (512x512px)
  - [ ] Screenshots
  - [ ] Privacy policy URL
  - [ ] Support contact information
- [ ] Test the app with a real Shopify store

---

## 🎯 Next Steps

1. **Deploy to production** (Railway/Heroku/DigitalOcean)
2. **Update Shopify app URLs** with production domains
3. **Run automated checks** in Partner Dashboard
4. **Complete app listing** (description, screenshots, etc.)
5. **Submit for review**

---

## 📞 Support

If you encounter issues during submission:
- Check Shopify's [App Review Guidelines](https://shopify.dev/docs/apps/launch/review)
- Review [OAuth documentation](https://shopify.dev/docs/apps/auth/oauth)
- Check [Webhook documentation](https://shopify.dev/docs/apps/webhooks)

---

## 🔐 Security Notes

- Never commit `.env` files to version control
- Use strong, unique secrets for JWT and session
- Rotate API credentials if compromised
- Monitor webhook endpoints for suspicious activity
- Keep dependencies updated for security patches
