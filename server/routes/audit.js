import express from 'express';
import Anthropic from '@anthropic-ai/sdk';
import dotenv from 'dotenv';
import { projects } from '../data/seed.js';

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

// Create a system prompt based on seed projects data (mocking the full RAG for MVP)
const generateSystemPrompt = () => {
  const context = projects.map(p => 
    `- ${p.name} (${p.ward}): allocated Ksh ${p.allocated}. Official: ${p.officialStatus}, Verified: ${p.communityStatus}. Audit Note: ${p.auditNote}`
  ).join('\\n');

  return `You are an AI Audit Translator for "Macho ya Mwananchi" protecting the citizens of Nandi County.
Translate audit findings into simple, plain language (English & Swahili).
Always return your answer in valid JSON format matching this EXACT structure:
{
  "finding": "Plain language, 2-3 sentences max, standard Swahili + English",
  "amount": "The exact Ksh amount",
  "location": "Ward/Location",
  "severity": "LOW / MEDIUM / HIGH / CRITICAL",
  "reference": "Audit Report reference",
  "action": "What the user can do (e.g., Report to EACC)"
}

Here is the current audited context summary:
${context}`;
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
