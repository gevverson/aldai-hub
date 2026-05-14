import { useState, useEffect, useRef } from 'react';

/* ── Hardcoded audit alerts — always shown even if API is down ── */
const STATIC_ALERTS = [
  '🚨 GHOST PROJECT: Kimaren Girls Secondary — Ksh 3.2M disbursed. School does not exist.',
  '⚠️ STALLED: Kapsabet Mother & Baby Unit — Ksh 208.8M paid. Incomplete past deadline.',
  '🔴 144 public health facilities shut down across Nandi County.',
  '💰 Ksh 3.3 BILLION payroll fraud — 1,885 ghost workers. Active EACC investigation.',
  '🏭 Kabiyet Dairy Creamery — Ksh 621M spent. Non-operational after 8 YEARS.',
  '📚 Ksh 50.2M student bursaries sent with NO acknowledgement receipts.',
  '🏥 Kapsabet County Hospital — Medical insurance Ksh 175M awarded BEFORE tender evaluation.',
  '🏫 Land purchased for schools — NO title deeds transferred. Suspected laundering.',
];

const AlertTicker = () => {
  const [alerts, setAlerts]   = useState(STATIC_ALERTS);
  const trackRef              = useRef(null);

  /* Optionally merge live critical alerts from API */
  useEffect(() => {
    const merge = (liveData) => {
      if (!Array.isArray(liveData) || liveData.length === 0) return;
      const liveAlerts = liveData.map(
        (p) => `🚨 LIVE: ${p.name} — ${p.ward} Ward — ${p.communityStatus || p.status}`
      );
      setAlerts([...liveAlerts, ...STATIC_ALERTS]);
    };

    fetch('/api/projects?status=critical')
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => { if (data) merge(data.data); })
      .catch(() => {}); // silently keep static fallback

    const id = setInterval(() => {
      fetch('/api/projects?status=critical')
        .then((r) => (r.ok ? r.json() : null))
        .then((data) => { if (data) merge(data.data); })
        .catch(() => {});
    }, 60_000);

    return () => clearInterval(id);
  }, []);

  /* Build the doubled marquee string once alerts are ready */
  const tickerText = alerts.join('  ·  ');
  // ~14px per character at 13px font-size, scroll at ~80px/s for comfortable reading
  const scrollDuration = Math.max(20, Math.round(tickerText.length * 0.17));

  return (
    <div
      className="relative overflow-hidden select-none"
      style={{ background: '#7F1D1D', borderBottom: '1px solid #991B1B' }}
      aria-label="Breaking alerts ticker"
    >
      {/* LEFT fade */}
      <div
        className="absolute left-0 top-0 bottom-0 w-16 z-10 pointer-events-none"
        style={{ background: 'linear-gradient(to right, #7F1D1D, transparent)' }}
      />

      {/* LIVE badge — pinned left */}
      <div className="absolute left-0 top-0 bottom-0 z-20 flex items-center px-3 gap-2"
           style={{ background: '#991B1B', borderRight: '1px solid #7F1D1D' }}>
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-300 opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-red-400" />
        </span>
        <span
          className="text-red-100 font-bold uppercase tracking-widest whitespace-nowrap"
          style={{ fontSize: '10px', fontFamily: "'DM Sans', sans-serif" }}
        >
          LIVE
        </span>
      </div>

      {/* Scrolling track */}
      <div ref={trackRef} className="overflow-hidden" style={{ marginLeft: '72px' }}>
        <div
          className="flex whitespace-nowrap"
          style={{
            animation: `ticker-scroll ${scrollDuration}s linear infinite`,
            willChange: 'transform',
          }}
        >
          {/* Duplicate text for seamless loop */}
          {[tickerText, tickerText].map((text, idx) => (
            <span
              key={idx}
              className="pr-16 text-red-100 font-semibold"
              style={{ fontSize: '13px', lineHeight: '36px', fontFamily: "'DM Sans', sans-serif" }}
            >
              {text}
            </span>
          ))}
        </div>
      </div>

      {/* RIGHT fade */}
      <div
        className="absolute right-0 top-0 bottom-0 w-16 z-10 pointer-events-none"
        style={{ background: 'linear-gradient(to left, #7F1D1D, transparent)' }}
      />
    </div>
  );
};

export default AlertTicker;
