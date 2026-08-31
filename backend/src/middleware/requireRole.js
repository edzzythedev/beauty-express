// Role-based access control middleware.
// Use AFTER `authenticate` — it relies on req.user already being set.
// Usage: router.get('/admin-only-thing', authenticate, requireRole('admin'), controllerFn)

const AppError = require('../utils/AppError');

function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return next(new AppError(
        'You do not have permission to perform this action.',
        403,
        'FORBIDDEN'
      ));
    }
    next();
  };
}

module.exports = requireRole;
