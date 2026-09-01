/**
 * server/routes/audit.js
 * Macho ya Mwananchi — AI Audit Route
 *
 * Proxies citizen Q&A requests to the Python RAG microservice at :8002.
 * Falls back to direct Gemini API (with OAG knowledge base) if Python
 * service is unreachable — so citizens always get an answer.
 */

import crypto from 'crypto';
import express from 'express';
import dotenv from 'dotenv';

dotenv.config();

// Measured against the deployed free-tier RAG service with the full 46-report
// index loaded: ~32s warm, ~68s on a cold start (the ONNX embedding model has
// to load before the first query can be embedded). The old 25s budget was
// shorter than the service's best case, so *every* question timed out and the
// citizen got the fallback instead of the cited answer — the RAG worked and
// nobody could see it. One attempt, not two: a timeout retry just doubles the
// wait on a request that was never going to be fast, and 2×25s was already
// making people wait 50s to be told nothing.
const TIMEOUT_MS = 75_000;

// A cold start and a slow service fail differently, and only one of them is
// worth retrying.
//
// The free tier sleeps after 15 minutes, and the keep-alive workflow does not
// prevent it: it claims a 10-minute cron but GitHub throttles scheduled runs on
// free runners to a measured median of ~4 hours, so the service is asleep for
// most of the day. The first request to a sleeping service is what wakes it —
// Render answers 502/503 within seconds while the container boots, and the
// observed failures come back in ~12s, nowhere near TIMEOUT_MS. Retrying *that*
// is nearly free and usually succeeds, because the previous attempt did the
// waking. Without it a citizen's first question — often their only one —
// returns "I cannot reach the audit documents" perhaps half the time.
//
// A timeout is the opposite case: the service is awake and simply slow, and a
// second 75s wait only makes someone wait twice to be told the same thing. So
// AbortError never retries, and neither does any failure that took longer than
// the window below — by then we are no longer looking at a cold start.
const COLD_START_RETRY_WINDOW_MS = 20_000;
const COLD_START_RETRY_DELAY_MS  = 2_000;
const PYTHON_RETRY_ATTEMPTS = 2;
const GEMINI_RETRY_ATTEMPTS = 2;
const RETRY_BASE_DELAY_MS = 350;

const RATE_LIMIT = 20;
const RATE_WINDOW_SECONDS = 3600;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function redactIp(ip = '') {
  return ip ? `${ip.slice(0, 12)}…` : 'unknown';
}

function createAuditError(message, extra = {}) {
  const err = new Error(message);
  Object.assign(err, extra);
  return err;
}

function isColdStartFailure(err) {
  if (!err) return false;

  // Awake but slow — see COLD_START_RETRY_WINDOW_MS.
  if (err.name === 'AbortError') return false;
  if (typeof err.elapsedMs === 'number' && err.elapsedMs >= COLD_START_RETRY_WINDOW_MS) {
    return false;
  }

  // What Render returns while a sleeping container is starting.
  if (typeof err.status === 'number') return [502, 503, 504].includes(err.status);

  const text = `${err.message || ''}`.toLowerCase();
  return (
    text.includes('econnrefused') ||
    text.includes('econnreset') ||
    text.includes('socket hang up') ||
    text.includes('fetch failed') ||
    text.includes('network')
  );
}

function isTransientError(err) {
  if (!err) return false;
  if (err.name === 'AbortError') return true;
  if (typeof err.status === 'number') return err.status >= 500 || err.status === 429;

  const text = `${err.message || ''}`.toLowerCase();
  return (
    text.includes('timeout') ||
    text.includes('timed out') ||
    text.includes('econnreset') ||
    text.includes('socket hang up') ||
    text.includes('temporar') ||
    text.includes('try again')
  );
}

async function withRetry(operation, {
  attempts,
  baseDelayMs,
  shouldRetry,
  onRetry,
}) {
  let lastError;

  for (let attempt = 1; attempt <= attempts; attempt++) {
    try {
      return await operation(attempt);
    } catch (error) {
      lastError = error;
      if (attempt >= attempts || !shouldRetry(error)) break;

      const waitMs = baseDelayMs * (2 ** (attempt - 1));
      if (onRetry) onRetry({ attempt, waitMs, error });
      await sleep(waitMs);
    }
  }

  throw lastError;
}

