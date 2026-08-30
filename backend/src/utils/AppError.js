// Custom error class for predictable, structured API errors.
// Instead of throwing generic Error objects, we throw AppError with a
// status code and an error "code" the frontend can react to programmatically.

class AppError extends Error {
  constructor(message, statusCode, errorCode) {
    super(message);
    this.statusCode = statusCode;
    this.errorCode = errorCode;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = AppError;
