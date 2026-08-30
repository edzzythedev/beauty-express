// Global error handler — every error in the app funnels through here,
// guaranteeing one consistent response shape across the entire API.

function errorHandler(err, req, res, next) {
  console.error(`[${new Date().toISOString()}] Error:`, err);

  if (err.isOperational) {
    return res.status(err.statusCode).json({
      success: false,
      error: {
        code: err.errorCode,
        message: err.message,
      },
    });
  }

  if (err.code === '23505') {
    return res.status(409).json({
      success: false,
      error: {
        code: 'DUPLICATE_ENTRY',
        message: 'This record already exists.',
      },
    });
  }

  return res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: 'Something went wrong on our end. Please try again shortly.',
    },
  });
}

module.exports = errorHandler;