function validateAuditConfig({
  env = process.env,
  strict = env.NODE_ENV === 'production',
} = {}) {
  const warnings = [];

  if (!env.AI_SERVICE_URL) {
    warnings.push('AI_SERVICE_URL not set; default http://localhost:8002 will be used.');
  } else {
    try {
      new URL(env.AI_SERVICE_URL);
    } catch {
      throw new Error('Invalid AI_SERVICE_URL. Expected an absolute URL.');
    }
  }

  if (!env.GEMINI_API_KEY) {
    const message = 'GEMINI_API_KEY is not set; the Python RAG service will not be able to answer questions.';
    if (strict) throw new Error(message);
    warnings.push(message);
  }

  return { warnings };
}

// When the Python RAG service is unreachable, this router used to ask Gemini
// the citizen's question directly, priming it with a hand-written summary of
// Nandi audit findings (server/data/oag_context.js, now deleted). That summary
// named individual officers as responsible for fraud and quoted an EACC
// tracking code that appears nowhere in the 46 signed Auditor-General PDFs
// this platform ships — and because the Python service was down from June to
// August 2026, this was the path actually answering citizens.
//
// A prompt-only fallback cannot be made safe: the answer template requires an
// amount, a ward and a page number, so a model with no retrieved document will
// invent all three and format them exactly like a real citation. Retired in
// favour of saying plainly that the documents are unreachable.
//
// The seam is kept: `geminiFallbackFn` still overrides this (used by tests),
// and the response shape is unchanged.
const UNAVAILABLE_ANSWER = [
  '📋 JIBU (Answer):',
  'Samahani — siwezi kufikia hati za ukaguzi kwa sasa, kwa hivyo siwezi kujibu swali hili.',
  'Ninajibu tu kutoka ripoti za Mkaguzi Mkuu wa Serikali — sitakisii.',
  '',
  'Sorry — I cannot reach the audit documents right now, so I cannot answer this question.',
  'I only answer from the Auditor-General reports themselves — I do not guess.',
  '',
  '👉 UNACHOWEZA KUFANYA (What You Can Do):',
  '- EACC (Kupiga simu bure / Free call): 0800 720 629',
  '- DCI (Uchunguzi wa uhalifu / Criminal investigations): 0800 722 203',
  '- Tembelea ukurasa wa Findings kuona ripoti zilizothibitishwa / Browse the Findings page for verified report data',
].join('\n');

function buildGeminiFallback(geminiApiKey, { geminiFallbackFn } = {}) {
  if (geminiFallbackFn) return geminiFallbackFn;

  return async function unsourcedAnswerRefused() {
    return {
      answer: UNAVAILABLE_ANSWER,
      fallback: true,
      model: 'unavailable',
      sources: [],
    };
  };
}

