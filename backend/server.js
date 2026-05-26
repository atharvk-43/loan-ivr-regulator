/**
 * @fileoverview Main Express entry point for the IVR Regulator Backend.
 * Loads environment variables, connects to MongoDB, and registers routes.
 */

const path = require('path');
const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

// Load environment variables from .env file
dotenv.config();

const { connectDB } = require('./config/db');

// Import routes
const authRoutes = require('./routes/auth');
const customerRoutes = require('./routes/customers');
const callRoutes = require('./routes/calls');
const dashboardRoutes = require('./routes/dashboard');
const webhookRoutes = require('./routes/webhooks');

// Initialize MongoDB Connection and auto-seed if empty
connectDB().then(async () => {
  try {
    const Customer = require('./models/Customer');
    const count = await Customer.countDocuments();
    if (count === 0) {
      console.log('📊 Database is empty. Seeding mock customers...');
      const seedDB = require('./seed');
      await seedDB(false);
    } else {
      console.log(`📊 Database has ${count} existing customers.`);
    }
  } catch (err) {
    console.error('❌ Failed to auto-seed database:', err.message);
  }
}).catch(err => {
  console.error('❌ Database connection failed during startup:', err.message);
});

const app = express();

// Security and utility Middlewares
app.use(helmet({
  contentSecurityPolicy: false, // Ensure TwiML and web requests are unrestricted
}));

// CORS Configuration
const allowedOrigins = [
  process.env.FRONTEND_URL || 'http://localhost:5173',
  'https://checkout.stripe.com', // For potential payment additions
];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, or webhooks)
      if (!origin || allowedOrigins.indexOf(origin) !== -1 || origin.includes('ngrok') || origin.includes('localhost') || origin.includes('127.0.0.1')) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS policy'));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// Logging middleware
if (process.env.NODE_ENV === 'development' || !process.env.NODE_ENV) {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// Body parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static assets in production if applicable
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Mount API Routes
app.use('/api/auth', authRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/calls', callRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/webhooks', webhookRoutes); // Unauthenticated webhooks for Twilio callbacks

// Base Status Route
app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'IVR Regulator API is active and running',
    version: '1.0.0',
    env: process.env.NODE_ENV || 'development',
  });
});

// Fallback Route for Undefined Endpoints
app.use((req, res, next) => {
  res.status(404).json({
    success: false,
    message: `Resource not found — ${req.originalUrl}`,
  });
});

// Global Error Handler Middleware
app.use((err, req, res, next) => {
  console.error('❌ Server Error Context:', err.stack || err.message);

  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;

  res.status(statusCode).json({
    success: false,
    message: err.message || 'An unexpected server error occurred',
    // Only return stack traces in development environment
    stack: process.env.NODE_ENV === 'production' ? null : err.stack,
  });
});

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  console.log(`🚀 Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});

// Handle unhandled promise rejections gracefully
process.on('unhandledRejection', (err, promise) => {
  console.error(`❌ Unhandled Rejection Error: ${err.message}`);
  // Close server & exit process
  server.close(() => process.exit(1));
});
