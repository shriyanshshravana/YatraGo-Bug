const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { isDbConnected } = require('../config/db');

/**
 * Middleware to protect private routes using JWT
 */
const protect = async (req, res, next) => {
  let token;

  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Access denied. No authentication token provided in Authorization header.',
    });
  }

  if (!isDbConnected()) {
    return res.status(503).json({
      success: false,
      message: 'Database service is currently unavailable. Please verify MONGODB_URI in your environment.',
    });
  }

  try {
    const secret = process.env.JWT_SECRET || 'yatrago_fallback_jwt_secret';
    const decoded = jwt.verify(token, secret);

    // Find the user and verify token version (handles server-side token invalidation / logout)
    const user = await User.findById(decoded.id).select('+tokenVersion');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'The user belonging to this token no longer exists.',
      });
    }

    // Check if token was invalidated by a logout or password change
    if (decoded.tokenVersion !== undefined && user.tokenVersion !== decoded.tokenVersion) {
      return res.status(401).json({
        success: false,
        message: 'Session has expired or was logged out. Please log in again.',
      });
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Authentication token has expired. Please log in again.',
      });
    }

    return res.status(401).json({
      success: false,
      message: 'Invalid authentication token. Authorization failed.',
    });
  }
};

/**
 * Helper to generate signed JWT token for a user
 * @param {Object} user
 * @returns {string}
 */
const generateToken = (user) => {
  const secret = process.env.JWT_SECRET || 'yatrago_fallback_jwt_secret';
  const expiresIn = process.env.JWT_EXPIRES_IN || '7d';

  return jwt.sign(
    {
      id: user._id,
      email: user.email,
      tokenVersion: user.tokenVersion || 0,
    },
    secret,
    { expiresIn }
  );
};

module.exports = {
  protect,
  generateToken,
};
