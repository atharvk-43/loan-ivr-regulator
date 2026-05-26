/**
 * @fileoverview Twilio Voice API service for initiating outbound IVR calls.
 * Manages the Twilio client and provides call initiation and TwiML generation.
 */

const twilio = require('twilio');

// Twilio VoiceResponse for generating TwiML
const VoiceResponse = twilio.twiml.VoiceResponse;

/**
 * Get an initialized Twilio client instance.
 * Uses TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN from environment.
 * @returns {import('twilio').Twilio} Twilio client
 */
const getTwilioClient = () => {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;

  if (!accountSid || !authToken) {
    throw new Error('Twilio credentials are not configured in environment variables');
  }

  return twilio(accountSid, authToken);
};

/**
 * Initiate an outbound IVR call to a customer.
 * The call will hit the /api/webhooks/voice endpoint which serves the initial TwiML.
 *
 * @param {Object} customer - The customer document from MongoDB
 * @param {string} customer._id - Customer ObjectId
 * @param {string} customer.phone - Customer phone number
 * @param {string} customer.name - Customer name
 * @returns {Promise<Object>} Twilio call object containing callSid and status
 * @throws {Error} If the call cannot be initiated
 */
const initiateCall = async (customer) => {
  const client = getTwilioClient();
  const baseUrl = process.env.BASE_URL;

  if (!baseUrl) {
    throw new Error('BASE_URL is not configured in environment variables');
  }

  try {
    const call = await client.calls.create({
      to: customer.phone,
      from: process.env.TWILIO_PHONE_NUMBER,
      // Webhook for the initial IVR greeting
      url: `${baseUrl}/api/webhooks/voice?customerId=${customer._id}`,
      method: 'POST',
      // Status callback for tracking call lifecycle events
      statusCallback: `${baseUrl}/api/webhooks/status?customerId=${customer._id}`,
      statusCallbackEvent: ['initiated', 'ringing', 'answered', 'completed'],
      statusCallbackMethod: 'POST',
      // Record the call for compliance and review
      record: true,
      recordingStatusCallback: `${baseUrl}/api/webhooks/recording?customerId=${customer._id}`,
      recordingStatusCallbackMethod: 'POST',
      // Timeout and machine detection settings
      timeout: 30,
      machineDetection: 'Enable',
    });

    console.log(`📞 Call initiated to ${customer.name} (${customer.phone}) — SID: ${call.sid}`);

    return {
      callSid: call.sid,
      status: call.status,
    };
  } catch (error) {
    console.error(`❌ Failed to initiate call to ${customer.phone}:`, error.message);
    throw error;
  }
};

/**
 * Generate the initial IVR greeting TwiML for a customer.
 * Plays the loan reminder message and gathers DTMF + speech input.
 *
 * @param {Object} customer - Customer document
 * @param {string} customer._id - Customer ObjectId
 * @param {string} customer.name - Customer name
 * @param {number} customer.dueAmount - Amount due
 * @param {Date} customer.dueDate - Payment due date
 * @param {string} customer.loanId - Loan identifier
 * @returns {string} TwiML XML string
 */
const generateInitialTwiML = (customer) => {
  const twiml = new VoiceResponse();
  const baseUrl = process.env.BASE_URL;

  // Format the due date for speech
  const dueDateFormatted = new Date(customer.dueDate).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  // Format the amount for speech
  const amountFormatted = Number(customer.dueAmount).toLocaleString('en-US');

  // Create a Gather to capture DTMF or speech input
  const gather = twiml.gather({
    input: 'dtmf speech',
    timeout: 5,
    numDigits: 1,
    action: `${baseUrl}/api/webhooks/gather?step=1&customerId=${customer._id}`,
    method: 'POST',
    speechTimeout: 'auto',
    language: 'en-US',
  });

  gather.say(
    { voice: 'Polly.Joanna', language: 'en-US' },
    `Hello, this is an automated reminder call regarding your loan payment of ${amountFormatted} dollars due on ${dueDateFormatted}. Your loan ID is ${customer.loanId}. Have you already paid your EMI? Press 1 for Yes or 2 for No, or say your answer.`
  );

  // If no input is received, repeat the message
  twiml.say(
    { voice: 'Polly.Joanna' },
    'We did not receive any input. Goodbye.'
  );
  twiml.hangup();

  return twiml.toString();
};

/**
 * Generate TwiML for step 1: Handle "paid" response.
 * Thanks the customer and hangs up.
 *
 * @returns {string} TwiML XML string
 */
const generatePaidConfirmationTwiML = () => {
  const twiml = new VoiceResponse();

  twiml.say(
    { voice: 'Polly.Joanna', language: 'en-US' },
    'Thank you for confirming your payment. We will verify it shortly. Have a good day.'
  );
  twiml.hangup();

  return twiml.toString();
};

/**
 * Generate TwiML for step 1: Handle "not paid" response.
 * Asks when the customer plans to pay and gathers speech input.
 *
 * @param {string} customerId - Customer ObjectId string
 * @returns {string} TwiML XML string
 */
const generatePaymentDatePromptTwiML = (customerId) => {
  const twiml = new VoiceResponse();
  const baseUrl = process.env.BASE_URL;

  const gather = twiml.gather({
    input: 'speech',
    timeout: 8,
    action: `${baseUrl}/api/webhooks/gather?step=2&customerId=${customerId}`,
    method: 'POST',
    speechTimeout: 'auto',
    language: 'en-US',
  });

  gather.say(
    { voice: 'Polly.Joanna', language: 'en-US' },
    'When are you planning to make the payment? Please state the date.'
  );

  // Fallback if no speech is detected
  twiml.say(
    { voice: 'Polly.Joanna' },
    'We did not receive your response. We will try calling again. Goodbye.'
  );
  twiml.hangup();

  return twiml.toString();
};

/**
 * Generate TwiML for step 2: Ask about callback preference.
 * After capturing the promised payment date, asks if customer wants agent callback.
 *
 * @param {string} customerId - Customer ObjectId string
 * @returns {string} TwiML XML string
 */
const generateCallbackPromptTwiML = (customerId) => {
  const twiml = new VoiceResponse();
  const baseUrl = process.env.BASE_URL;

  const gather = twiml.gather({
    input: 'dtmf',
    timeout: 5,
    numDigits: 1,
    action: `${baseUrl}/api/webhooks/gather?step=3&customerId=${customerId}`,
    method: 'POST',
  });

  gather.say(
    { voice: 'Polly.Joanna', language: 'en-US' },
    'Would you like a callback from an agent? Press 1 for Yes or 2 for No.'
  );

  // Fallback
  twiml.say(
    { voice: 'Polly.Joanna' },
    'We did not receive your response. Goodbye.'
  );
  twiml.hangup();

  return twiml.toString();
};

/**
 * Generate TwiML for final goodbye after callback preference is recorded.
 *
 * @returns {string} TwiML XML string
 */
const generateFinalGoodbyeTwiML = () => {
  const twiml = new VoiceResponse();

  twiml.say(
    { voice: 'Polly.Joanna', language: 'en-US' },
    'Thank you for your time. We will follow up accordingly. Goodbye.'
  );
  twiml.hangup();

  return twiml.toString();
};

module.exports = {
  getTwilioClient,
  initiateCall,
  generateInitialTwiML,
  generatePaidConfirmationTwiML,
  generatePaymentDatePromptTwiML,
  generateCallbackPromptTwiML,
  generateFinalGoodbyeTwiML,
};
