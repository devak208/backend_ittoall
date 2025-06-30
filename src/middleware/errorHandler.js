// Global error handling middleware
export const errorHandler = (err, req, res, next) => {
  console.error('Error:', err);

  // Database connection errors
  if (err.code === 'ECONNREFUSED') {
    return res.status(503).json({
      success: false,
      message: 'Database connection failed',
      error: process.env.NODE_ENV === 'development' ? err.message : 'Service temporarily unavailable',
    });
  }

  // Validation errors
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      message: 'Validation error',
      errors: err.details,
    });
  }

  // Duplicate key errors (PostgreSQL)
  if (err.code === '23505') {
    return res.status(409).json({
      success: false,
      message: 'Resource already exists',
      error: 'Duplicate entry detected',
    });
  }

  // Foreign key constraint errors
  if (err.code === '23503') {
    return res.status(400).json({
      success: false,
      message: 'Invalid reference',
      error: 'Referenced resource does not exist',
    });
  }

  // Default error response
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.stack : 'Something went wrong',
  });
};

// 404 handler
export const notFoundHandler = (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
    error: `Cannot ${req.method} ${req.path}`,
  });
};

// Async error wrapper
export const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
