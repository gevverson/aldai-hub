import express from 'express';
import Anthropic from '@anthropic-ai/sdk';
import dotenv from 'dotenv';
import OAG_CONTEXT from '../data/oag_context.js';

dotenv.config();
const router = express.Router();

let anthropic;
if (process.env.ANTHROPIC_API_KEY) {
  anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
  });
}

// Fallback Mock for local dev without API Key
const MOCK_API_RESPONSE = {
  finding: "Based on the 2019/2020 OAG report, Ksh 3.2M was disbursed for Kimaren Girls Secondary, but auditors physically verified the site and found no such school exists.",
  amount: "3,200,000",
  location: "Kemeloi-Maraba Ward",
  severity: "CRITICAL",
  reference: "Nandi NG-CDF Audit Report FY19/20, Page 42",
  action: "Report this ghost project to EACC on 0800 720 629 using tracking code GHOST-KIM-19"
};

// Build system prompt from real OAG knowledge base
const generateSystemPrompt = () => {
  return `You are an AI Audit Translator for "Macho ya Mwananchi" — the Citizen's Eye platform for Nandi County, Kenya.

Your mission is to protect citizens from public funds misappropriation and information asymmetry.
Translate official audit findings into simple, plain language in BOTH English and Swahili.
Be specific: cite page numbers, officer names, exact amounts, and locations from the official OAG reports.
Never soften the truth. If money was stolen, say it clearly. If a project doesn't exist, say it doesn't exist.

Always return ONLY valid JSON format matching this EXACT structure (no extra text outside the JSON):
{
  "finding": "2-4 sentences in plain English + one sentence in Swahili. Be specific about amounts and locations.",
  "amount": "Exact Ksh amount as a number string e.g. '3,200,000'",
  "location": "Ward and specific location",
  "severity": "LOW | MEDIUM | HIGH | CRITICAL",
  "reference": "Official OAG report citation including page number",
  "action": "Specific, actionable step the citizen can take — include actual phone numbers or email addresses from the knowledge base"
}

Here is the official OAG audit intelligence database you must use to answer questions:

${OAG_CONTEXT}`;
};

router.post('/query', async (req, res) => {
  const { query } = req.body;
  
  if (!query) {
    return res.status(400).json({ error: 'Query is required' });
  }

  console.log(`[AI AUDIT] processing query: ${query}`);

  if (!anthropic) {
    console.log('[AI AUDIT] No API key found. Using mock response.');
    await new Promise(resolve => setTimeout(resolve, 1500));
    return res.json({ success: true, answer: MOCK_API_RESPONSE });
  }

  try {
    const msg = await anthropic.messages.create({
      model: "claude-3-5-sonnet-20241022",
      max_tokens: 1024,
      system: generateSystemPrompt(),
      messages: [
        { role: "user", content: query }
      ],
    });

    const contentBlock = msg.content[0];
    if (contentBlock.type !== 'text') {
       throw new Error('Unexpected response format');
    }

    try {
      const parsedAnswer = JSON.parse(contentBlock.text);
      res.json({
        success: true,
        answer: parsedAnswer
      });
    } catch (parseError) {
       console.error("Failed to parse Claude JSON response:", contentBlock.text);
       res.status(500).json({ error: 'Failed to format the AI response' });
    }
  } catch (error) {
    console.error("Anthropic API Error:", error.message);
    res.status(500).json({ error: 'Failed to communicate with AI Audit API' });
  }
});

export default router;
