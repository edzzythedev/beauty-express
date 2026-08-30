// Customer controller
// Handles the logic for customer-related actions (registration, lookup, etc.)

const pool = require('../db');

// POST /api/customers/register
async function registerCustomer(req, res) {
  const { full_name, phone_number } = req.body;

  if (!full_name || !phone_number) {
    return res.status(400).json({
      error: 'full_name and phone_number are required',
    });
  }

  try {
    const existing = await pool.query(
      'SELECT * FROM customers WHERE phone_number = $1',
      [phone_number]
    );

    if (existing.rows.length > 0) {
      return res.status(200).json({
        message: 'Customer already registered',
        customer: existing.rows[0],
      });
    }

    const result = await pool.query(
      `INSERT INTO customers (full_name, phone_number)
       VALUES ($1, $2)
       RETURNING *`,
      [full_name, phone_number]
    );

    return res.status(201).json({
      message: 'Customer registered successfully',
      customer: result.rows[0],
    });
  } catch (err) {
    console.error('Error registering customer:', err);
    return res.status(500).json({ error: 'Something went wrong' });
  }
}

module.exports = { registerCustomer };
