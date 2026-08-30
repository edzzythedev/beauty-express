// Customer controller
// Handles customer registration with proper validation and structured errors.

const pool = require('../db');
const AppError = require('../utils/AppError');
const catchAsync = require('../utils/catchAsync');

// Basic Kenyan phone number validation: accepts formats like
// 0712345678, 254712345678, +254712345678
function isValidPhoneNumber(phone) {
  const cleaned = phone.replace(/\s+/g, '');
  return /^(?:\+?254|0)[17]\d{8}$/.test(cleaned);
}

// POST /api/customers/register
const registerCustomer = catchAsync(async (req, res) => {
  const { full_name, phone_number } = req.body;

  if (!full_name || typeof full_name !== 'string' || full_name.trim().length < 2) {
    throw new AppError(
      'Please enter a valid full name (at least 2 characters).',
      400,
      'INVALID_NAME'
    );
  }

  if (!phone_number || typeof phone_number !== 'string') {
    throw new AppError(
      'Phone number is required.',
      400,
      'MISSING_PHONE'
    );
  }

  if (!isValidPhoneNumber(phone_number)) {
    throw new AppError(
      'Please enter a valid Kenyan phone number, e.g. 0712345678.',
      400,
      'INVALID_PHONE_FORMAT'
    );
  }

  const existing = await pool.query(
    'SELECT * FROM customers WHERE phone_number = $1',
    [phone_number]
  );

  if (existing.rows.length > 0) {
    throw new AppError(
      'This phone number is already registered. Please log in instead.',
      409,
      'DUPLICATE_PHONE'
    );
  }

  const result = await pool.query(
    `INSERT INTO customers (full_name, phone_number)
     VALUES ($1, $2)
     RETURNING *`,
    [full_name.trim(), phone_number]
  );

  res.status(201).json({
    success: true,
    message: 'Registration successful.',
    customer: result.rows[0],
  });
});

module.exports = { registerCustomer };
