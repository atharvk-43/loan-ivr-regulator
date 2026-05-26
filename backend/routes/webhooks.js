/**
 * @fileoverview Twilio webhooks router.
 * Handles voice call setups, step-by-step interactive gather events, call status tracking,
 * and call recording callbacks. Invokes OpenAI to analyze finished calls.
 */

const express = require('express');
const Customer = require('../models/Customer');
const CallLog = require('../models/CallLog');
const twilioService = require('../services/twilioService');
const openaiService = require('../services/openaiService');

const router = express.Router();

// Helper to sanitize speech transcripts
const cleanSpeechResult = (speech) => {
  if (!speech) return '';
  return speech.trim();
};

/**
 * @desc    Initial Voice Webhook: Serves initial TwiML greeting
 * @route   POST /api/webhooks/voice
 * @access  Public (Called by Twilio)
 */
router.post('/voice', async (req, res) => {
  const { customerId } = req.query;
  const { CallSid } = req.body;

  try {
    const customer = await Customer.findById(customerId);

    if (!customer) {
      console.error(`❌ Webhook error: Customer not found — ID: ${customerId}`);
      const twiml = new (require('twilio').twiml.VoiceResponse)();
      twiml.say('An error has occurred. Goodbye.');
      twiml.hangup();
      return res.type('text/xml').send(twiml.toString());
    }

    console.log(`📞 Call picked up by ${customer.name} — Generating greeting TwiML`);

    // Update customer call status and SID
    customer.callStatus = 'in-progress';
    customer.callSid = CallSid;
    await customer.save();

    const amountFormatted = Number(customer.dueAmount).toLocaleString('en-US');
    const firstPrompt = `Hello, this is an automated reminder call regarding your loan payment of ${amountFormatted} dollars. Have you already paid your EMI? Press 1 for Yes or 2 for No.`;

    // Update or create CallLog with the active SID and initial transcript
    await CallLog.findOneAndUpdate(
      { callSid: CallSid },
      {
        customer: customer._id,
        callSid: CallSid,
        status: 'in-progress',
        startedAt: new Date(),
        transcript: `System: ${firstPrompt}\n`,
      },
      { upsert: true, new: true }
    );

    // Generate initial TwiML response
    const twiml = new (require('twilio').twiml.VoiceResponse)();
    const gather = twiml.gather({
      input: 'dtmf',
      timeout: 6,
      numDigits: 1,
      action: `/api/webhooks/gather?step=1&customerId=${customer._id}`,
      method: 'POST',
    });
    gather.say({ voice: 'Polly.Joanna', language: 'en-US' }, firstPrompt);
    twiml.say({ voice: 'Polly.Joanna' }, 'We did not receive any input. Goodbye.');
    twiml.hangup();

    res.type('text/xml').send(twiml.toString());
  } catch (error) {
    console.error('❌ Webhook /voice error:', error.message);
    const twiml = new (require('twilio').twiml.VoiceResponse)();
    twiml.say('System is currently unavailable. Goodbye.');
    twiml.hangup();
    res.type('text/xml').send(twiml.toString());
  }
});

/**
 * @desc    Interactive Gather Webhook: Directs flow based on DTMF/Speech inputs
 * @route   POST /api/webhooks/gather
 * @access  Public (Called by Twilio)
 */
