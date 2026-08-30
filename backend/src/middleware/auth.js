// Authentication middleware.
// Protects routes by requiring a valid JWT in the Authorization header.
// Usage: router.get('/some-protected-route', authenticate, controllerFn)

const jwt = require('jsonwebtoken');
const AppError = require('../utils/AppError');

function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(new AppError(
      'You must be logged in to access this resource.',
      401,
      'NO_TOKEN'
    ));
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    // Attach the decoded info (id, role) to the request so later
    // handlers know exactly who is making this request.
    req.user = decoded;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return next(new AppError(
        'Your session has expired. Please log in again.',
        401,
        'TOKEN_EXPIRED'
      ));
    }
    return next(new AppError(
      'Invalid authentication token.',
      401,
      'INVALID_TOKEN'
    ));
  }
}

module.exports = authenticate;
