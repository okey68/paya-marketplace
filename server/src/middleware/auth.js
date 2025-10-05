const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Verify JWT token
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN
    
    if (!token) {
      return res.status(401).json({ message: 'Access token required' });
    }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId).select('-password');
    
    if (!user || !user.isActive) {
      return res.status(401).json({ message: 'Invalid or inactive user' });
    }
    
    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: 'Invalid token' });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token expired' });
    }
    
    console.error('Auth middleware error:', error);
    res.status(500).json({ message: 'Authentication error' });
  }
};

// Check if user has required role
const requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }
    
    const userRoles = Array.isArray(roles) ? roles : [roles];
    
    if (!userRoles.includes(req.user.role)) {
      return res.status(403).json({ 
        message: `Access denied. Required role: ${userRoles.join(' or ')}` 
      });
    }
    
    next();
  };
};

// Check if user is a merchant and approved
const requireApprovedMerchant = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Authentication required' });
  }
  
  if (req.user.role !== 'merchant') {
    return res.status(403).json({ message: 'Merchant access required' });
  }
  
  if (req.user.businessInfo.approvalStatus !== 'approved') {
    return res.status(403).json({ 
      message: 'Merchant account pending approval',
      approvalStatus: req.user.businessInfo.approvalStatus
    });
  }
  
  next();
};

// Check if user owns the resource or is admin
const requireOwnershipOrAdmin = (resourceField = 'userId') => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }
    
    // Admins can access any resource
    if (req.user.role === 'admin') {
      return next();
    }
    
    // Check if user owns the resource
    const resourceId = req.params[resourceField] || req.body[resourceField];
    
    if (resourceId && resourceId !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied. Insufficient permissions.' });
    }
    
    next();
  };
};

// Optional authentication (for public endpoints that benefit from user context)
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];
    
    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.userId).select('-password');
      
      if (user && user.isActive) {
        req.user = user;
      }
    }
    
    next();
  } catch (error) {
    // Ignore auth errors for optional auth
    next();
  }
};

// Rate limiting for sensitive operations
const sensitiveOperationLimit = (req, res, next) => {
  // This would integrate with a rate limiting solution like Redis
  // For now, we'll just pass through
  next();
};

module.exports = {
  authenticateToken,
  requireRole,
  requireApprovedMerchant,
  requireOwnershipOrAdmin,
  optionalAuth,
  sensitiveOperationLimit
};
