/**
 * @fileoverview Customer controller for CRUD operations and bulk imports via CSV.
 * Interfaces with Customer and CallLog models, and CSV parsing service.
 */

const Customer = require('../models/Customer');
const CallLog = require('../models/CallLog');
const csvService = require('../services/csvService');

/**
 * @desc    Get all customers with filters, search, and pagination
 * @route   GET /api/customers
 * @access  Private
 */
const getCustomers = async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const skip = (page - 1) * limit;

    const { search, status, callStatus } = req.query;
    const query = {};

    // Apply paymentStatus filter if provided
    if (status) {
      query.paymentStatus = status;
    }

    // Apply callStatus filter if provided
    if (callStatus) {
      query.callStatus = callStatus;
    }

    // Apply text search on name, phone, loanId if search is provided
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
        { loanId: { $regex: search, $options: 'i' } },
      ];
    }

    // Fetch customers
    const customers = await Customer.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    // Get total count for pagination calculations
    const total = await Customer.countDocuments(query);

    res.status(200).json({
      success: true,
      count: customers.length,
      total,
      pages: Math.ceil(total / limit),
      page,
      customers,
    });
  } catch (error) {
    console.error('❌ GetCustomers error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Server error fetching customers list',
    });
  }
};

/**
 * @desc    Get a single customer by ID along with their call history logs
 * @route   GET /api/customers/:id
 * @access  Private
 */
const getCustomerById = async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id);

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found',
      });
    }

    // Fetch call logs related to this customer (newest first)
    const callLogs = await CallLog.find({ customer: customer._id }).sort({
      createdAt: -1,
    });

    res.status(200).json({
      success: true,
      customer,
      callLogs,
    });
  } catch (error) {
    console.error('❌ GetCustomerById error:', error.message);
    if (error.kind === 'ObjectId') {
      return res.status(404).json({
        success: false,
        message: 'Customer not found',
      });
    }
    res.status(500).json({
      success: false,
      message: 'Server error retrieving customer profile details',
    });
  }
};

/**
 * @desc    Manually create a new customer record
 * @route   POST /api/customers
 * @access  Private
 */
const createCustomer = async (req, res) => {
  try {
    const { name, phone, loanId, dueAmount, dueDate } = req.body;

    // Check for required inputs
    if (!name || !phone || !loanId || dueAmount === undefined || !dueDate) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields (name, phone, loanId, dueAmount, dueDate)',
      });
    }

    // Normalize phone number
    const normalizedPhone = csvService.normalizePhoneNumber(phone);

    // Check if phone or loanId already exists
    const phoneExists = await Customer.findOne({ phone: normalizedPhone });
    if (phoneExists) {
      return res.status(400).json({
        success: false,
        message: `Customer with phone number ${normalizedPhone} already exists`,
      });
    }

    const loanExists = await Customer.findOne({ loanId: loanId.toUpperCase() });
    if (loanExists) {
      return res.status(400).json({
        success: false,
        message: `Customer with Loan ID ${loanId.toUpperCase()} already exists`,
      });
    }

    // Create record
    const customer = await Customer.create({
      name,
      phone: normalizedPhone,
      loanId: loanId.toUpperCase(),
      dueAmount,
      dueDate,
      createdBy: req.user._id,
    });

    res.status(201).json({
      success: true,
      customer,
    });
  } catch (error) {
    console.error('❌ CreateCustomer error:', error.message);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error creating customer',
    });
  }
};

/**
 * @desc    Update a customer record
 * @route   PUT /api/customers/:id
 * @access  Private
 */