router.post('/gather', async (req, res) => {
  const { step, customerId, paid } = req.query;
  const { Digits, SpeechResult, CallSid } = req.body;

  try {
    const customer = await Customer.findById(customerId);
    const callLog = await CallLog.findOne({ callSid: CallSid });

    if (!customer || !callLog) {
      console.error(`❌ Gather error: Customer (${customerId}) or CallLog (${CallSid}) not found`);
      const twiml = new (require('twilio').twiml.VoiceResponse)();
      twiml.hangup();
      return res.type('text/xml').send(twiml.toString());
    }

    const currentStep = parseInt(step, 10);
    const twiml = new (require('twilio').twiml.VoiceResponse)();

    // Track DTMF inputs inside CallLog
    if (Digits) callLog.dtmfInputs.push(Digits);

    if (currentStep === 1) {
      // Step 1: Handling response to "Have you already paid your EMI?"
      const isYes = Digits === '1';

      if (isYes) {
        // Customer pressed 1 (Yes)
        customer.paymentStatus = 'paid_pending_verification';
        await customer.save();

        callLog.transcript += `Customer: Yes (Pressed 1)\n`;
        
        const nextPrompt = `Great! Would you like to receive your payment receipt via SMS or Email? Press 1 for SMS or 2 for Email.`;
        callLog.transcript += `System: ${nextPrompt}\n`;
        await callLog.save();

        const gather = twiml.gather({
          input: 'dtmf',
          timeout: 6,
          numDigits: 1,
          action: `/api/webhooks/gather?step=2&customerId=${customer._id}&paid=true`,
          method: 'POST',
        });
        gather.say({ voice: 'Polly.Joanna', language: 'en-US' }, nextPrompt);
        twiml.say({ voice: 'Polly.Joanna' }, 'We did not receive any input. Goodbye.');
        twiml.hangup();
      } else {
        // Customer pressed 2 (No)
        customer.paymentStatus = 'pending';
        await customer.save();

        callLog.transcript += `Customer: No (Pressed 2)\n`;
        
        const nextPrompt = `No problem. Are you planning to make the payment within the next 3 days, or do you need more time? Press 1 for within 3 days or 2 for more time.`;
        callLog.transcript += `System: ${nextPrompt}\n`;
        await callLog.save();

        const gather = twiml.gather({
          input: 'dtmf',
          timeout: 6,
          numDigits: 1,
          action: `/api/webhooks/gather?step=2&customerId=${customer._id}&paid=false`,
          method: 'POST',
        });
        gather.say({ voice: 'Polly.Joanna', language: 'en-US' }, nextPrompt);
        twiml.say({ voice: 'Polly.Joanna' }, 'We did not receive any input. Goodbye.');
        twiml.hangup();
      }
    } else if (currentStep === 2) {
      // Step 2: Handle receipt channel or payment urgency preference
      const isPaid = paid === 'true';

      if (isPaid) {
        // Yes branch: SMS (1) or Email (2)
        const channel = Digits === '1' ? 'SMS' : 'Email';
        callLog.transcript += `Customer: ${channel} (Pressed ${Digits || 'None'})\n`;
        
        const nextPrompt = `Finally, are you satisfied with our automated reminder service? Press 1 for Yes or 2 for No.`;
        callLog.transcript += `System: ${nextPrompt}\n`;
        await callLog.save();

        const gather = twiml.gather({
          input: 'dtmf',
          timeout: 6,
          numDigits: 1,
          action: `/api/webhooks/gather?step=3&customerId=${customer._id}&paid=true`,
          method: 'POST',
        });
        gather.say({ voice: 'Polly.Joanna', language: 'en-US' }, nextPrompt);
        twiml.say({ voice: 'Polly.Joanna' }, 'We did not receive any input. Goodbye.');
        twiml.hangup();
      } else {
        // No branch: Within 3 days (1) or More time (2)
        const urgency = Digits === '1' ? 'Within 3 days' : 'Needs more time';
        callLog.transcript += `Customer: ${urgency} (Pressed ${Digits || 'None'})\n`;
        
        if (Digits === '1') {
          customer.paymentStatus = 'promised';
          const fallbackPromisedDate = new Date();
          fallbackPromisedDate.setDate(fallbackPromisedDate.getDate() + 3);
          customer.promisedPaymentDate = fallbackPromisedDate;
          await customer.save();
        }

        const nextPrompt = `Would you like our support agent to call you back to assist with the payment? Press 1 for Yes or 2 for No.`;
        callLog.transcript += `System: ${nextPrompt}\n`;
        await callLog.save();

        const gather = twiml.gather({
          input: 'dtmf',
          timeout: 6,
          numDigits: 1,
          action: `/api/webhooks/gather?step=3&customerId=${customer._id}&paid=false`,
          method: 'POST',
        });
        gather.say({ voice: 'Polly.Joanna', language: 'en-US' }, nextPrompt);
        twiml.say({ voice: 'Polly.Joanna' }, 'We did not receive any input. Goodbye.');
        twiml.hangup();
      }
    } else if (currentStep === 3) {
      // Step 3: Handle service feedback or agent callback preference
      const isPaid = paid === 'true';

      if (isPaid) {
        // Yes branch: feedback satisfaction Yes (1) or No (2)
        const satisfied = Digits === '1' ? 'Satisfied' : 'Not satisfied';
        callLog.transcript += `Customer: ${satisfied} (Pressed ${Digits || 'None'})\n`;
        
        const nextPrompt = `Thank you for your time. Have a wonderful day. Goodbye.`;
        callLog.transcript += `System: ${nextPrompt}\n`;
        await callLog.save();

        twiml.say({ voice: 'Polly.Joanna', language: 'en-US' }, nextPrompt);
        twiml.hangup();
      } else {
        // No branch: agent callback Yes (1) or No (2)
        const callbackYes = Digits === '1';
        customer.callbackRequested = callbackYes;
        await customer.save();

        callLog.transcript += `Customer: Callback requested: ${callbackYes ? 'Yes' : 'No'} (Pressed ${Digits || 'None'})\n`;
        
        const nextPrompt = `Thank you for your response. We will follow up. Goodbye.`;
        callLog.transcript += `System: ${nextPrompt}\n`;
        await callLog.save();

        twiml.say({ voice: 'Polly.Joanna', language: 'en-US' }, nextPrompt);
        twiml.hangup();
      }
    } else {
      twiml.say({ voice: 'Polly.Joanna' }, 'Thank you. Goodbye.');
      twiml.hangup();
    }

    res.type('text/xml').send(twiml.toString());
  } catch (error) {
    console.error(`❌ Webhook /gather error at Step ${step}:`, error.message);
    const twiml = new (require('twilio').twiml.VoiceResponse)();
    twiml.say('Something went wrong during input processing. Goodbye.');
    twiml.hangup();
    res.type('text/xml').send(twiml.toString());
  }
});

