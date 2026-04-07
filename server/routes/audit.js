/**
 * server/routes/audit.js
 * Macho ya Mwananchi — AI Audit Route
 *
 * Proxies citizen Q&A requests to the Python RAG microservice at :8001.
 * Falls back to direct Claude API (with OAG knowledge base) if Python
 * service is unreachable — so citizens always get an answer.
 *
 * Endpoints:
 *   POST /api/audit/query     ← Main Q&A (rate-limited: 20 req/IP/hr)
 *   POST /api/audit/ingest    ← Admin: forward PDF upload to Python service
 *   GET  /api/audit/documents ← List indexed documents
 *   GET  /api/audit/status    ← Python service health check
 */

import express from 'express';
import Anthropic from '@anthropic-ai/sdk';
import dotenv from 'dotenv';
import OAG_CONTEXT from '../data/oag_context.js';

dotenv.config();

const router  = express.Router();
const AI_URL  = process.env.AI_SERVICE_URL || 'http://localhost:8002';
const TIMEOUT = 25_000; // 25s — Claude can be slow on first token

// ── Anthropic client (direct fallback) ─────────────────────
let anthropic;
if (process.env.ANTHROPIC_API_KEY) {
  anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
}

// ── Simple in-memory rate limiter (no extra deps needed) ────
// Key: IP address → { count, resetAt }
const rateLimitStore = new Map();
const RATE_LIMIT     = 20;   // requests
const RATE_WINDOW    = 3600; // seconds (1 hour)

function checkRateLimit(ip) {
  const now  = Math.floor(Date.now() / 1000);
  const entry = rateLimitStore.get(ip);

  if (!entry || now > entry.resetAt) {
    rateLimitStore.set(ip, { count: 1, resetAt: now + RATE_WINDOW });
    return true;
  }
  if (entry.count >= RATE_LIMIT) {
    return false;
  }
  entry.count++;
  return true;
}

// ── Direct Claude fallback (uses OAG text knowledge base) ──
const FALLBACK_SYSTEM = `You are a civic accountability assistant for Nandi County and Aldai 
Constituency in Kenya. You help citizens understand how public funds were misused, 
based ONLY on official Auditor-General reports.

Format EVERY answer exactly:

📋 JIBU (Answer):
[Plain language, max 3 sentences. Be specific: amounts, locations, names.]

💰 PESA ILIYOHUSIKA (Money Involved):
Ksh [amount] — [what it was for]

📍 MAHALI (Where):
[Ward / location / facility]

🚨 UZITO WA TATIZO (Severity):
[CHINI / KATI / JUU / MUHIMU SANA] — [one sentence why]

📄 CHANZO (Source):
[Document name] — Ukurasa [page number]

👉 UNACHOWEZA KUFANYA (What You Can Do):
- EACC (bure/free): 0800 720 629
- DCI: 0800 722 203
- [specific relevant action]

Rules:
- If question is Swahili → answer in Swahili
- If English → answer in English  
- Only use facts from the OAG context provided
- Never soften the truth
- Never mention internal system architecture

OAG CONTEXT:
${OAG_CONTEXT}`;

async function claudeDirectFallback(question) {
  if (!anthropic) {
    return {
      answer: `📋 JIBU: Samahani — AI service haipo available sasa hivi. Tafadhali jaribu tena baadaye.\n\n👉 UNACHOWEZA KUFANYA:\n- EACC: 0800 720 629 (bure)\n- DCI: 0800 722 203`,
      fallback: true,
      model: 'unavailable',
    };
  }

  const msg = await anthropic.messages.create({
    model:      'claude-sonnet-4-20250514',
    max_tokens: 1200,
    system:     FALLBACK_SYSTEM,
    messages:   [{ role: 'user', content: question }],
  });

  return {
    answer:   msg.content[0]?.text || 'No response generated.',
    fallback: true,
    model:    'claude-sonnet-4-20250514-direct',
    sources:  [],
  };
}

