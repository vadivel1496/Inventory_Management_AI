const logger = require('../utils/logger');

const errorHandler = (err, req, res, next) => {
  logger.error('Error:', err);

  // Default error
  let error = {
    code: 'INTERNAL_SERVER_ERROR',
    message: 'Something went wrong',
    details: []
  };

  // Joi validation error
  if (err.isJoi) {
    error = {
      code: 'VALIDATION_ERROR',
      message: 'Validation failed',
      details: err.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }))
    };
    return res.status(400).json({
      success: false,
      error,
      timestamp: new Date().toISOString()
    });
  }

  // JWT error
  if (err.name === 'JsonWebTokenError') {
    error = {
      code: 'INVALID_TOKEN',
      message: 'Invalid token'
    };
    return res.status(401).json({
      success: false,
      error,
      timestamp: new Date().toISOString()
    });
  }

  // JWT expired
  if (err.name === 'TokenExpiredError') {
    error = {
      code: 'TOKEN_EXPIRED',
      message: 'Token expired'
    };
    return res.status(401).json({
      success: false,
      error,
      timestamp: new Date().toISOString()
    });
  }

  // Database error
  if (err.code === '23505') { // Unique violation
    error = {
      code: 'DUPLICATE_ENTRY',
      message: 'Record already exists'
    };
    return res.status(409).json({
      success: false,
      error,
      timestamp: new Date().toISOString()
    });
  }

  if (err.code === '23503') { // Foreign key violation
    error = {
      code: 'FOREIGN_KEY_VIOLATION',
      message: 'Referenced record does not exist'
    };
    return res.status(400).json({
      success: false,
      error,
      timestamp: new Date().toISOString()
    });
  }

  // Custom error
  if (err.statusCode) {
    return res.status(err.statusCode).json({
      success: false,
      error: {
        code: err.code || 'CUSTOM_ERROR',
        message: err.message
      },
      timestamp: new Date().toISOString()
    });
  }

  // Generic error
  res.status(500).json({
    success: false,
    error,
    timestamp: new Date().toISOString()
  });
};

module.exports = errorHandler;
