/**
 * @fileoverview OpenAI service for generating AI summaries of IVR call transcripts.
 * Uses GPT-4o-mini for cost-effective, fast call analysis.
 */

const OpenAI = require('openai');

/**
 * Get an initialized OpenAI client instance.
 * @returns {OpenAI} OpenAI client
 */
const getOpenAIClient = () => {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    throw new Error('OPENAI_API_KEY is not configured in environment variables');
  }

  return new OpenAI({
    apiKey,
    baseURL: 'https://generativelanguage.googleapis.com/v1beta/openai/'
  });
};

/**
 * Generate an AI summary of a call transcript using GPT-4o-mini.
 * Analyzes the transcript and returns structured insights about the call.
 *
 * @param {Object} params - Parameters for summary generation
 * @param {string} params.customerName - Name of the customer
 * @param {string} params.loanId - Loan identifier
 * @param {number} params.dueAmount - Amount due
 * @param {string} params.transcript - Full call transcript text
 * @param {string[]} [params.dtmfInputs] - DTMF digits pressed during call
 * @param {string[]} [params.speechInputs] - Speech recognition results
 * @returns {Promise<Object>} AI summary object with summary, sentiment, repaymentLikelihood, escalationRecommended
 */
const generateCallSummary = async ({
  customerName,
  loanId,
  dueAmount,
  transcript,
  dtmfInputs = [],
  speechInputs = [],
}) => {
  try {
    const openai = getOpenAIClient();

    // Build a comprehensive prompt for the AI
    const systemPrompt = `You are an expert loan collection analyst. Analyze the following IVR call transcript and provide a structured summary. You must respond ONLY with valid JSON — no markdown, no code fences, no extra text.

Return JSON in this exact format:
{
  "summary": "A concise 2-3 sentence summary of the call outcome",
  "sentiment": "positive | neutral | negative | hostile",
  "repaymentLikelihood": "high | medium | low | unknown",
  "escalationRecommended": true or false
}

Guidelines:
- "summary": Describe what happened — did the customer confirm payment, promise a date, refuse, or not respond?
- "sentiment": Assess the customer's tone and cooperation level.
- "repaymentLikelihood": Based on the conversation, how likely is the customer to repay?
- "escalationRecommended": Set to true if the customer was hostile, refused to pay, or the call outcome was unclear/negative.`;

    const userPrompt = `Customer: ${customerName}
Loan ID: ${loanId}
Due Amount: $${dueAmount}
DTMF Inputs: ${dtmfInputs.length > 0 ? dtmfInputs.join(', ') : 'None'}
Speech Inputs: ${speechInputs.length > 0 ? speechInputs.join(' | ') : 'None'}

Transcript:
${transcript || 'No transcript available — call may have ended before interaction.'}`;

    const response = await openai.chat.completions.create({
      model: 'gemini-1.5-flash',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.3,
      max_tokens: 300,
    });

    const content = response.choices[0]?.message?.content;

    if (!content) {
      throw new Error('OpenAI returned an empty response');
    }

    // Parse the JSON response (strip markdown fences if present)
    const cleanContent = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const parsed = JSON.parse(cleanContent);

    // Validate the expected fields exist
    return {
      summary: parsed.summary || 'Summary not available',
      sentiment: parsed.sentiment || 'unknown',
      repaymentLikelihood: parsed.repaymentLikelihood || 'unknown',
      escalationRecommended: Boolean(parsed.escalationRecommended),
    };
  } catch (error) {
    console.error('❌ OpenAI summary generation failed:', error.message);

    // Return a fallback summary rather than crashing the entire call flow
    return {
      summary: 'AI summary generation failed. Manual review required.',
      sentiment: 'unknown',
      repaymentLikelihood: 'unknown',
      escalationRecommended: true,
    };
  }
};

module.exports = {
  getOpenAIClient,
  generateCallSummary,
};
