import { useState, useRef, useEffect, useCallback } from 'react';
import { Link, useLocation } from 'react-router-dom';

/* ═══════════════════════════════════════════════════════════
   CONSTANTS
═══════════════════════════════════════════════════════════ */
const MAX_CHARS   = 500;
const HISTORY_KEY = 'mym_audit_history'; // localStorage only — never sent to server

const SUGGESTED_QUESTIONS = [
  { sw: 'Pesa ngapi ilitumika kwa hospitali ya Kobujoi?',   en: 'How much was spent on Kobujoi Hospital?',        ward: 'Kobujoi' },
  { sw: 'Shule ya Kimaren Girls iko wapi?',                  en: 'Where is Kimaren Girls Secondary School?',        ward: 'Kemeloi-Maraba' },
  { sw: 'Nini kilitokea na pesa za payroll ya kaunti?',      en: 'What happened to the county payroll money?',      ward: null },
  { sw: 'Miradi ipi iliachwa bila kukamilika Aldai?',        en: 'Which projects were abandoned incomplete in Aldai?', ward: null },
  { sw: 'Wafanyakazi wa kisimu wangapi waligunduliwa?',      en: 'How many ghost workers were discovered?',         ward: null },
  { sw: 'Bursari za wanafunzi zilienda wapi?',               en: 'Where did the student bursaries go?',             ward: null },
];

const SEVERITY_META = {
  'MUHIMU SANA': { color: '#DC2626', bg: 'rgba(220,38,38,0.15)', label: '🔴 MUHIMU SANA (Critical)' },
  'CRITICAL':    { color: '#DC2626', bg: 'rgba(220,38,38,0.15)', label: '🔴 CRITICAL' },
  'JUU':         { color: '#F59E0B', bg: 'rgba(245,158,11,0.15)', label: '🟠 JUU (High)' },
  'HIGH':        { color: '#F59E0B', bg: 'rgba(245,158,11,0.15)', label: '🟠 HIGH' },
  'KATI':        { color: '#D97706', bg: 'rgba(217,119,6,0.15)',  label: '🟡 KATI (Medium)' },
  'MEDIUM':      { color: '#D97706', bg: 'rgba(217,119,6,0.15)',  label: '🟡 MEDIUM' },
  'CHINI':       { color: '#6B7280', bg: 'rgba(107,114,128,0.15)', label: '⚪ CHINI (Low)' },
  'LOW':         { color: '#6B7280', bg: 'rgba(107,114,128,0.15)', label: '⚪ LOW' },
};

/* ═══════════════════════════════════════════════════════════
   PARSE STRUCTURED ANSWER
   Parses Gemini's emoji-section formatted text into blocks
═══════════════════════════════════════════════════════════ */
function parseAnswer(text) {
  if (!text) return null;

  const sectionPatterns = [
    { key: 'jibu',     regex: /📋[^\n]*\n([\s\S]*?)(?=💰|📍|🚨|📄|👉|$)/,    label: '📋 JIBU',     labelEn: 'Answer' },
    { key: 'pesa',     regex: /💰[^\n]*\n([\s\S]*?)(?=📍|🚨|📄|👉|$)/,        label: '💰 PESA',     labelEn: 'Money Involved' },
    { key: 'mahali',   regex: /📍[^\n]*\n([\s\S]*?)(?=🚨|📄|👉|$)/,           label: '📍 MAHALI',   labelEn: 'Where' },
    { key: 'uzito',    regex: /🚨[^\n]*\n([\s\S]*?)(?=📄|👉|$)/,              label: '🚨 UZITO',    labelEn: 'Severity' },
    { key: 'chanzo',   regex: /📄[^\n]*\n([\s\S]*?)(?=👉|$)/,                 label: '📄 CHANZO',   labelEn: 'Source' },
    { key: 'action',   regex: /👉[^\n]*\n([\s\S]*?)$/,                         label: '👉 ACTION',   labelEn: 'What You Can Do' },
  ];

  const sections = {};
  for (const { key, regex } of sectionPatterns) {
    const match = text.match(regex);
    if (match) sections[key] = match[1].trim();
  }

  // Detect severity keyword in uzito block
  let severityKey = null;
  if (sections.uzito) {
    for (const key of Object.keys(SEVERITY_META)) {
      if (sections.uzito.toUpperCase().includes(key)) {
        severityKey = key;
        break;
      }
    }
  }

  return { sections, severityKey, raw: text };
}

