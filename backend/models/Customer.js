/**
 * @fileoverview Customer model representing loan borrowers.
 * Stores customer details, payment status, call state, transcript, and AI analysis.
 */

const mongoose = require('mongoose');

/**
 * Customer Schema
 * @typedef {Object} Customer
 * @property {string} name - Customer full name
 * @property {string} phone - Phone number (unique, E.164 format recommended)
 * @property {string} loanId - Unique loan identifier
 * @property {number} dueAmount - Amount due for current EMI
 * @property {Date} dueDate - EMI due date
 * @property {string} paymentStatus - Current payment status
 * @property {Date} promisedPaymentDate - Date customer promised to pay (if applicable)
 * @property {boolean} callbackRequested - Whether customer requested agent callback
 * @property {string} transcript - Full call transcript
 * @property {Object} aiSummary - AI-generated call analysis
 * @property {string} callStatus - Current IVR call status
 * @property {string} callRecordingUrl - URL to call recording
 * @property {Date} lastCallDate - Timestamp of the most recent call
 * @property {number} callAttempts - Total number of call attempts
 * @property {string} callSid - Twilio Call SID for the current/latest call
 * @property {ObjectId} createdBy - Reference to the User who created this record
 */
const customerSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Customer name is required'],
      trim: true,
      maxlength: [150, 'Name cannot exceed 150 characters'],
    },
    phone: {
      type: String,
      required: [true, 'Phone number is required'],
      unique: true,
      trim: true,
      match: [
        /^\+?[1-9]\d{6,14}$/,
        'Please provide a valid phone number (E.164 format recommended)',
      ],
    },
    loanId: {
      type: String,
      required: [true, 'Loan ID is required'],
      unique: true,
      trim: true,
      uppercase: true,
    },
    dueAmount: {
      type: Number,
      required: [true, 'Due amount is required'],
      min: [0, 'Due amount cannot be negative'],
    },
    dueDate: {
      type: Date,
      required: [true, 'Due date is required'],
    },
    paymentStatus: {
      type: String,
      enum: {
        values: ['pending', 'paid', 'overdue', 'promised', 'paid_pending_verification'],
        message: 'Invalid payment status: {VALUE}',
      },
      default: 'pending',
    },
    promisedPaymentDate: {
      type: Date,
      default: null,
    },
    callbackRequested: {
      type: Boolean,
      default: false,
    },
    transcript: {
      type: String,
      default: '',
    },
    aiSummary: {
      summary: { type: String, default: '' },
      sentiment: { type: String, default: '' },
      repaymentLikelihood: { type: String, default: '' },
      escalationRecommended: { type: Boolean, default: false },
    },
    callStatus: {
      type: String,
      enum: {
        values: [
          'none',
          'initiated',
          'ringing',
          'in-progress',
          'answered',
          'failed',
          'completed',
          'no-answer',
          'busy',
        ],
        message: 'Invalid call status: {VALUE}',
      },
      default: 'none',
    },
    callRecordingUrl: {
      type: String,
      default: '',
    },
    lastCallDate: {
      type: Date,
      default: null,
    },
    callAttempts: {
      type: Number,
      default: 0,
      min: 0,
    },
    callSid: {
      type: String,
      default: '',
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true, // Adds createdAt and updatedAt automatically
  }
);

// Index for common query patterns
customerSchema.index({ paymentStatus: 1 });
customerSchema.index({ callStatus: 1 });
customerSchema.index({ dueDate: 1 });
customerSchema.index({ name: 'text', loanId: 'text', phone: 'text' });

module.exports = mongoose.model('Customer', customerSchema);
