/**
 * @fileoverview Call controller for triggering Twilio outbound voice calls and viewing call logs.
 * Interfaces with Twilio integration services and database models.
 */

const Customer = require('../models/Customer');
const CallLog = require('../models/CallLog');
const twilioService = require('../services/twilioService');

/**
 * @desc    Initiate an outbound IVR call to a customer
 * @route   POST /api/calls/start/:customerId
 * @access  Private
 */
const startCall = async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.customerId);

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found',
      });
    }

    // Check if phone number is valid format
    if (!customer.phone || customer.phone.length < 7) {
      return res.status(400).json({
        success: false,
        message: 'Customer has an invalid phone number',
      });
    }

    console.log(`🚀 Starting outbound IVR call to customer: ${customer.name} (${customer.phone})`);

    // Place the outbound call via Twilio
    const twilioCall = await twilioService.initiateCall(customer);

    // Update customer call state fields
    customer.callSid = twilioCall.callSid;
    customer.callStatus = 'initiated';
    customer.callAttempts = (customer.callAttempts || 0) + 1;
    customer.lastCallDate = new Date();
    await customer.save();

    // Create an initial placeholder call log
    await CallLog.create({
      customer: customer._id,
      callSid: twilioCall.callSid,
      status: 'initiated',
      startedAt: new Date(),
    });

    res.status(200).json({
      success: true,
      message: `Outbound IVR call initiated successfully. Call SID: ${twilioCall.callSid}`,
      callSid: twilioCall.callSid,
      customer,
    });
  } catch (error) {
    console.error('❌ StartCall error:', error.message);
    res.status(500).json({
      success: false,
      message: `Failed to start call: ${error.message}`,
    });
  }
};

/**
 * @desc    Retry a failed or missed outbound IVR call
 * @route   POST /api/calls/retry/:customerId
 * @access  Private
 */
const retryCall = async (req, res) => {
  // Retrying is fundamentally initiating another call. We can reuse the startCall function logic.
  return startCall(req, res);
};

/**
 * @desc    Get all call logs (global call history) with pagination
 * @route   GET /api/calls/history
 * @access  Private
 */
const getCallHistory = async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const skip = (page - 1) * limit;
    const { status, customerId } = req.query;

    const query = {};

    if (status) {
      query.status = status;
    }

    if (customerId) {
      query.customer = customerId;
    }

    // Fetch logs populated with basic customer details
    const logs = await CallLog.find(query)
      .populate('customer', 'name phone loanId dueAmount paymentStatus')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await CallLog.countDocuments(query);

    res.status(200).json({
      success: true,
      count: logs.length,
      total,
      pages: Math.ceil(total / limit),
      page,
      logs,
    });
  } catch (error) {
    console.error('❌ GetCallHistory error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Server error retrieving call history logs',
    });
  }
};

/**
 * @desc    Get call logs for a specific customer
 * @route   GET /api/calls/:customerId/logs
 * @access  Private
 */
const getCustomerLogs = async (req, res) => {
  try {
    const logs = await CallLog.find({ customer: req.params.customerId }).sort({
      createdAt: -1,
    });

    res.status(200).json({
      success: true,
      count: logs.length,
      logs,
    });
  } catch (error) {
    console.error('❌ GetCustomerLogs error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Server error fetching customer call records',
    });
  }
};

module.exports = {
  startCall,
  retryCall,
  getCallHistory,
  getCustomerLogs,
};