/* ═══════════════════════════════════════════════════════════
   AI RESPONSE CARD
═══════════════════════════════════════════════════════════ */
const SectionBlock = ({ icon, swLabel, enLabel, content, accent }) => (
  <div
    className="rounded-xl p-4"
    style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid #1F2937' }}
  >
    <p
      className="font-bold uppercase tracking-widest mb-2"
      style={{ color: accent || '#D97706', fontSize: '10px', fontFamily: "'DM Sans', sans-serif" }}
    >
      {icon} {swLabel} <span style={{ color: '#4B5563', fontWeight: 400 }}>/ {enLabel}</span>
    </p>
    <p
      className="leading-relaxed whitespace-pre-wrap"
      style={{ color: '#E5E7EB', fontSize: '14px', fontFamily: "'DM Sans', sans-serif" }}
    >
      {content}
    </p>
  </div>
);

const ResponseCard = ({ message }) => {
  const parsed = parseAnswer(message.answer);
  const sev    = parsed?.severityKey ? SEVERITY_META[parsed.severityKey] : null;
  const [copied, setCopied] = useState(false);

  const copyAnswer = () => {
    navigator.clipboard.writeText(message.answer || '').then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  if (!parsed || Object.keys(parsed.sections).length === 0) {
    // Raw text fallback (un-parseable response)
    return (
      <div
        className="rounded-2xl p-6"
        style={{ background: '#111827', border: '1px solid #1F2937' }}
      >
        <div className="flex items-center gap-2 mb-4">
          <span className="text-xl">🤖</span>
          <span className="font-display text-white" style={{ fontSize: '16px' }}>
            Ukweli Uliobainika
          </span>
          {message.service === 'python-rag' && (
            <span
              className="ml-auto text-xs font-bold px-2 py-0.5 rounded-full"
              style={{ background: 'rgba(22,163,74,0.15)', color: '#4ADE80', border: '1px solid rgba(22,163,74,0.3)' }}
            >
              RAG
            </span>
          )}
        </div>
        <p className="leading-relaxed text-gray-300 whitespace-pre-wrap" style={{ fontSize: '14px', fontFamily: "'DM Sans', sans-serif" }}>
          {message.answer}
        </p>
      </div>
    );
  }

  const { sections } = parsed;

  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{ background: '#111827', border: '1px solid #1F2937' }}
    >
      {/* Header bar */}
      <div
        className="px-5 py-3 flex items-center justify-between gap-3"
        style={{ background: '#0D1117', borderBottom: '1px solid #1F2937' }}
      >
        <div className="flex items-center gap-2">
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center text-sm"
            style={{ background: 'rgba(217,119,6,0.15)' }}
          >
            🤖
          </div>
          <span
            className="font-display text-white"
            style={{ fontSize: '15px' }}
          >
            Ukweli Uliobainika
          </span>
          <span
            className="text-xs font-semibold"
            style={{ color: '#4B5563', fontFamily: "'DM Sans', sans-serif" }}
          >
            Truth Verified
          </span>
        </div>
        <div className="flex items-center gap-2">
          {message.service === 'python-rag' && (
            <span
              className="text-xs font-bold px-2 py-0.5 rounded-full"
              style={{ background: 'rgba(22,163,74,0.12)', color: '#4ADE80', border: '1px solid rgba(22,163,74,0.25)', fontFamily: "'DM Sans', sans-serif" }}
            >
              📡 RAG
            </span>
          )}
          {message.response_time_ms && (
            <span
              className="text-xs font-mono-jet"
              style={{ color: '#4B5563' }}
            >
              {message.response_time_ms}ms
            </span>
          )}
        </div>
      </div>

      {/* Severity banner */}
      {sev && (
        <div
          className="px-5 py-2 flex items-center gap-2"
          style={{ background: sev.bg, borderBottom: `1px solid ${sev.color}25` }}
        >
          <span
            className="font-bold uppercase tracking-widest"
            style={{ color: sev.color, fontSize: '11px', fontFamily: "'DM Sans', sans-serif" }}
          >
            {sev.label}
          </span>
        </div>
      )}

      {/* Content sections */}
      <div className="p-5 flex flex-col gap-3">
        {sections.jibu && (
          <SectionBlock icon="📋" swLabel="JIBU" enLabel="Answer" content={sections.jibu} accent="#D97706" />
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {sections.pesa && (
            <SectionBlock icon="💰" swLabel="PESA" enLabel="Money Involved" content={sections.pesa} accent="#FCA5A5" />
          )}
          {sections.mahali && (
            <SectionBlock icon="📍" swLabel="MAHALI" enLabel="Where" content={sections.mahali} accent="#60A5FA" />
          )}
        </div>

        {sections.uzito && (
          <SectionBlock icon="🚨" swLabel="UZITO" enLabel="Severity" content={sections.uzito} accent={sev?.color || '#F59E0B'} />
        )}

        {sections.chanzo && (
          <div
            className="rounded-xl p-4"
            style={{ background: 'rgba(217,119,6,0.06)', border: '1px solid rgba(217,119,6,0.2)' }}
          >
            <p
              className="font-bold uppercase tracking-widest mb-1"
              style={{ color: '#D97706', fontSize: '10px', fontFamily: "'DM Sans', sans-serif" }}
            >
              📄 CHANZO / Source
            </p>
            <p
              className="leading-relaxed"
              style={{ color: '#FCD34D', fontSize: '13px', fontFamily: "'JetBrains Mono', monospace" }}
            >
              {sections.chanzo}
            </p>
          </div>
        )}

        {sections.action && (
          <div
            className="rounded-xl p-4"
            style={{ background: 'rgba(22,163,74,0.06)', border: '1px solid rgba(22,163,74,0.2)' }}
          >
            <p
              className="font-bold uppercase tracking-widest mb-2"
              style={{ color: '#4ADE80', fontSize: '10px', fontFamily: "'DM Sans', sans-serif" }}
            >
              👉 UNACHOWEZA KUFANYA / What You Can Do
            </p>
            <p
              className="leading-relaxed whitespace-pre-wrap"
              style={{ color: '#D1FAE5', fontSize: '13px', fontFamily: "'DM Sans', sans-serif" }}
            >
              {sections.action}
            </p>
          </div>
        )}
      </div>

      {/* Source citations from RAG */}
      {message.sources?.length > 0 && (
        <div
          className="px-5 pb-4 flex flex-wrap gap-2"
          style={{ borderTop: '1px solid #1F2937', paddingTop: '12px' }}
        >
          <span style={{ color: '#4B5563', fontSize: '10px', fontFamily: "'DM Sans', sans-serif", lineHeight: '24px' }}>
            Sources:
          </span>
          {message.sources.slice(0, 3).map((s, i) => (
            <span
              key={i}
              className="text-xs px-2 py-0.5 rounded-full"
              style={{
                background: 'rgba(217,119,6,0.1)',
                color: '#FCD34D',
                border: '1px solid rgba(217,119,6,0.2)',
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: '10px',
              }}
            >
              {s.document} p.{s.page}
            </span>
          ))}
        </div>
      )}

      {/* Action buttons */}
      <div
        className="px-5 py-3 flex flex-wrap gap-2"
        style={{ background: '#0D1117', borderTop: '1px solid #1F2937' }}
      >
        <a
          href="tel:0800720629"
          className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full transition-all"
          style={{
            background: 'rgba(220,38,38,0.12)',
            color: '#FCA5A5',
            border: '1px solid rgba(220,38,38,0.25)',
            fontFamily: "'DM Sans', sans-serif",
          }}
        >
          📞 EACC: 0800 720 629
        </a>
        <button
          onClick={copyAnswer}
          className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full transition-all"
          style={{
            background: copied ? 'rgba(34,197,94,0.12)' : 'rgba(255,255,255,0.05)',
            color: copied ? '#4ADE80' : '#9CA3AF',
            border: `1px solid ${copied ? 'rgba(34,197,94,0.3)' : 'rgba(255,255,255,0.1)'}`,
            fontFamily: "'DM Sans', sans-serif",
          }}
        >
          {copied ? '✅ Nakili!' : '📋 Nakili Jibu'}
        </button>
        <Link
          to="/report"
          className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full transition-all"
          style={{
            background: 'rgba(217,119,6,0.1)',
            color: '#FCD34D',
            border: '1px solid rgba(217,119,6,0.25)',
            fontFamily: "'DM Sans', sans-serif",
          }}
        >
          🚨 Ripoti Tatizo Hili
        </Link>
      </div>
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════
   LOADING STATE
═══════════════════════════════════════════════════════════ */
/* Module-level: a fixed list, so it does not need to be rebuilt on every render
   (and the interval below can depend on it without re-subscribing). */
const LOADING_PHRASES = [
  'AI inasoma hati za OAG…',
  'Inatafuta ukweli…',
  'Inachambua ripoti…',
  'Inakusanya ushahidi…',
];

const LoadingDots = () => {
  const [dots, setDots] = useState(0);
  const [phraseIdx, setPhraseIdx] = useState(0);

  useEffect(() => {
    const d = setInterval(() => setDots((p) => (p + 1) % 4), 400);
    const p = setInterval(() => setPhraseIdx((i) => (i + 1) % LOADING_PHRASES.length), 2000);
    return () => { clearInterval(d); clearInterval(p); };
  }, []);

  return (
    <div
      className="rounded-2xl p-5 flex items-center gap-4"
      style={{ background: '#111827', border: '1px solid #1F2937' }}
    >
      <div className="flex gap-1.5 flex-shrink-0">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="w-2.5 h-2.5 rounded-full"
            style={{
              background: '#D97706',
              animation: `bounce 1.2s ease-in-out ${i * 0.15}s infinite`,
            }}
          />
        ))}
      </div>
      <p
        className="italic"
        style={{ color: '#6B7280', fontSize: '14px', fontFamily: "'DM Sans', sans-serif" }}
      >
        {LOADING_PHRASES[phraseIdx]}{''.padEnd(dots, '.')}
      </p>
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════
   DOCUMENT INVENTORY
═══════════════════════════════════════════════════════════ */
const DocumentInventory = () => {
  const [docs, setDocs]   = useState([]);
  const [status, setStatus] = useState(null);
  // 'loading' → 'ready' | 'error'. Without this the panel showed "Loading…"
  // for an empty list, a failed fetch and a genuine zero alike, so a service
  // that was answering nothing looked indistinguishable from one still
  // starting up. On this page in particular, "we hold no documents" is a
  // thing the reader is entitled to know.
  const [docsState, setDocsState] = useState('loading');

  useEffect(() => {
    fetch('/api/audit/documents')
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`))))
      .then((d) => { setDocs(d?.documents || []); setDocsState('ready'); })
      .catch(() => setDocsState('error'));

    fetch('/api/audit/status')
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => { if (d) setStatus(d); })
      .catch(() => {});
  }, []);

  const isOnline = status?.python_service === 'online';

  return (
    <div
      className="rounded-xl p-4 flex flex-col gap-2"
      style={{ background: '#0D1117', border: '1px solid #1F2937' }}
    >
      <div className="flex items-center justify-between">
        <p
          className="font-bold uppercase tracking-widest"
          style={{ color: '#4B5563', fontSize: '10px', fontFamily: "'DM Sans', sans-serif" }}
        >
          Hati zilizo katika mfumo / Documents Indexed
        </p>
        <div className="flex items-center gap-1.5">
          <span
            className="w-1.5 h-1.5 rounded-full"
            style={{ background: isOnline ? '#4ADE80' : '#F59E0B' }}
          />
          <span
            style={{ color: isOnline ? '#4ADE80' : '#F59E0B', fontSize: '10px', fontFamily: "'DM Sans', sans-serif" }}
          >
            {isOnline ? 'RAG Online' : 'Direct Gemini'}
          </span>
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        {docs.length === 0 ? (
          <span style={{ color: '#6B7280', fontSize: '12px', fontFamily: "'DM Sans', sans-serif" }}>
            {docsState === 'loading'
              ? 'Loading…'
              : docsState === 'error'
                ? 'Could not reach the document index.'
                : 'No documents indexed — the AI cannot answer questions yet.'}
          </span>
        ) : docs.map((d, i) => (
          <span
            key={i}
            className="text-xs px-2 py-0.5 rounded-full"
            style={{
              background: 'rgba(217,119,6,0.08)',
              color: '#9CA3AF',
              border: '1px solid #1F2937',
              fontFamily: "'DM Sans', sans-serif",
            }}
          >
            {d.document_name === 'OAG_BUILTIN_NANDI_KNOWLEDGE'
              ? '📚 OAG Nandi/Aldai Built-in (2018–2024)'
              : `📄 ${d.document_name} (${d.year})`}
          </span>
        ))}
      </div>
      <p
        style={{ color: '#374151', fontSize: '10px', fontFamily: "'DM Sans', sans-serif" }}
      >
        Powered by official Kenya Office of the Auditor-General (OAG) reports.
      </p>
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════
   MAIN PAGE
═══════════════════════════════════════════════════════════ */
const AuditTranslator = () => {
  const location = useLocation();

  // State
  const [question, setQuestion]     = useState('');
  const [language, setLanguage]     = useState('en'); // default English
  const [messages, setMessages]     = useState([]);
  const [loading, setLoading]       = useState(false);
  const [history, setHistory]       = useState(() => {
    try { return JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]'); } catch { return []; }
  });
  const [showHistory, setShowHistory] = useState(false);

  const bottomRef    = useRef(null);
  const textareaRef  = useRef(null);

  // Pre-fill from navigation state (e.g. from /report page)
  useEffect(() => {
    if (location.state?.prefill) {
      setQuestion(location.state.prefill);
      textareaRef.current?.focus();
    }
  }, [location.state]);

  // Wake the RAG service as soon as the page opens.
  //
  // The free tier sleeps after 15 minutes of inactivity and takes roughly a
  // minute to come back, so the first question of the day is usually the one
  // that pays for the wake-up — and often fails while the container is still
  // booting. Someone reading the page and typing a question spends far longer
  // than that, so starting the service now means it is normally ready by the
  // time they press send. Fire-and-forget: a failure here changes nothing, the
  // query path retries a cold start on its own.
  useEffect(() => {
    const cancel = new AbortController();
    fetch('/api/audit/status', { signal: cancel.signal }).catch(() => {});
    return () => cancel.abort();
  }, []);

  // Auto-scroll to bottom
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  // Persist history to localStorage
  useEffect(() => {
    try { localStorage.setItem(HISTORY_KEY, JSON.stringify(history.slice(0, 5))); }
    catch { /* private mode or quota exceeded — history is a convenience, not data */ }
  }, [history]);

  const submitQuestion = useCallback(async (q) => {
    const text = (q || question).trim();
    if (!text || loading) return;

    // Add user message
    const userMsg = { type: 'user', text, lang: language };
    setMessages((prev) => [...prev, userMsg]);
    setQuestion('');
    setLoading(true);

    // Add to session history (localStorage only, never sent to server)
    setHistory((prev) => [{ text, lang: language, ts: Date.now() }, ...prev].slice(0, 5));

    try {
      const res = await fetch('/api/audit/query', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ question: text, language }),
      });

      const data = await res.json();

      if (!res.ok || data.error) {
        throw new Error(data.error || data.errorEn || 'API error');
      }

      setMessages((prev) => [
        ...prev,
        {
          type:             'ai',
          answer:           data.answer,
          sources:          data.sources || [],
          response_time_ms: data.response_time_ms,
          model:            data.model,
          service:          data.service,
        },
      ]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          type:  'error',
          text:  err.message?.includes('Rate limit')
            ? 'Umefika kikomo cha maswali (20 kwa saa). Jaribu baadaye.\n(Rate limit reached. Try again in 1 hour.)'
            : 'Samahani — huduma ya AI haipo sasa hivi. Tafadhali jaribu tena.\n(Sorry — AI service temporarily unavailable. Please try again.)',
        },
      ]);
    } finally {
      setLoading(false);
    }
  }, [question, language, loading]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      submitQuestion();
    }
  };

  const charCount = question.length;
  const charRatio = charCount / MAX_CHARS;

  return (
    <div
      className="min-h-screen py-10 px-4 sm:px-6 lg:px-8"
      style={{ background: '#0A0A0A' }}
    >
      {/* Subtle scanline texture */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.008) 2px, rgba(255,255,255,0.008) 4px)',
          zIndex: 0,
        }}
      />

      <div className="relative z-10 max-w-3xl mx-auto">

        {/* ── Page Header ── */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center text-xl"
              style={{ background: 'rgba(217,119,6,0.15)', border: '1px solid rgba(217,119,6,0.25)' }}
            >
              🤖
            </div>
            <div>
              <h1
                className="font-display text-white leading-none"
                style={{ fontSize: 'clamp(20px, 4vw, 28px)' }}
              >
                AI AUDIT TRANSLATOR
              </h1>
              <p
                style={{ color: '#D97706', fontSize: '11px', fontFamily: "'DM Sans', sans-serif", marginTop: '2px', fontStyle: 'italic' }}
              >
                Mfumo wa Ukaguzi wa AI
              </p>
            </div>
          </div>
          <p
            className="mb-1"
            style={{ color: '#9CA3AF', fontSize: '15px', fontFamily: "'DM Sans', sans-serif" }}
          >
            Ask any question about Nandi County public funds — in English or Swahili.
            AI will answer from official Auditor-General documents.
          </p>
          <p
            style={{ color: '#4B5563', fontSize: '13px', fontFamily: "'DM Sans', sans-serif" }}
          >
            Uliza swali lolote kuhusu pesa za umma za Nandi County.
          </p>
        </div>

        {/* ── Suggested Questions ── */}
        {messages.length === 0 && (
          <div className="mb-8">
            <p
              className="font-bold uppercase tracking-widest mb-3"
              style={{ color: '#4B5563', fontSize: '10px', fontFamily: "'DM Sans', sans-serif" }}
            >
              Maswali ya kawaida / Common questions — click to ask
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {SUGGESTED_QUESTIONS.map((q, i) => (
                <button
                  key={i}
                  onClick={() => {
                    setQuestion(language === 'sw' ? q.sw : q.en);
                    textareaRef.current?.focus();
                  }}
                  disabled={loading}
                  className="text-left p-3 rounded-xl transition-all duration-200 group"
                  style={{
                    background: '#111827',
                    border: '1px solid #1F2937',
                    fontFamily: "'DM Sans', sans-serif",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = 'rgba(217,119,6,0.4)';
                    e.currentTarget.style.background  = '#1a2436';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = '#1F2937';
                    e.currentTarget.style.background  = '#111827';
                  }}
                >
                  <p style={{ color: '#D1D5DB', fontSize: '13px' }}>
                    &ldquo;{language === 'sw' ? q.sw : q.en}&rdquo;
                  </p>
                  {q.ward && (
                    <p
                      className="mt-1 text-xs"
                      style={{ color: '#D97706', fontFamily: "'JetBrains Mono', monospace" }}
                    >
                      📍 {q.ward} Ward
                    </p>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── Conversation Thread ── */}
        {messages.length > 0 && (
          <div className="flex flex-col gap-4 mb-6">
            {messages.map((msg, idx) => (
              <div key={idx}>
                {msg.type === 'user' && (
                  <div className="flex justify-end">
                    <div
                      className="rounded-2xl rounded-tr-sm px-5 py-3 max-w-[85%]"
                      style={{ background: 'rgba(217,119,6,0.15)', border: '1px solid rgba(217,119,6,0.25)' }}
                    >
                      <p style={{ color: '#FCD34D', fontSize: '14px', fontFamily: "'DM Sans', sans-serif" }}>
                        {msg.text}
                      </p>
                      <p
                        className="mt-1"
                        style={{ color: '#92400E', fontSize: '10px', fontFamily: "'DM Sans', sans-serif" }}
                      >
                        {msg.lang === 'sw' ? '🇰🇪 Swahili' : '🇬🇧 English'}
                      </p>
                    </div>
                  </div>
                )}

                {msg.type === 'ai' && (
                  <ResponseCard message={msg} />
                )}

                {msg.type === 'error' && (
                  <div
                    className="rounded-2xl p-4"
                    style={{ background: 'rgba(220,38,38,0.08)', border: '1px solid rgba(220,38,38,0.2)' }}
                  >
                    <p style={{ color: '#FCA5A5', fontSize: '14px', fontFamily: "'DM Sans', sans-serif", whiteSpace: 'pre-wrap' }}>
                      ⚠️ {msg.text}
                    </p>
                  </div>
                )}
              </div>
            ))}

            {loading && <LoadingDots />}
            <div ref={bottomRef} />
          </div>
        )}

        {loading && messages.length === 0 && (
          <div className="mb-6">
            <LoadingDots />
            <div ref={bottomRef} />
          </div>
        )}

        {/* ── Input Area ── */}
        <div
          className="rounded-2xl overflow-hidden sticky bottom-6"
          style={{ background: '#111827', border: '1px solid #1F2937' }}
        >
          {/* Language toggle */}
          <div
            className="flex items-center justify-between px-4 py-2"
            style={{ borderBottom: '1px solid #1F2937', background: '#0D1117' }}
          >
            <div className="flex items-center gap-1">
              {[
                { code: 'en', flag: '🇬🇧', label: 'English' },
                { code: 'sw', flag: '🇰🇪', label: 'Kiswahili' },
              ].map(({ code, flag, label }) => (
                <button
                  key={code}
                  onClick={() => setLanguage(code)}
                  className="flex items-center gap-1.5 px-3 py-1 rounded-lg transition-all"
                  style={{
                    background: language === code ? 'rgba(217,119,6,0.15)' : 'transparent',
                    color:      language === code ? '#D97706' : '#6B7280',
                    border:     language === code ? '1px solid rgba(217,119,6,0.3)' : '1px solid transparent',
                    fontSize:   '12px',
                    fontFamily: "'DM Sans', sans-serif",
                    fontWeight: language === code ? 700 : 400,
                  }}
                >
                  {flag} {label}
                </button>
              ))}
            </div>
            <span
              style={{
                color: charRatio > 0.9 ? '#DC2626' : charRatio > 0.7 ? '#D97706' : '#4B5563',
                fontSize: '11px',
                fontFamily: "'JetBrains Mono', monospace",
              }}
            >
              {charCount}/{MAX_CHARS}
            </span>
          </div>

          {/* Textarea */}
          <textarea
            ref={textareaRef}
            value={question}
            onChange={(e) => setQuestion(e.target.value.slice(0, MAX_CHARS))}
            onKeyDown={handleKeyDown}
            placeholder={
              language === 'sw'
                ? 'Andika swali lako hapa… (Ctrl+Enter kutuma)'
                : 'Type your question here… (Ctrl+Enter to submit)'
            }
            rows={3}
            disabled={loading}
            className="w-full resize-none outline-none bg-transparent px-5 pt-4 pb-2"
            style={{
              color:       '#F9FAFB',
              fontSize:    '15px',
              fontFamily:  "'DM Sans', sans-serif",
              lineHeight:  1.6,
              caretColor:  '#D97706',
            }}
          />

          {/* Submit row */}
          <div className="flex items-center justify-between px-4 pb-3 pt-1">
            <p
              style={{ color: '#374151', fontSize: '11px', fontFamily: "'DM Sans', sans-serif" }}
            >
              Maswali yako hayahifadhiwa · Your questions are not stored
            </p>
            <button
              onClick={() => submitQuestion()}
              disabled={loading || !question.trim()}
              className="flex items-center gap-2 font-bold rounded-xl px-5 py-2.5 transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
              style={{
                background: (!loading && question.trim()) ? 'linear-gradient(135deg, #D97706, #F59E0B)' : '#1F2937',
                color:      (!loading && question.trim()) ? '#0A0A0A' : '#4B5563',
                fontSize:   '13px',
                fontFamily: "'DM Sans', sans-serif",
                boxShadow:  (!loading && question.trim()) ? '0 4px 14px rgba(217,119,6,0.3)' : 'none',
                transform:  (!loading && question.trim()) ? 'translateY(0)' : undefined,
              }}
            >
              {loading ? (
                <>
                  <div
                    className="w-4 h-4 rounded-full border-2 border-transparent"
                    style={{ borderTopColor: '#D97706', animation: 'spin 0.8s linear infinite' }}
                  />
                  Inatafuta…
                </>
              ) : (
                <>TAFUTA UKWELI →</>
              )}
            </button>
          </div>
        </div>

        {/* ── Session History (localStorage only) ── */}
        {history.length > 0 && (
          <div className="mt-4">
            <button
              onClick={() => setShowHistory((v) => !v)}
              className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest transition-colors"
              style={{ color: '#4B5563', fontFamily: "'DM Sans', sans-serif" }}
            >
              <span>{showHistory ? '▾' : '▸'}</span>
              Historia ya Maswali / Session History (localStorage tu · never sent to server)
            </button>
            {showHistory && (
              <div className="mt-2 flex flex-col gap-1.5">
                {history.map((h, i) => (
                  <button
                    key={i}
                    onClick={() => submitQuestion(h.text)}
                    disabled={loading}
                    className="text-left px-3 py-2 rounded-lg text-xs transition-all"
                    style={{
                      background: '#111827',
                      border: '1px solid #1F2937',
                      color: '#9CA3AF',
                      fontFamily: "'DM Sans', sans-serif",
                    }}
                  >
                    {h.lang === 'sw' ? '🇰🇪' : '🇬🇧'} "{h.text}"
                    <span style={{ color: '#4B5563', marginLeft: '8px' }}>
                      {new Date(h.ts).toLocaleTimeString('en-KE', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Document Inventory ── */}
        <div className="mt-6">
          <DocumentInventory />
        </div>
      </div>

      {/* Bounce animation */}
      <style>{`
        @keyframes bounce {
          0%, 80%, 100% { transform: translateY(0); }
          40%            { transform: translateY(-8px); }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default AuditTranslator;