export function createAuditRouter({
  fetchImpl = fetch,
  alertFetchImpl = fetch,
  aiUrl = process.env.AI_SERVICE_URL || 'http://localhost:8002',
  geminiApiKey = process.env.GEMINI_API_KEY,
  alertWebhook = process.env.AUDIT_ALERT_WEBHOOK,
  geminiFallbackFn,
  logger = console,
} = {}) {
  const router = express.Router();
  const rateLimitStore = new Map();
  const geminiDirectFallback = buildGeminiFallback(geminiApiKey, { geminiFallbackFn });

  function telemetry(level, payload) {
    const line = `[AUDIT_TELEMETRY] ${JSON.stringify(payload)}`;
    logger[level](line);
  }

  async function sendAlert(payload) {
    if (!alertWebhook) return;
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 4000);
      await alertFetchImpl(alertWebhook, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });
      clearTimeout(timeout);
    } catch (err) {
      telemetry('warn', {
        event: 'alert_dispatch_failed',
        request_id: payload.request_id,
        reason: err.message,
      });
    }
  }

  function checkRateLimit(ip) {
    const now = Math.floor(Date.now() / 1000);
    const entry = rateLimitStore.get(ip);

    if (!entry || now > entry.resetAt) {
      rateLimitStore.set(ip, { count: 1, resetAt: now + RATE_WINDOW_SECONDS });
      return true;
    }
    if (entry.count >= RATE_LIMIT) return false;

    entry.count += 1;
    return true;
  }

  router.post('/query', async (req, res) => {
    const requestId = crypto.randomUUID();
    const clientIp = req.ip || req.socket?.remoteAddress || 'unknown';
    const { question, query, language, ward_context } = req.body;
    const text = (question || query || '').trim();

    if (!checkRateLimit(clientIp)) {
      telemetry('warn', {
        event: 'rate_limited',
        request_id: requestId,
        ip: redactIp(clientIp),
      });
      return res.status(429).json({
        error: 'Umefika kikomo cha maswali. Jaribu tena baada ya saa moja.',
        errorEn: 'Rate limit exceeded. Try again in 1 hour.',
        code: 'RATE_LIMIT_EXCEEDED',
        request_id: requestId,
      });
    }

    if (!text || text.length < 3) {
      return res.status(400).json({
        error: 'Question is required (min 3 characters)',
        code: 'INVALID_QUESTION',
        request_id: requestId,
      });
    }

    if (text.length > 1000) {
      return res.status(400).json({
        error: 'Question too long (max 1000 characters)',
        code: 'QUESTION_TOO_LONG',
        request_id: requestId,
      });
    }

    const startTime = Date.now();

    telemetry('log', {
      event: 'audit_query_received',
      request_id: requestId,
      ip: redactIp(clientIp),
      language: language || 'auto',
      ward: ward_context || 'none',
      chars: text.length,
    });

    let pythonError = null;

    try {
      const pyRes = await withRetry(async () => {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);
        const attemptStart = Date.now();
        try {
          const response = await fetchImpl(`${aiUrl}/query`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ question: text, language, ward_context }),
            signal: controller.signal,
          });

          if (!response.ok) {
            const errBody = await response.text();
            throw createAuditError(
              `Python service HTTP ${response.status}: ${errBody.slice(0, 200)}`,
              { status: response.status, stage: 'python-rag' },
            );
          }

          return response;
        } catch (err) {
          // How long the attempt took is what separates "still booting" from
          // "awake but slow"; the error itself does not say.
          if (err && err.elapsedMs === undefined) err.elapsedMs = Date.now() - attemptStart;
          throw err;
        } finally {
          clearTimeout(timeout);
        }
      }, {
        attempts: PYTHON_RETRY_ATTEMPTS,
        baseDelayMs: COLD_START_RETRY_DELAY_MS,
        shouldRetry: isColdStartFailure,
        onRetry: ({ attempt, waitMs, error }) => {
          telemetry('warn', {
            event: 'python_retry',
            request_id: requestId,
            next_attempt: attempt + 1,
            wait_ms: waitMs,
            reason: error.message,
          });
        },
      });

      const data = await pyRes.json();
      const elapsed = Date.now() - startTime;

      telemetry('log', {
        event: 'python_answer_success',
        request_id: requestId,
        elapsed_ms: elapsed,
        service: 'python-rag',
      });

      return res.json({
        success: true,
        answer: data.answer,
        sources: data.sources || [],
        language: data.language || language || 'en',
        response_time_ms: elapsed,
        model: data.model,
        service: 'python-rag',
        request_id: requestId,
      });
    } catch (pyErr) {
      pythonError = pyErr;
      telemetry('warn', {
        event: 'python_answer_failed',
        request_id: requestId,
        reason: pyErr.message,
        retryable: isTransientError(pyErr),
      });
    }

    try {
      const fallback = await withRetry(async () => geminiDirectFallback(text), {
        attempts: GEMINI_RETRY_ATTEMPTS,
        baseDelayMs: RETRY_BASE_DELAY_MS,
        shouldRetry: isTransientError,
        onRetry: ({ attempt, waitMs, error }) => {
          telemetry('warn', {
            event: 'gemini_retry',
            request_id: requestId,
            next_attempt: attempt + 1,
            wait_ms: waitMs,
            reason: error.message,
          });
        },
      });

      const elapsed = Date.now() - startTime;
      telemetry('log', {
        event: 'gemini_fallback_success',
        request_id: requestId,
        elapsed_ms: elapsed,
        model: fallback.model,
      });

      return res.json({
        success: true,
        answer: fallback.answer,
        sources: fallback.sources || [],
        language: language || 'auto',
        response_time_ms: elapsed,
        model: fallback.model,
        service: 'unsourced-answer-refused',
        note: 'Python RAG service offline — no audit documents reachable, so no answer was generated',
        request_id: requestId,
      });
    } catch (geminiErr) {
      const elapsed = Date.now() - startTime;
      const errorPayload = {
        event: 'audit_query_total_failure',
        request_id: requestId,
        elapsed_ms: elapsed,
        python_error: pythonError?.message || null,
        gemini_error: geminiErr.message,
      };

      telemetry('error', errorPayload);
      telemetry('error', {
        event: 'alert_required',
        request_id: requestId,
        message: 'Both Python RAG and Gemini fallback failed for /api/audit/query',
      });

      await sendAlert({
        ...errorPayload,
        level: 'critical',
        route: '/api/audit/query',
        happened_at: new Date().toISOString(),
      });

      return res.status(503).json({
        error: 'Huduma ya AI haipo sasa hivi. Tafadhali jaribu tena baadaye.',
        errorEn: 'AI service temporarily unavailable. Please try again.',
        code: 'AI_SERVICE_UNAVAILABLE',
        request_id: requestId,
      });
    }
  });

  router.post('/ingest', async (req, res) => {
    const token = req.headers['x-admin-token'] || req.headers.authorization?.replace('Bearer ', '');
    const adminToken = process.env.ADMIN_TOKEN;

    if (!adminToken || token !== adminToken) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    try {
      const pyRes = await fetchImpl(`${aiUrl}/ingest`, {
        method: 'POST',
        headers: { ...req.headers, 'x-admin-token': token || '' },
        body: req,
        duplex: 'half',
      });

      const data = await pyRes.json();
      return res.status(pyRes.status).json(data);
    } catch (err) {
      logger.error(`[AUDIT INGEST] Error: ${err.message}`);
      return res.status(503).json({ error: 'Python ingestion service unreachable' });
    }
  });

  router.get('/documents', async (req, res) => {
    try {
      // 20s, not 5s: on a cold container this call is what wakes the service,
      // and a 5s budget meant the UI's document list sat on "Loading…" forever.
      const pyRes = await fetchImpl(`${aiUrl}/documents`, { signal: AbortSignal.timeout(20000) });
      if (!pyRes.ok) throw new Error(`HTTP ${pyRes.status}`);
      const data = await pyRes.json();
      return res.json(data);
    } catch {
      // Do not invent an inventory. This used to answer with a single
      // fabricated entry named OAG_BUILTIN_NANDI_KNOWLEDGE — the hand-written
      // summary that was retired — so a page that could not reach the index at
      // all still told the reader a document was indexed and ready to be cited.
      // An unreachable index is a fact the reader should get straight.
      return res.status(503).json({
        error: 'Document index unreachable',
        count: 0,
        documents: [],
      });
    }
  });

  router.get('/status', async (req, res) => {
    try {
      const pyRes = await fetchImpl(`${aiUrl}/health`, { signal: AbortSignal.timeout(12000) });
      const data = await pyRes.json();
      return res.json({ python_service: 'online', ...data, fallback: 'unsourced-answer-refused' });
    } catch {
      return res.json({
        python_service: 'offline',
        fallback: 'unsourced-answer-refused',
        note: 'Direct Gemini fallback active',
      });
    }
  });

  return router;
}

export { validateAuditConfig };

// IMPORTANT: Do NOT call createAuditRouter() here at module load time.
// ES module imports are hoisted and execute BEFORE dotenv.config() runs in server.js,
// so process.env.GEMINI_API_KEY would always be undefined at instantiation.
// Instead we create the router lazily on the first request so all env vars are loaded.
let _router;
function getLazyRouter() {
  if (!_router) _router = createAuditRouter();
  return _router;
}

const lazyRouter = express.Router();
lazyRouter.use((req, res, next) => getLazyRouter()(req, res, next));

export default lazyRouter;
