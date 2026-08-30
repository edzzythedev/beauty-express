// Employee routes
const express = require('express');
const router = express.Router();
const { registerEmployee, loginEmployee, getMyProfile } = require('../controllers/employeeController');
const authenticate = require('../middleware/auth');

router.post('/register', registerEmployee);
router.post('/login', loginEmployee);
router.get('/me', authenticate, getMyProfile);

module.exports = router;