/**
 * @desc    Call Status Callback: Tracks call transitions (initiated -> ringing -> completed)
 *          When completed, kicks off the OpenAI analysis pipeline.
 * @route   POST /api/webhooks/status
 * @access  Public (Called by Twilio)
 */
router.post('/status', async (req, res) => {
  const { customerId } = req.query;
  const { CallStatus, CallSid, CallDuration } = req.body;

  try {
    console.log(`🔔 Call Status Callback: SID ${CallSid} is now "${CallStatus}"`);

    const customer = await Customer.findById(customerId);
    if (!customer) {
      return res.status(404).json({ success: false, message: 'Customer not found' });
    }

    // Map Twilio statuses to our schema statuses
    let mappedStatus = 'none';
    if (CallStatus === 'initiated') mappedStatus = 'initiated';
    if (CallStatus === 'ringing') mappedStatus = 'ringing';
    if (CallStatus === 'in-progress') mappedStatus = 'in-progress';
    if (CallStatus === 'completed') mappedStatus = 'completed';
    if (CallStatus === 'busy') mappedStatus = 'busy';
    if (CallStatus === 'no-answer') mappedStatus = 'no-answer';
    if (CallStatus === 'failed') mappedStatus = 'failed';
    if (CallStatus === 'canceled') mappedStatus = 'failed';

    // Update Customer call status
    customer.callStatus = mappedStatus;
    await customer.save();

    // Find and update CallLog
    const callLog = await CallLog.findOne({ callSid: CallSid });
    if (callLog) {
      callLog.status = mappedStatus;
      if (CallDuration) {
        callLog.duration = parseInt(CallDuration, 10);
      }
      if (mappedStatus === 'completed' || ['busy', 'no-answer', 'failed'].includes(mappedStatus)) {
        callLog.endedAt = new Date();
      }
      await callLog.save();
    }

    // If call is finished (completed / failed / busy / no-answer), compile AI summary
    const isFinished = ['completed', 'failed', 'busy', 'no-answer'].includes(mappedStatus);

    if (isFinished && callLog) {
      console.log(`🤖 Call SID ${CallSid} completed/failed — triggering AI Analysis Pipeline`);

      // Trigger OpenAI call summary asynchronously to avoid blocking the webhook response
      setTimeout(async () => {
        try {
          const freshLog = await CallLog.findOne({ callSid: CallSid });
          const freshCustomer = await Customer.findById(customerId);

          const aiResult = await openaiService.generateCallSummary({
            customerName: freshCustomer.name,
            loanId: freshCustomer.loanId,
            dueAmount: freshCustomer.dueAmount,
            transcript: freshLog.transcript,
            dtmfInputs: freshLog.dtmfInputs,
            speechInputs: freshLog.speechInputs,
          });

          console.log(`✅ OpenAI Summary generated for SID ${CallSid}`);

          // Update Customer records with AI summary details
          freshCustomer.aiSummary = aiResult;
          freshCustomer.transcript = freshLog.transcript;

          // If the AI found a promised date in the transcript, parse it and save it
          // We can also try to parse a date out of the speech inputs in the background
          if (freshCustomer.paymentStatus === 'promised') {
            // Estimate a promised date: default to 5 days from now if not specifiable,
            // or we let the recovery agent check. In a production build, we can let GPT-4o-mini extract it
            // we'll assign it 5 days out as a robust fallback.
            const fallbackPromisedDate = new Date();
            fallbackPromisedDate.setDate(fallbackPromisedDate.getDate() + 5);
            freshCustomer.promisedPaymentDate = fallbackPromisedDate;
          }

          await freshCustomer.save();

          // Save to CallLog as well
          freshLog.aiSummary = aiResult;
          freshLog.transcript = freshLog.transcript;
          await freshLog.save();
        } catch (err) {
          console.error(`❌ Error in background AI pipeline for SID ${CallSid}:`, err.message);
        }
      }, 1000);
    }

    res.status(200).json({ success: true });
  } catch (error) {
    console.error('❌ Webhook /status error:', error.message);
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * @desc    Recording Webhook: Stores Twilio call recording URLs
 * @route   POST /api/webhooks/recording
 * @access  Public (Called by Twilio)
 */
router.post('/recording', async (req, res) => {
  const { customerId } = req.query;
  const { RecordingUrl, CallSid } = req.body;

  try {
    console.log(`📹 Recording Callback: Call SID ${CallSid} has recording URL: ${RecordingUrl}`);

    const customer = await Customer.findById(customerId);
    if (customer) {
      customer.callRecordingUrl = RecordingUrl;
      await customer.save();
    }

    const callLog = await CallLog.findOne({ callSid: CallSid });
    if (callLog) {
      callLog.recordingUrl = RecordingUrl;
      await callLog.save();
    }

    res.status(200).json({ success: true });
  } catch (error) {
    console.error('❌ Webhook /recording error:', error.message);
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