const updateCustomer = async (req, res) => {
  try {
    const { name, phone, loanId, dueAmount, dueDate, paymentStatus, promisedPaymentDate, callbackRequested } = req.body;

    let customer = await Customer.findById(req.params.id);

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found',
      });
    }

    // If updating phone, normalize and ensure uniqueness
    let normalizedPhone = customer.phone;
    if (phone && phone !== customer.phone) {
      normalizedPhone = csvService.normalizePhoneNumber(phone);
      const phoneExists = await Customer.findOne({ phone: normalizedPhone });
      if (phoneExists) {
        return res.status(400).json({
          success: false,
          message: `Phone number ${normalizedPhone} is already in use by another customer`,
        });
      }
    }

    // If updating loanId, ensure uniqueness
    if (loanId && loanId.toUpperCase() !== customer.loanId) {
      const loanExists = await Customer.findOne({ loanId: loanId.toUpperCase() });
      if (loanExists) {
        return res.status(400).json({
          success: false,
          message: `Loan ID ${loanId.toUpperCase()} is already in use by another customer`,
        });
      }
    }

    // Gather updates
    const updates = {
      name: name || customer.name,
      phone: normalizedPhone,
      loanId: loanId ? loanId.toUpperCase() : customer.loanId,
      dueAmount: dueAmount !== undefined ? dueAmount : customer.dueAmount,
      dueDate: dueDate || customer.dueDate,
      paymentStatus: paymentStatus || customer.paymentStatus,
      promisedPaymentDate: promisedPaymentDate !== undefined ? promisedPaymentDate : customer.promisedPaymentDate,
      callbackRequested: callbackRequested !== undefined ? callbackRequested : customer.callbackRequested,
    };

    // If status changes to paid, adjust overdue status etc
    if (paymentStatus === 'paid') {
      updates.promisedPaymentDate = null;
    }

    customer = await Customer.findByIdAndUpdate(req.params.id, updates, {
      new: true,
      runValidators: true,
    });

    res.status(200).json({
      success: true,
      customer,
    });
  } catch (error) {
    console.error('❌ UpdateCustomer error:', error.message);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error updating customer profile',
    });
  }
};

/**
 * @desc    Delete a customer record and their associated call logs
 * @route   DELETE /api/customers/:id
 * @access  Private
 */
const deleteCustomer = async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id);

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found',
      });
    }

    // Remove associated call logs first
    await CallLog.deleteMany({ customer: customer._id });

    // Remove the customer
    await customer.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Customer and all associated call logs deleted successfully',
    });
  } catch (error) {
    console.error('❌ DeleteCustomer error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Server error deleting customer record',
    });
  }
};

/**
 * @desc    Bulk import customers from CSV file
 * @route   POST /api/customers/import
 * @access  Private
 */
const importCustomers = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Please upload a CSV file',
      });
    }

    // Parse CSV buffer
    const { customers: parsedCustomers, errors: parsedErrors } = await csvService.parseCSV(
      req.file.buffer
    );

    if (parsedCustomers.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'CSV file contains no valid customer rows',
        errors: parsedErrors,
      });
    }

    const imported = [];
    const duplicates = [];
    const saveErrors = [];

    // Loop through each parsed customer and try to write to db
    for (const cData of parsedCustomers) {
      try {
        // Check if phone or loanId already exists
        const existingCustomer = await Customer.findOne({
          $or: [{ phone: cData.phone }, { loanId: cData.loanId }],
        });

        if (existingCustomer) {
          duplicates.push({
            name: cData.name,
            phone: cData.phone,
            loanId: cData.loanId,
            reason: existingCustomer.phone === cData.phone ? 'Phone already exists' : 'Loan ID already exists',
          });
          continue;
        }

        // Save new customer
        const newCust = await Customer.create({
          ...cData,
          createdBy: req.user._id,
        });

        imported.push(newCust);
      } catch (err) {
        saveErrors.push({
          name: cData.name,
          error: err.message,
        });
      }
    }

    res.status(200).json({
      success: true,
      summary: {
        totalRows: parsedCustomers.length + parsedErrors.length,
        validRows: parsedCustomers.length,
        invalidRows: parsedErrors.length,
        imported: imported.length,
        duplicates: duplicates.length,
        errors: saveErrors.length,
      },
      importedCount: imported.length,
      errors: parsedErrors,
      duplicates,
      saveErrors,
    });
  } catch (error) {
    console.error('❌ ImportCustomers error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Server error parsing and importing CSV customer data',
    });
  }
};

module.exports = {
  getCustomers,
  getCustomerById,
  createCustomer,
  updateCustomer,
  deleteCustomer,
  importCustomers,
};
