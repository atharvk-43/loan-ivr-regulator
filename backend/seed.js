/**
 * @fileoverview Database seeding script.
 * Populates MongoDB with 20 sample customers with varied loan amounts,
 * payment statuses, call statuses, transcripts, and AI summaries.
 */

const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Customer = require('./models/Customer');
const CallLog = require('./models/CallLog');
const User = require('./models/User');

// Load environment variables
dotenv.config();

const mockCustomers = [
  {
    name: 'Sarah Connor',
    phone: '+15550100100',
    loanId: 'LN-2026-9081',
    dueAmount: 1250.0,
    dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // due in 5 days
    paymentStatus: 'pending',
    callStatus: 'none',
    callAttempts: 0,
  },
  {
    name: 'Bruce Wayne',
    phone: '+15550200200',
    loanId: 'LN-2026-1122',
    dueAmount: 50000.0,
    dueDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // overdue by 3 days
    paymentStatus: 'overdue',
    callStatus: 'failed',
    callAttempts: 2,
    transcript: 'System: Hello, this is an automated reminder... \nCustomer: *hangs up*\n',
    aiSummary: {
      summary: 'Call disconnected by customer shortly after greeting. Customer did not cooperate.',
      sentiment: 'negative',
      repaymentLikelihood: 'low',
      escalationRecommended: true,
    },
  },
  {
    name: 'Peter Parker',
    phone: '+15550300300',
    loanId: 'LN-2026-5544',
    dueAmount: 150.0,
    dueDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000), // due in 10 days
    paymentStatus: 'paid',
    callStatus: 'none',
    callAttempts: 0,
  },
  {
    name: 'Clark Kent',
    phone: '+15550400400',
    loanId: 'LN-2026-8877',
    dueAmount: 850.0,
    dueDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
    paymentStatus: 'promised',
    promisedPaymentDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // promised in 2 days
    callbackRequested: false,
    callStatus: 'completed',
    callAttempts: 1,
    transcript:
      'System: Hello, this is an automated reminder regarding your loan payment of 850 dollars. Have you already paid your EMI?\n' +
      'Customer: No, I have not paid it yet.\n' +
      'System: When are you planning to make the payment?\n' +
      'Customer: I will pay it this Friday, definitely.\n' +
      'System: Would you like a callback from an agent?\n' +
      'Customer: No, that is fine.\n' +
      'System: Thank you for your time. Goodbye.\n',
    aiSummary: {
      summary: 'Customer has not paid yet. Promised to make the payment this Friday. Declined agent callback.',
      sentiment: 'neutral',
      repaymentLikelihood: 'high',
      escalationRecommended: false,
    },
  },
  {
    name: 'Tony Stark',
    phone: '+15550500500',
    loanId: 'LN-2026-3300',
    dueAmount: 15000.0,
    dueDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
    paymentStatus: 'paid_pending_verification',
    callStatus: 'completed',
    callAttempts: 1,
    transcript:
      'System: Hello, this is an automated reminder regarding your loan payment of 15,000 dollars. Have you already paid your EMI?\n' +
      'Customer: Yes, I transferred the funds this morning.\n' +
      'System: Thank you for confirming your payment. We will verify it shortly. Have a good day.\n',
    aiSummary: {
      summary: 'Customer stated they already made the bank transfer this morning. Status shifted to pending verification.',
      sentiment: 'positive',
      repaymentLikelihood: 'high',
      escalationRecommended: false,
    },
  },
  {
    name: 'Natasha Romanoff',
    phone: '+15550600600',
    loanId: 'LN-2026-6677',
    dueAmount: 2200.0,
    dueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
    paymentStatus: 'pending',
    callStatus: 'none',
    callAttempts: 0,
  },
  {
    name: 'Steve Rogers',
    phone: '+15550700700',
    loanId: 'LN-2026-1776',
    dueAmount: 450.0,
    dueDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    paymentStatus: 'overdue',
    callStatus: 'no-answer',
    callAttempts: 3,
  },
  {
    name: 'Wanda Maximoff',
    phone: '+15550800800',
    loanId: 'LN-2026-4455',
    dueAmount: 3100.0,
    dueDate: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
    paymentStatus: 'promised',
    promisedPaymentDate: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000),
    callbackRequested: true,
    callStatus: 'completed',
    callAttempts: 1,
    transcript:
      'System: Hello, this is an automated reminder... Have you already paid your EMI?\n' +
      'Customer: No, I am having technical issues with my bank account.\n' +
      'System: When are you planning to make the payment?\n' +
      'Customer: Next week Monday.\n' +
      'System: Would you like a callback from an agent?\n' +
      'Customer: Yes please, that would be very helpful.\n' +
      'System: Thank you for your time. Goodbye.\n',
    aiSummary: {
      summary: 'Customer faces bank issues. Promised payment next Monday and explicitly requested agent callback support.',
      sentiment: 'neutral',
      repaymentLikelihood: 'medium',
      escalationRecommended: true,
    },
  },
  {
    name: 'Barry Allen',
    phone: '+15550900900',
    loanId: 'LN-2026-9911',
    dueAmount: 50.0,
    dueDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
    paymentStatus: 'pending',
    callStatus: 'none',
    callAttempts: 0,
  },
  {
    name: 'Diana Prince',
    phone: '+15551001000',
    loanId: 'LN-2026-1010',
    dueAmount: 7500.0,
    dueDate: new Date(Date.now() + 8 * 24 * 60 * 60 * 1000),
    paymentStatus: 'paid',
    callStatus: 'none',
    callAttempts: 0,
  },
  {
    name: 'Arthur Curry',
    phone: '+15551101100',
    loanId: 'LN-2026-2233',
    dueAmount: 1800.0,
    dueDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
    paymentStatus: 'overdue',
    callStatus: 'busy',
    callAttempts: 4,
  },
  {
    name: 'Hal Jordan',
    phone: '+15551201200',
    loanId: 'LN-2026-4499',
    dueAmount: 950.0,
    dueDate: new Date(Date.now() + 12 * 24 * 60 * 60 * 1000),
    paymentStatus: 'pending',
    callStatus: 'none',
    callAttempts: 0,
  },
  {
    name: 'Oliver Queen',
    phone: '+15551301300',
    loanId: 'LN-2026-0001',
    dueAmount: 12000.0,
    dueDate: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000),
    paymentStatus: 'promised',
    promisedPaymentDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
    callbackRequested: false,
    callStatus: 'completed',
    callAttempts: 1,
    transcript: 'System: Hello... Have you paid? Customer: No. System: When will you pay? Customer: Tomorrow. System: Callback? Customer: No.',
    aiSummary: {
      summary: 'Customer promised payment by tomorrow. Declined callback.',
      sentiment: 'positive',
      repaymentLikelihood: 'high',
      escalationRecommended: false,
    },
  },
  {
    name: 'John Constantine',
    phone: '+15551401400',
    loanId: 'LN-2026-6666',
    dueAmount: 666.0,
    dueDate: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
    paymentStatus: 'overdue',
    callStatus: 'completed',
    callAttempts: 2,
    transcript:
      'System: Hello... Have you paid your EMI?\n' +
      'Customer: No, and I do not intend to pay you people. Stop calling me!\n' +
      'System: When are you planning to make the payment?\n' +
      'Customer: Never! *screams and hangs up*\n',
    aiSummary: {
      summary: 'Customer was extremely hostile, screamed, refused to make payment and hung up. Escalation is highly recommended.',
      sentiment: 'hostile',
      repaymentLikelihood: 'low',
      escalationRecommended: true,
    },
  },
  {
    name: 'Selina Kyle',
    phone: '+15551501500',
    loanId: 'LN-2026-9988',
    dueAmount: 3500.0,
    dueDate: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000),
    paymentStatus: 'overdue',
    callStatus: 'completed',
    callAttempts: 5,
    transcript: 'System: Hello... Have you paid? Customer: Yes. System: Thank you...',
    aiSummary: {
      summary: 'Customer stated EMI is already settled. Awaiting accounting verification.',
      sentiment: 'neutral',
      repaymentLikelihood: 'medium',
      escalationRecommended: false,
    },
  },
  {
    name: 'Victor Stone',
    phone: '+15551601600',
    loanId: 'LN-2026-7788',
    dueAmount: 4500.0,
    dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
    paymentStatus: 'pending',
    callStatus: 'none',
    callAttempts: 0,
  },
  {
    name: 'Lex Luthor',
    phone: '+15551701700',
    loanId: 'LN-2026-9999',
    dueAmount: 250000.0,
    dueDate: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000),
    paymentStatus: 'pending',
    callStatus: 'none',
    callAttempts: 0,
  },
  {
    name: 'Lois Lane',
    phone: '+15551801800',
    loanId: 'LN-2026-4444',
    dueAmount: 600.0,
    dueDate: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000),
    paymentStatus: 'overdue',
    callStatus: 'none',
    callAttempts: 0,
  },
  {
    name: 'Peter Parker',
    phone: '+15551901900',
    loanId: 'LN-2026-1234',
    dueAmount: 320.0,
    dueDate: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000),
    paymentStatus: 'pending',
    callStatus: 'none',
    callAttempts: 0,
  },
  {
    name: 'Carol Danvers',
    phone: '+15552002000',
    loanId: 'LN-2026-7777',
    dueAmount: 8000.0,
    dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    paymentStatus: 'pending',
    callStatus: 'none',
    callAttempts: 0,
  },
];

