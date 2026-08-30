// Employee controller
// Handles employee account creation (by admin, typically) and login.

const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const pool = require('../db');
const AppError = require('../utils/AppError');
const catchAsync = require('../utils/catchAsync');

const SALT_ROUNDS = 10;

const registerEmployee = catchAsync(async (req, res) => {
  const { full_name, phone_number, password } = req.body;

  if (!full_name || typeof full_name !== 'string' || full_name.trim().length < 2) {
    throw new AppError('Please enter a valid full name (at least 2 characters).', 400, 'INVALID_NAME');
  }

  if (!phone_number || typeof phone_number !== 'string') {
    throw new AppError('Phone number is required.', 400, 'MISSING_PHONE');
  }

  if (!password || typeof password !== 'string' || password.length < 6) {
    throw new AppError('Password must be at least 6 characters long.', 400, 'WEAK_PASSWORD');
  }

  const existing = await pool.query(
    'SELECT * FROM employees WHERE phone_number = $1',
    [phone_number]
  );

  if (existing.rows.length > 0) {
    throw new AppError('An employee with this phone number is already registered.', 409, 'DUPLICATE_PHONE');
  }

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

  const result = await pool.query(
    `INSERT INTO employees (full_name, phone_number, password_hash)
     VALUES ($1, $2, $3)
     RETURNING id, full_name, phone_number, status, created_at`,
    [full_name.trim(), phone_number, passwordHash]
  );

  res.status(201).json({
    success: true,
    message: 'Employee registered successfully.',
    employee: result.rows[0],
  });
});

const loginEmployee = catchAsync(async (req, res) => {
  const { phone_number, password } = req.body;

  if (!phone_number || !password) {
    throw new AppError('Phone number and password are required.', 400, 'MISSING_CREDENTIALS');
  }

  const result = await pool.query(
    'SELECT * FROM employees WHERE phone_number = $1',
    [phone_number]
  );

  if (result.rows.length === 0) {
    throw new AppError('Invalid phone number or password.', 401, 'INVALID_CREDENTIALS');
  }

  const employee = result.rows[0];
  const passwordMatches = await bcrypt.compare(password, employee.password_hash);

  if (!passwordMatches) {
    throw new AppError('Invalid phone number or password.', 401, 'INVALID_CREDENTIALS');
  }

  if (!employee.is_active) {
    throw new AppError('This account has been deactivated. Contact your admin.', 403, 'ACCOUNT_DEACTIVATED');
  }

  const token = jwt.sign(
    { id: employee.id, role: 'employee' },
    process.env.JWT_SECRET,
    { expiresIn: '12h' }
  );

  res.status(200).json({
    success: true,
    message: 'Login successful.',
    token,
    employee: {
      id: employee.id,
      full_name: employee.full_name,
      phone_number: employee.phone_number,
      status: employee.status,
    },
  });
});
// GET /api/employees/me
// Protected route — returns the profile of whichever employee is logged in,
// identified via the JWT that auth middleware already verified.
const getMyProfile = catchAsync(async (req, res) => {
  const result = await pool.query(
    'SELECT id, full_name, phone_number, status, created_at FROM employees WHERE id = $1',
    [req.user.id]
  );

  if (result.rows.length === 0) {
    throw new AppError('Employee not found.', 404, 'EMPLOYEE_NOT_FOUND');
  }

  res.status(200).json({
    success: true,
    employee: result.rows[0],
  });
});

module.exports = { registerEmployee, loginEmployee, getMyProfile };
