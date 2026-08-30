// Beauty Express — Backend Entry Point
// This is a minimal starting server. Routes for bookings, employees,
// payments, and auth will be added as separate files under src/routes/.

require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

// Health check route — confirms the server is alive
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Beauty Express backend is running' });
});

// Future routes will be mounted here, e.g.:
app.use('/api/customers', require('./routes/customerRoutes'));
app.use('/api/employees', require('./routes/employeeRoutes'));
app.use('/api/admins', require('./routes/adminRoutes'));
// app.use('/api/bookings', require('./routes/bookings'));
// app.use('/api/employees', require('./routes/employees'));
// app.use('/api/customers', require('./routes/customers'));
const errorHandler = require('./middleware/errorHandler');
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Beauty Express backend running on http://localhost:${PORT}`);
});
