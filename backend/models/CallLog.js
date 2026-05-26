/**
 * @fileoverview CallLog model for tracking individual call attempts and their outcomes.
 * Each call attempt to a customer creates a new CallLog entry.
 */

const mongoose = require('mongoose');

/**
 * CallLog Schema
 * @typedef {Object} CallLog
 * @property {ObjectId} customer - Reference to the Customer document
 * @property {string} callSid - Twilio Call SID
 * @property {string} status - Final call status
 * @property {number} duration - Call duration in seconds
 * @property {string} transcript - Full call transcript
 * @property {Object} aiSummary - AI-generated call summary and analysis
 * @property {string} recordingUrl - URL to the call recording
 * @property {string[]} dtmfInputs - Array of DTMF digits pressed during the call
 * @property {string[]} speechInputs - Array of speech-to-text results during the call
 * @property {Date} startedAt - When the call was initiated
 * @property {Date} endedAt - When the call ended
 */
const callLogSchema = new mongoose.Schema(
  {
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Customer',
      required: [true, 'Customer reference is required'],
      index: true,
    },
    callSid: {
      type: String,
      default: '',
      index: true,
    },
    status: {
      type: String,
      required: [true, 'Call status is required'],
      enum: [
        'initiated',
        'ringing',
        'in-progress',
        'answered',
        'failed',
        'completed',
        'no-answer',
        'busy',
        'canceled',
      ],
    },
    duration: {
      type: Number,
      default: 0,
      min: 0,
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
    recordingUrl: {
      type: String,
      default: '',
    },
    dtmfInputs: {
      type: [String],
      default: [],
    },
    speechInputs: {
      type: [String],
      default: [],
    },
    startedAt: {
      type: Date,
      default: null,
    },
    endedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true, // Adds createdAt automatically
  }
);

// Compound index for efficient lookups
callLogSchema.index({ customer: 1, createdAt: -1 });
callLogSchema.index({ status: 1, createdAt: -1 });

module.exports = mongoose.model('CallLog', callLogSchema);