// ── POST /api/audit/query ────────────────────────────────────
router.post('/query', async (req, res) => {
  const clientIp = req.ip || req.socket?.remoteAddress || 'unknown';

  // Rate limit
  if (!checkRateLimit(clientIp)) {
    return res.status(429).json({
      error:   'Umefika kikomo cha maswali. Jaribu tena baada ya saa moja.',
      errorEn: 'Rate limit exceeded. Try again in 1 hour.',
    });
  }

  const { question, query, language, ward_context } = req.body;
  const text = (question || query || '').trim();

  if (!text || text.length < 3) {
    return res.status(400).json({ error: 'Question is required (min 3 characters)' });
  }
  if (text.length > 1000) {
    return res.status(400).json({ error: 'Question too long (max 1000 characters)' });
  }

  // Log metadata — NOT the question text (privacy)
  console.log(
    `[AUDIT] query | ip=${clientIp.slice(0, 12)}… | ` +
    `lang=${language || 'auto'} | ward=${ward_context || 'none'} | ` +
    `chars=${text.length} | ${new Date().toISOString()}`
  );

  const startTime = Date.now();

  // ── Try Python RAG service first ──
  try {
    const controller = new AbortController();
    const timeout    = setTimeout(() => controller.abort(), TIMEOUT);

    const pyRes = await fetch(`${AI_URL}/query`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ question: text, language, ward_context }),
      signal:  controller.signal,
    });
    clearTimeout(timeout);

    if (!pyRes.ok) {
      const errBody = await pyRes.text();
      throw new Error(`Python service HTTP ${pyRes.status}: ${errBody.slice(0, 100)}`);
    }

    const data = await pyRes.json();
    const elapsed = Date.now() - startTime;
    console.log(`[AUDIT] ✅ Python RAG answered in ${elapsed}ms`);

    return res.json({
      success:          true,
      answer:           data.answer,
      sources:          data.sources || [],
      language:         data.language || language || 'en',
      response_time_ms: elapsed,
      model:            data.model,
      service:          'python-rag',
    });

  } catch (pyErr) {
    const isTimeout = pyErr.name === 'AbortError';
    console.warn(
      `[AUDIT] Python service ${isTimeout ? 'TIMEOUT' : 'UNREACHABLE'}: ${pyErr.message} — ` +
      'falling back to direct Claude'
    );
  }

  // ── Fallback: Direct Claude + OAG text context ──
  try {
    const fallback = await claudeDirectFallback(text);
    const elapsed  = Date.now() - startTime;
    console.log(`[AUDIT] ✅ Direct Claude fallback answered in ${elapsed}ms`);

    return res.json({
      success:          true,
      answer:           fallback.answer,
      sources:          fallback.sources || [],
      language:         language || 'auto',
      response_time_ms: elapsed,
      model:            fallback.model,
      service:          'claude-direct-fallback',
      note:             'Python RAG service offline — using built-in knowledge base',
    });
  } catch (err) {
    console.error(`[AUDIT] Both services failed: ${err.message}`);
    return res.status(503).json({
      error:   'Huduma ya AI haipo sasa hivi. Tafadhali jaribu tena baadaye.',
      errorEn: 'AI service temporarily unavailable. Please try again.',
    });
  }
});

// ── POST /api/audit/ingest (JWT-protected, proxies to Python) ─
router.post('/ingest', async (req, res) => {
  // Simple admin token check (attach proper JWT middleware in production)
  const token = req.headers['x-admin-token'] || req.headers.authorization?.replace('Bearer ', '');
  const adminToken = process.env.ADMIN_TOKEN;
  if (adminToken && token !== adminToken) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    // Proxy the multipart form data to Python service
    // The client must send multipart — we forward raw
    const pyRes = await fetch(`${AI_URL}/ingest`, {
      method:  'POST',
      headers: { ...req.headers, 'x-admin-token': token || '' },
      body:    req,       // stream through
      duplex:  'half',
    });

    const data = await pyRes.json();
    return res.status(pyRes.status).json(data);
  } catch (err) {
    console.error(`[AUDIT INGEST] Error: ${err.message}`);
    return res.status(503).json({ error: 'Python ingestion service unreachable' });
  }
});

// ── GET /api/audit/documents ─────────────────────────────────
router.get('/documents', async (req, res) => {
  try {
    const pyRes = await fetch(`${AI_URL}/documents`, { signal: AbortSignal.timeout(5000) });
    if (!pyRes.ok) throw new Error(`HTTP ${pyRes.status}`);
    const data = await pyRes.json();
    return res.json(data);
  } catch {
    // Fallback: return the static built-in document list
    return res.json({
      count: 1,
      documents: [
        {
          document_name: 'OAG_BUILTIN_NANDI_KNOWLEDGE',
          year:          '2018–2024',
          source:        'OAG Kenya (Built-in)',
        },
      ],
      note: 'Python RAG service offline — showing built-in documents only',
    });
  }
});

// ── GET /api/audit/status ─────────────────────────────────────
router.get('/status', async (req, res) => {
  try {
    const pyRes = await fetch(`${AI_URL}/health`, { signal: AbortSignal.timeout(4000) });
    const data  = await pyRes.json();
    return res.json({ python_service: 'online', ...data });
  } catch {
    return res.json({
      python_service: 'offline',
      fallback:       anthropic ? 'claude-direct' : 'unavailable',
      note:           'Direct Claude fallback active',
    });
  }
});

export default router;