const seedDB = async (shouldExit = false) => {
  try {
    console.log('🌱 Starting database seeding...');
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGO_URI);
      console.log('✅ Connected to MongoDB for seeding');
    } else {
      console.log('✅ Already connected to MongoDB, seeding data...');
    }

    // Remove existing customers and call logs
    await Customer.deleteMany({});
    await CallLog.deleteMany({});
    console.log('🧹 Cleared existing customers and call logs');

    // Try to find a default user to set as creator, or create one
    let adminUser = await User.findOne({ role: 'admin' });
    if (!adminUser) {
      console.log('👤 No admin user found. Creating a default "admin@regulator.com" user');
      adminUser = await User.create({
        name: 'System Admin',
        email: 'admin@regulator.com',
        password: 'password123', // Will be hashed automatically by userSchema pre-save hook
        role: 'admin',
      });
      console.log('✅ Default admin user created successfully');
    }

    // Insert mock customers
    const customersWithUser = mockCustomers.map((cust) => ({
      ...cust,
      createdBy: adminUser._id,
    }));

    const seededCustomers = await Customer.insertMany(customersWithUser);
    console.log(`✅ Successfully seeded ${seededCustomers.length} customers`);

    // Insert corresponding CallLog entries for customers who have call logs
    const callLogs = [];
    seededCustomers.forEach((cust) => {
      if (cust.callAttempts > 0) {
        // Construct some realistic logs
        for (let i = 0; i < cust.callAttempts; i++) {
          const isLatest = i === cust.callAttempts - 1;
          const status = isLatest ? cust.callStatus : 'no-answer';

          const tempDate = new Date(cust.createdAt || Date.now());
          tempDate.setHours(tempDate.getHours() - (cust.callAttempts - i) * 24);

          callLogs.push({
            customer: cust._id,
            callSid: `CA${Math.random().toString(36).substring(2, 17).toUpperCase()}`,
            status: status,
            duration: status === 'completed' ? 45 + Math.floor(Math.random() * 30) : 0,
            transcript: isLatest ? cust.transcript : 'System: Calling borrower... Call timed out.',
            aiSummary: isLatest ? cust.aiSummary : undefined,
            recordingUrl: status === 'completed' ? 'https://api.twilio.com/2010-04-01/Accounts/ACmock/Recordings/REmock.mp3' : undefined,
            dtmfInputs: isLatest && cust.aiSummary ? ['2', '2'] : [],
            speechInputs: isLatest && cust.aiSummary ? ['next week', 'no callback'] : [],
            startedAt: tempDate,
            endedAt: new Date(tempDate.getTime() + 60 * 1000),
            createdAt: tempDate,
          });
        }
      }
    });

    if (callLogs.length > 0) {
      const seededLogs = await CallLog.insertMany(callLogs);
      console.log(`✅ Successfully seeded ${seededLogs.length} call history logs`);
    }

    console.log('🎉 Database seeding complete!');
    if (shouldExit) {
      process.exit(0);
    }
  } catch (error) {
    console.error('❌ Seeding error:', error.message);
    if (shouldExit) {
      process.exit(1);
    }
    throw error;
  }
};

if (require.main === module) {
  seedDB(true);
}

module.exports = seedDB;
