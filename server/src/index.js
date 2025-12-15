const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');
const session = require('express-session');
require('dotenv').config();

// Set JWT secret if not provided
if (!process.env.JWT_SECRET) {
  process.env.JWT_SECRET = 'paya-marketplace-jwt-secret-key-2024-development';
}

const app = express();

// Trust proxy - required for Railway and other reverse proxies
app.set('trust proxy', 1);

// Import routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const productRoutes = require('./routes/products');
const orderRoutes = require('./routes/orders');
const merchantRoutes = require('./routes/merchants');
const adminRoutes = require('./routes/admin');
const uploadRoutes = require('./routes/uploads');
const supportRoutes = require('./routes/support');
const integrationsRoutes = require('./routes/integrations');
const underwritingRoutes = require('./routes/underwriting');
const cdlCompaniesRoutes = require('./routes/cdlCompanies');
const hrVerificationRoutes = require('./routes/hrVerification');

// Security middleware
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        ...helmet.contentSecurityPolicy.getDefaultDirectives(),
        'img-src': ["'self'", 'data:', 'http://localhost:*', 'https://*'],
      },
    },
    crossOriginResourcePolicy: { policy: 'cross-origin' }, // Allow cross-origin images
  })
);
app.use(compression());

// Rate limiting (increased for development)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10000, // significantly increased limit for development
  message: 'Too many requests from this IP, please try again later.',
  skip: (req) => {
    // Skip rate limiting for localhost in development
    return process.env.NODE_ENV === 'development';
  },
});
app.use('/api/', limiter);

// CORS configuration
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);

    const allowedOrigins = [
      'http://localhost:3000',
      'http://localhost:3001',
      'http://localhost:3002',
      'http://localhost:3003',
      'http://localhost:3004',
      'https://paya-marketplace.netlify.app',
      'https://paya-marketplace-admin.netlify.app',
      'https://paya-marketplace-merchant.netlify.app',
    ];

    // Allow any localhost or 127.0.0.1 origin for development
    if (
      origin.startsWith('http://localhost:') ||
      origin.startsWith('http://127.0.0.1:')
    ) {
      return callback(null, true);
    }

    // Allow any Netlify deploy preview URLs
    if (origin.includes('.netlify.app')) {
      return callback(null, true);
    }

    if (allowedOrigins.indexOf(origin) !== -1) {
      return callback(null, true);
    }

    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
};

app.use(cors(corsOptions));

// Body parsing middleware
// Special handling for Shopify webhooks - they need raw body for HMAC verification
app.use((req, res, next) => {
  if (req.path.startsWith('/api/integrations/shopify/webhooks/')) {
    next();
  } else {
    express.json({ limit: '10mb' })(req, res, next);
  }
});
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Session middleware (for Shopify OAuth)
app.use(
  session({
    secret:
      process.env.SESSION_SECRET || 'paya-session-secret-change-in-production',
    resave: false,
    saveUninitialized: false, // Only save session when data is added
    cookie: {
      secure: process.env.NODE_ENV === 'production', // HTTPS only in production
      httpOnly: true,
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax', // Allow cross-site for OAuth
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    },
    name: 'paya.sid', // Custom session name
  })
);

// Logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Serve uploaded files statically
const path = require('path');
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Database connection
const mongoUri =
  process.env.MONGODB_URI ||
  'mongodb+srv://paya-admin:QVFHuUWKKlOYsAgR@marketplace.ty20ofu.mongodb.net/paya-marketplace?retryWrites=true&w=majority&appName=marketplace';

mongoose
  .connect(mongoUri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log('Connected to MongoDB Atlas');

    // Initialize Shopify scheduled sync after DB connection
    if (process.env.SHOPIFY_API_KEY && process.env.SHOPIFY_API_SECRET) {
      const {
        initializeScheduledSync,
      } = require('./services/shopifyScheduledSync');
      initializeScheduledSync();
      console.log('✅ Shopify scheduled sync initialized');
    } else {
      console.log(
        '⚠️  Shopify credentials not found - scheduled sync disabled'
      );
    }

    // Initialize HR Verification scheduler
    const { initializeScheduler } = require('./services/hrVerificationScheduler');
    initializeScheduler();
    console.log('✅ HR Verification scheduler initialized');
  })
  .catch((error) => {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  });

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/merchants', merchantRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/uploads', uploadRoutes);
app.use('/api/support', supportRoutes);
app.use('/api/integrations', integrationsRoutes);
app.use('/api/underwriting', underwritingRoutes);
app.use('/api/cdl-companies', cdlCompaniesRoutes);
app.use('/api/hr-verification', hrVerificationRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// Global error handler
app.use((error, req, res, next) => {
  console.error('Global error handler:', error);

  if (error.name === 'ValidationError') {
    return res.status(400).json({
      message: 'Validation Error',
      errors: Object.values(error.errors).map((err) => err.message),
    });
  }

  if (error.name === 'CastError') {
    return res.status(400).json({ message: 'Invalid ID format' });
  }

  if (error.code === 11000) {
    return res.status(400).json({ message: 'Duplicate field value' });
  }

  res.status(error.status || 500).json({
    message: error.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: error.stack }),
  });
});

const PORT = process.env.PORT || 5001;

// Debug endpoint to check environment variables (remove in production)
app.get('/api/debug/env', (req, res) => {
  res.json({
    hasSlackWebhook: !!process.env.SLACK_WEBHOOK_URL,
    slackWebhookLength: process.env.SLACK_WEBHOOK_URL
      ? process.env.SLACK_WEBHOOK_URL.length
      : 0,
    hasAdminPortalUrl: !!process.env.ADMIN_PORTAL_URL,
    nodeEnv: process.env.NODE_ENV,
    allEnvKeys: Object.keys(process.env).filter(
      (key) => key.includes('SLACK') || key.includes('ADMIN')
    ),
  });
});

app.listen(PORT, () => {
  console.log(`Paya Marketplace server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(
    `Debug: SLACK_WEBHOOK_URL exists: ${!!process.env.SLACK_WEBHOOK_URL}`
  );
});
