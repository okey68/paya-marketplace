# Paya Marketplace Deployment Guide

## 🚀 Quick Deploy

This guide will help you deploy the Paya Marketplace to production using Railway (backend) and Netlify (frontend/admin).

## 📋 Prerequisites

1. **GitHub Account** - Code repository
2. **Railway Account** - Backend deployment
3. **Netlify Account** - Frontend deployment  
4. **MongoDB Atlas Account** - Production database

## 🗄️ Database Setup (MongoDB Atlas)

1. **Create MongoDB Atlas Account**: https://www.mongodb.com/atlas
2. **Create New Cluster**: 
   - Choose free tier (M0)
   - Select region closest to your users
3. **Create Database User**:
   - Username: `paya-user`
   - Password: Generate strong password
4. **Network Access**: Add `0.0.0.0/0` (allow from anywhere)
5. **Get Connection String**: 
   ```
   mongodb+srv://paya-user:<password>@cluster0.xxxxx.mongodb.net/paya-marketplace
   ```

## 🖥️ Backend Deployment (Railway)

1. **Connect GitHub**: 
   - Go to https://railway.app
   - Sign up/login with GitHub
   - Connect this repository

2. **Deploy Backend**:
   - Click "New Project" → "Deploy from GitHub repo"
   - Select `paya-marketplace` repository
   - Railway will auto-detect the Node.js app

3. **Environment Variables**:
   ```bash
   NODE_ENV=production
   PORT=5000
   MONGODB_URI=mongodb+srv://paya-user:<password>@cluster0.xxxxx.mongodb.net/paya-marketplace
   JWT_SECRET=your-super-secret-jwt-key-min-32-chars
   JWT_EXPIRES_IN=7d
   CLIENT_URL=https://paya-marketplace.netlify.app
   ADMIN_URL=https://paya-marketplace-admin.netlify.app
   MAX_FILE_SIZE=10485760
   PAYA_ADVANCE_RATE=0.99
   PAYA_LOAN_TERM_DAYS=30
   ```

4. **Custom Start Command**: 
   ```bash
   cd server && npm start
   ```

5. **Get Railway URL**: Copy the generated URL (e.g., `https://paya-marketplace-api.up.railway.app`)

## 🌐 Frontend Deployment (Netlify)

1. **Connect GitHub**:
   - Go to https://netlify.com
   - Sign up/login with GitHub
   - Click "New site from Git"

2. **Deploy Settings**:
   - **Repository**: Select `paya-marketplace`
   - **Base directory**: `client`
   - **Build command**: `npm run build`
   - **Publish directory**: `client/build`

3. **Environment Variables**:
   ```bash
   REACT_APP_API_URL=https://paya-marketplace-api.up.railway.app/api
   ```

4. **Custom Domain** (Optional):
   - Go to Site Settings → Domain Management
   - Add custom domain: `paya-marketplace.com`

## 👨‍💼 Admin Dashboard Deployment (Netlify)

1. **Create Second Netlify Site**:
   - Click "New site from Git"
   - Select same repository

2. **Deploy Settings**:
   - **Base directory**: `admin`
   - **Build command**: `npm run build`
   - **Publish directory**: `admin/build`

3. **Environment Variables**:
   ```bash
   REACT_APP_API_URL=https://paya-marketplace-api.up.railway.app/api
   ```

## 🔧 Post-Deployment Setup

### 1. Update CORS Settings
Update your Railway backend environment variables:
```bash
CLIENT_URL=https://your-netlify-frontend-url.netlify.app
ADMIN_URL=https://your-netlify-admin-url.netlify.app
```

### 2. Test Deployment
- ✅ Frontend loads correctly
- ✅ Admin dashboard loads correctly  
- ✅ API endpoints respond
- ✅ Database connection works
- ✅ User registration/login works
- ✅ Product catalog displays
- ✅ Cart functionality works
- ✅ Checkout flow completes

### 3. Seed Database (Optional)
Run these commands in Railway console to add sample data:
```bash
# Add sample merchants and products
node scripts/seed-database.js
```

## 🔒 Security Checklist

- [ ] **Strong JWT Secret**: Minimum 32 characters
- [ ] **Database Security**: Restricted network access
- [ ] **Environment Variables**: No secrets in client code
- [ ] **HTTPS**: All connections encrypted
- [ ] **CORS**: Restricted to your domains only

## 📊 Monitoring

### Railway (Backend)
- **Logs**: View in Railway dashboard
- **Metrics**: CPU, Memory, Network usage
- **Alerts**: Set up for downtime/errors

### Netlify (Frontend)
- **Analytics**: Built-in traffic analytics
- **Forms**: Contact form submissions
- **Functions**: Serverless function logs

## 🚨 Troubleshooting

### Common Issues:

1. **Build Fails**:
   - Check Node.js version compatibility
   - Verify all dependencies are installed
   - Check build logs for specific errors

2. **API Connection Issues**:
   - Verify REACT_APP_API_URL is correct
   - Check CORS settings on backend
   - Ensure Railway service is running

3. **Database Connection**:
   - Verify MongoDB Atlas connection string
   - Check network access settings
   - Ensure database user has correct permissions

## 📞 Support

- **Railway Support**: https://railway.app/help
- **Netlify Support**: https://www.netlify.com/support/
- **MongoDB Atlas**: https://www.mongodb.com/support

## 🎯 Production URLs

After deployment, your URLs will be:
- **Frontend**: `https://paya-marketplace.netlify.app`
- **Admin**: `https://paya-marketplace-admin.netlify.app`  
- **API**: `https://paya-marketplace-api.up.railway.app`

---

🎉 **Congratulations!** Your Paya Marketplace is now live in production!
