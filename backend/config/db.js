/**
 * @fileoverview MongoDB Atlas connection configuration using Mongoose.
 * Establishes and manages the database connection with retry logic.
 * Falls back to an in-memory database if MONGO_URI is not set.
 */

const mongoose = require('mongoose');

let mongoServer = null;

/**
 * Connect to MongoDB Atlas or In-Memory fallback.
 * Uses the MONGO_URI from environment variables.
 * Exits the process on connection failure in production.
 * @returns {Promise<void>}
 */
const connectDB = async () => {
  try {
    let mongoUri = process.env.MONGO_URI;

    if (!mongoUri) {
      console.log('⚠️  MONGO_URI is empty. Setting up local in-memory MongoDB server...');
      const { MongoMemoryServer } = require('mongodb-memory-server');
      mongoServer = await MongoMemoryServer.create();
      mongoUri = mongoServer.getUri();
      console.log(`🤖 In-memory MongoDB Server started at: ${mongoUri}`);
      
      // Inject into process.env so other scripts can read it if needed
      process.env.MONGO_URI = mongoUri;
    }

    const conn = await mongoose.connect(mongoUri, {});

    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);

    // Handle connection errors after initial connection
    mongoose.connection.on('error', (err) => {
      console.error(`❌ MongoDB connection error: ${err.message}`);
    });

    mongoose.connection.on('disconnected', () => {
      console.warn('⚠️  MongoDB disconnected. Attempting reconnection...');
    });

    mongoose.connection.on('reconnected', () => {
      console.log('✅ MongoDB reconnected successfully.');
    });
  } catch (error) {
    console.error(`❌ MongoDB connection failed: ${error.message}`);
    // Exit process with failure code in production
    if (process.env.NODE_ENV === 'production') {
      process.exit(1);
    }
    throw error;
  }
};

/**
 * Stop the in-memory database server if it exists.
 */
const disconnectDB = async () => {
  try {
    await mongoose.disconnect();
    if (mongoServer) {
      await mongoServer.stop();
      console.log('🤖 In-memory MongoDB Server stopped.');
    }
  } catch (error) {
    console.error(`❌ Error disconnecting MongoDB: ${error.message}`);
  }
};

module.exports = { connectDB, disconnectDB };

