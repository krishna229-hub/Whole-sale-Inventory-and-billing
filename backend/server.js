const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const dotenv = require('dotenv');
const connectDB = async () => {
  const db = require('./config/db');
  await db();
};
const errorHandler = require('./middleware/error');

// Load environment variables
dotenv.config();

// Connect to MongoDB
connectDB();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Dev logging middleware
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Import route files
const authRoutes = require('./routes/authRoutes');
const productRoutes = require('./routes/productRoutes');
const invoiceRoutes = require('./routes/invoiceRoutes');
const customerRoutes = require('./routes/customerRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');

// Mount routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/invoices', invoiceRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/dashboard', dashboardRoutes);

// Health Check Endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({ success: true, message: 'StockPilot Backend API is healthy and running' });
});

// Root Endpoint
app.get('/', (req, res) => {
  res.send('StockPilot API is running. Access resources via /api/...');
});

// Error handling middleware
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});
