# Paya Marketplace

A multi-vendor e-commerce platform for Kenyan businesses with integrated BNPL (Buy Now Pay Later) payment solutions.

## Features

### For Merchants
- Easy onboarding with business verification
- Product management (individual or bulk upload)
- Order management and fulfillment tracking
- Business settings and profile management

### For Customers
- Browse products by category or merchant
- Shopify-style marketplace experience
- Paya BNPL checkout with loan agreements
- Order tracking and history

### For Paya Admins
- Merchant oversight and management
- Order monitoring and fund advancement tracking
- Platform analytics and KPIs

## Tech Stack

- **Frontend**: React 18 with React Router
- **Backend**: Node.js/Express with MongoDB
- **Database**: MongoDB with GridFS for file storage
- **Authentication**: JWT-based with role management
- **Deployment**: Railway (backend) + Netlify (frontend/admin)

## Getting Started

1. Install dependencies:
```bash
npm run install:all
```

2. Set up environment variables (see .env.example files)

3. Start development servers:
```bash
npm run dev
```

## Project Structure

```
paya-marketplace/
├── client/          # Customer marketplace (React)
├── server/          # Backend API (Node.js/Express)
├── admin/           # Paya admin dashboard (React)
└── package.json     # Root package with scripts
```

## Currency

All prices and transactions are in Kenyan Shillings (KES).
