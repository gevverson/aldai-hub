import assert from 'node:assert/strict';
import { once } from 'node:events';
import test from 'node:test';

import express from 'express';
import { createAuditRouter } from '../routes/audit.js';

async function withServer(router, run) {
  const app = express();
  app.use(express.json());
  app.use('/api/audit', router);

  const server = app.listen(0);
  await once(server, 'listening');

  const { port } = server.address();
  const baseUrl = `http://127.0.0.1:${port}`;

  try {
    await run(baseUrl);
  } finally {
    server.close();
    await once(server, 'close');
  }
}

test('returns Python RAG answer when upstream succeeds', async () => {
  const router = createAuditRouter({
    aiUrl: 'http://python.local',
    fetchImpl: async (url) => {
      if (url === 'http://python.local/query') {
        return new Response(JSON.stringify({
          answer: 'python answer',
          sources: [{ document: 'Doc A', page: 1 }],
          language: 'en',
          model: 'rag-model',
        }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      throw new Error(`unexpected URL ${url}`);
    },
    geminiFallbackFn: async () => ({ answer: 'fallback answer', model: 'gemini' }),
  });

  await withServer(router, async (baseUrl) => {
    const res = await fetch(`${baseUrl}/api/audit/query`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question: 'Where was the money spent?', language: 'en' }),
    });

    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.success, true);
    assert.equal(body.service, 'python-rag');
    assert.equal(body.answer, 'python answer');
  });
});

test('falls back to Gemini direct answer when Python RAG fails', async () => {
  const router = createAuditRouter({
    aiUrl: 'http://python.local',
    fetchImpl: async (url) => {
      if (url === 'http://python.local/query') {
        throw new Error('connect ECONNRESET');
      }
      throw new Error(`unexpected URL ${url}`);
    },
    geminiFallbackFn: async () => ({
      answer: 'gemini fallback answer',
      model: 'gemini-2.0-flash-direct',
      sources: [],
    }),
  });

  await withServer(router, async (baseUrl) => {
    const res = await fetch(`${baseUrl}/api/audit/query`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question: 'Nini kilitokea?', language: 'sw' }),
    });

    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.success, true);
    assert.equal(body.service, 'gemini-direct-fallback');
    assert.equal(body.answer, 'gemini fallback answer');
  });
});

test('returns 503 with structured code when both Python and Gemini fail', async () => {
  const router = createAuditRouter({
    aiUrl: 'http://python.local',
    fetchImpl: async () => {
      throw new Error('Python service unavailable');
    },
    geminiFallbackFn: async () => {
      throw new Error('Gemini quota exhausted');
    },
  });

  await withServer(router, async (baseUrl) => {
    const res = await fetch(`${baseUrl}/api/audit/query`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question: 'Tell me about Kimaren', language: 'en' }),
    });

    assert.equal(res.status, 503);
    const body = await res.json();
    assert.equal(body.code, 'AI_SERVICE_UNAVAILABLE');
    assert.ok(body.request_id);
  });
});
