/**
 * @fileoverview User model for admin/agent authentication.
 * Handles password hashing and comparison via bcryptjs.
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

/**
 * User Schema
 * @typedef {Object} User
 * @property {string} name - Full name of the user
 * @property {string} email - Unique email address (stored lowercase)
 * @property {string} password - Hashed password (min 6 chars before hashing)
 * @property {string} role - User role: 'admin' or 'agent'
 * @property {Date} createdAt - Account creation timestamp
 */
const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    maxlength: [100, 'Name cannot exceed 100 characters'],
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
      'Please provide a valid email address',
    ],
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters'],
    select: false, // Don't return password by default in queries
  },
  role: {
    type: String,
    enum: {
      values: ['admin', 'agent'],
      message: 'Role must be either admin or agent',
    },
    default: 'admin',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

/**
 * Pre-save middleware: Hash password before saving to the database.
 * Only hashes if the password field has been modified (avoids re-hashing on updates).
 */
userSchema.pre('save', async function (next) {
  // Skip hashing if password hasn't been modified
  if (!this.isModified('password')) {
    return next();
  }

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

/**
 * Instance method: Compare a plain-text password with the stored hash.
 * @param {string} enteredPassword - The plain-text password to verify
 * @returns {Promise<boolean>} True if passwords match, false otherwise
 */
userSchema.methods.matchPassword = async function (enteredPassword) {
  return bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
