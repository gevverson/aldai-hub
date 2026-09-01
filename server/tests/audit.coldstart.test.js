/**
 * Cold-start retry.
 *
 * The free tier sleeps after 15 minutes and the keep-alive workflow does not
 * prevent it (GitHub throttles scheduled runs to a measured ~4-hour median), so
 * the first request of the day is usually the one that wakes the service. Render
 * fails it fast with a 502 while the container boots. Retrying that is nearly
 * free and normally succeeds.
 *
 * The distinction these tests protect: a *timeout* must never be retried. That
 * means the service is awake and slow, and a second 75-second wait only makes a
 * citizen wait twice to be told the same thing.
 */
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
  try {
    await run(`http://127.0.0.1:${server.address().port}`);
  } finally {
    server.close();
    await once(server, 'close');
  }
}

const ask = (baseUrl) => fetch(`${baseUrl}/api/audit/query`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ question: 'What did the auditor find in Aldai?', language: 'en' }),
});

const ragResponse = () => new Response(JSON.stringify({
  answer: 'cited answer',
  sources: [{ document: 'OAG Aldai NG-CDF FY2018/2019', page: 12 }],
  language: 'en',
  model: 'gemini-3.6-flash',
}), { status: 200, headers: { 'Content-Type': 'application/json' } });

test('a waking service (502) is retried, and the citizen gets the cited answer', async () => {
  let calls = 0;
  const router = createAuditRouter({
    aiUrl: 'http://python.local',
    fetchImpl: async (url) => {
      if (url !== 'http://python.local/query') throw new Error(`unexpected ${url}`);
      calls += 1;
      if (calls === 1) return new Response('Bad Gateway', { status: 502 });
      return ragResponse();
    },
    geminiFallbackFn: async () => ({ answer: 'REFUSED', model: 'unavailable', sources: [] }),
  });

  await withServer(router, async (baseUrl) => {
    const body = await (await ask(baseUrl)).json();
    assert.equal(calls, 2, 'the boot-time 502 should have been retried once');
    assert.equal(body.service, 'python-rag');
    assert.equal(body.answer, 'cited answer');
    assert.equal(body.sources.length, 1);
  });
});

test('a connection refused while booting is retried', async () => {
  let calls = 0;
  const router = createAuditRouter({
    aiUrl: 'http://python.local',
    fetchImpl: async () => {
      calls += 1;
      if (calls === 1) throw new Error('fetch failed: connect ECONNREFUSED 10.0.0.1:8002');
      return ragResponse();
    },
    geminiFallbackFn: async () => ({ answer: 'REFUSED', model: 'unavailable', sources: [] }),
  });

  await withServer(router, async (baseUrl) => {
    const body = await (await ask(baseUrl)).json();
    assert.equal(calls, 2);
    assert.equal(body.answer, 'cited answer');
  });
});

test('a timeout is NOT retried — the service is awake, just slow', async () => {
  let calls = 0;
  const router = createAuditRouter({
    aiUrl: 'http://python.local',
    fetchImpl: async () => {
      calls += 1;
      const err = new Error('The operation was aborted');
      err.name = 'AbortError';
      throw err;
    },
    geminiFallbackFn: async () => ({ answer: 'REFUSED', model: 'unavailable', sources: [] }),
  });

  await withServer(router, async (baseUrl) => {
    const body = await (await ask(baseUrl)).json();
    assert.equal(calls, 1, 'retrying a timeout doubles the wait for the same outcome');
    assert.equal(body.answer, 'REFUSED');
  });
});

test('a failure that took longer than the cold-start window is NOT retried', async () => {
  let calls = 0;
  const router = createAuditRouter({
    aiUrl: 'http://python.local',
    fetchImpl: async () => {
      calls += 1;
      const err = new Error('socket hang up');
      err.elapsedMs = 45_000;   // far past a cold start; the service was awake
      throw err;
    },
    geminiFallbackFn: async () => ({ answer: 'REFUSED', model: 'unavailable', sources: [] }),
  });

  await withServer(router, async (baseUrl) => {
    const body = await (await ask(baseUrl)).json();
    assert.equal(calls, 1);
    assert.equal(body.answer, 'REFUSED');
  });
});

test('a persistently down service still declines rather than improvising', async () => {
  let calls = 0;
  const router = createAuditRouter({
    aiUrl: 'http://python.local',
    fetchImpl: async () => {
      calls += 1;
      return new Response('Bad Gateway', { status: 502 });
    },
    geminiFallbackFn: async () => ({ answer: 'REFUSED', model: 'unavailable', sources: [] }),
  });

  await withServer(router, async (baseUrl) => {
    const body = await (await ask(baseUrl)).json();
    assert.equal(calls, 2, 'retried once, then gave up');
    assert.equal(body.answer, 'REFUSED');
    assert.deepEqual(body.sources, [], 'no sources must ever be invented');
  });
});

test('an unrecognised fast failure is retried — do not enumerate the upstream vocabulary', async () => {
  // The regression this file exists for. The first version of isColdStartFailure
  // matched on 502/503/504 and a list of error substrings. In production the
  // suspended service returned something that was on none of those lists, the
  // predicate said "not a cold start", and the retry never ran even once —
  // every first question of the day was lost. Speed, not vocabulary, decides.
  let calls = 0;
  const router = createAuditRouter({
    aiUrl: 'http://python.local',
    fetchImpl: async () => {
      calls += 1;
      if (calls === 1) throw new Error('upstream returned something nobody predicted');
      return ragResponse();
    },
    geminiFallbackFn: async () => ({ answer: 'REFUSED', model: 'unavailable', sources: [] }),
  });

  await withServer(router, async (baseUrl) => {
    const body = await (await ask(baseUrl)).json();
    assert.equal(calls, 2, 'a fast failure must be retried whatever it says');
    assert.equal(body.answer, 'cited answer');
  });
});

test('a decline reports why the RAG service was unreachable', async () => {
  const router = createAuditRouter({
    aiUrl: 'http://python.local',
    fetchImpl: async () => new Response('Bad Gateway', { status: 502 }),
    geminiFallbackFn: async () => ({ answer: 'REFUSED', model: 'unavailable', sources: [] }),
  });

  await withServer(router, async (baseUrl) => {
    const body = await (await ask(baseUrl)).json();
    assert.equal(body.upstream_status, 502, 'an operator must be able to see the cause');
    assert.equal(typeof body.upstream_ms, 'number');
    assert.ok(!JSON.stringify(body).includes('python.local'), 'must not leak the internal URL');
  });
});
