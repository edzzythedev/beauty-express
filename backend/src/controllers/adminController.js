// Admin controller
// Handles admin account creation and login. In production, admin
// registration should be locked down (e.g. only one admin, created once
// via a setup script) rather than open — but for now we keep it open
// for testing, same as we did with employees.

const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const pool = require('../db');
const AppError = require('../utils/AppError');
const catchAsync = require('../utils/catchAsync');

const SALT_ROUNDS = 10;

const registerAdmin = catchAsync(async (req, res) => {
  const { full_name, phone_number, email, password } = req.body;

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
    'SELECT * FROM admins WHERE phone_number = $1',
    [phone_number]
  );

  if (existing.rows.length > 0) {
    throw new AppError('An admin with this phone number is already registered.', 409, 'DUPLICATE_PHONE');
  }

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

  const result = await pool.query(
    `INSERT INTO admins (full_name, phone_number, email, password_hash)
     VALUES ($1, $2, $3, $4)
     RETURNING id, full_name, phone_number, email, created_at`,
    [full_name.trim(), phone_number, email || null, passwordHash]
  );

  res.status(201).json({
    success: true,
    message: 'Admin registered successfully.',
    admin: result.rows[0],
  });
});

const loginAdmin = catchAsync(async (req, res) => {
  const { phone_number, password } = req.body;

  if (!phone_number || !password) {
    throw new AppError('Phone number and password are required.', 400, 'MISSING_CREDENTIALS');
  }

  const result = await pool.query(
    'SELECT * FROM admins WHERE phone_number = $1',
    [phone_number]
  );

  if (result.rows.length === 0) {
    throw new AppError('Invalid phone number or password.', 401, 'INVALID_CREDENTIALS');
  }

  const admin = result.rows[0];
  const passwordMatches = await bcrypt.compare(password, admin.password_hash);

  if (!passwordMatches) {
    throw new AppError('Invalid phone number or password.', 401, 'INVALID_CREDENTIALS');
  }

  const token = jwt.sign(
    { id: admin.id, role: 'admin' },
    process.env.JWT_SECRET,
    { expiresIn: '12h' }
  );

  res.status(200).json({
    success: true,
    message: 'Login successful.',
    token,
    admin: {
      id: admin.id,
      full_name: admin.full_name,
      phone_number: admin.phone_number,
      email: admin.email,
    },
  });
});

module.exports = { registerAdmin, loginAdmin };
