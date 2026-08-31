// Employee routes
const express = require('express');
const router = express.Router();
const { registerEmployee, loginEmployee, getMyProfile } = require('../controllers/employeeController');
const authenticate = require('../middleware/auth');
const requireRole = require('../middleware/requireRole');

// Only admins can create new employee accounts
router.post('/register', authenticate, requireRole('admin'), registerEmployee);

router.post('/login', loginEmployee);
router.get('/me', authenticate, getMyProfile);

module.exports = router;
