import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Hero from '../components/Hero';
import QuickStats from '../components/QuickStats';
import WardSelector from '../components/WardSelector';

/* ═══════════════════════════════════════════════════════════
   CITIZEN REPORTS FEED
   Real-time anonymous submissions. No names, no identity.
═══════════════════════════════════════════════════════════ */
const CATEGORY_META = {
  stalled:   { icon: '🏚️', label: 'Stalled Project',   color: '#F59E0B' },
  ghost:     { icon: '👻', label: 'Ghost Project',     color: '#DC2626' },
  health:    { icon: '🏥', label: 'Health Facility',   color: '#7C3AED' },
  road:      { icon: '🛣️', label: 'Road / Infrastructure', color: '#0EA5E9' },
  bursary:   { icon: '📚', label: 'Bursary Fraud',     color: '#16A34A' },
  other:     { icon: '📝', label: 'Other',             color: '#6B7280' },
};

const timeAgo = (dateStr) => {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins  = Math.floor(diff / 60_000);
  const hours = Math.floor(diff / 3_600_000);
  const days  = Math.floor(diff / 86_400_000);
  if (mins  < 1)  return 'Just now';
  if (mins  < 60) return `${mins} min ago`;
  if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  return `${days} day${days > 1 ? 's' : ''} ago`;
};

const FALLBACK_REPORTS = [
  { _id: '1', ward: 'Kemeloi-Maraba', category: 'ghost', text: 'Kimaren Girls Secondary does not exist. I went to the location — there is only bush. The school that received Ksh 3.2M was never built.', verifiedBy: 4, createdAt: new Date(Date.now() - 2 * 3600_000).toISOString() },
  { _id: '2', ward: 'Kabwareng',      category: 'stalled', text: 'Borehole project funded in 2019 has been incomplete for 5 years. The pump was installed but never connected to water supply.', verifiedBy: 2, createdAt: new Date(Date.now() - 5 * 3600_000).toISOString() },
  { _id: '3', ward: 'Terik',          category: 'health',  text: 'Terik Health Centre has had no drugs for 3 months. Patients are being sent to buy from private pharmacies.', verifiedBy: 7, createdAt: new Date(Date.now() - 12 * 3600_000).toISOString() },
  { _id: '4', ward: 'Kobujoi',        category: 'road',    text: 'New tarmac road project stalled at 40% completion. Contractor has not returned in 8 months. Money reportedly already paid.', verifiedBy: 1, createdAt: new Date(Date.now() - 24 * 3600_000).toISOString() },
];

const ReportCard = ({ report }) => {
  const cat = CATEGORY_META[report.category] || CATEGORY_META.other;
  const snippet = (report.text || '').slice(0, 120);

  return (
    <div
      className="rounded-2xl p-5 flex flex-col gap-3 transition-all duration-200 hover:-translate-y-0.5"
      style={{ background: '#111827', border: '1px solid #1F2937' }}
    >
      {/* Top row */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span
            className="text-xs font-bold px-2.5 py-1 rounded-full uppercase tracking-wide"
            style={{
              background: `${cat.color}15`,
              color: cat.color,
              border: `1px solid ${cat.color}30`,
              fontFamily: "'DM Sans', sans-serif",
            }}
          >
            {cat.icon} {cat.label}
          </span>
        </div>
        <span
          className="text-xs flex-shrink-0"
          style={{ color: '#4B5563', fontFamily: "'DM Sans', sans-serif" }}
        >
          {report.ward} · {timeAgo(report.createdAt)}
        </span>
      </div>

      {/* Report text */}
      <p
        className="leading-relaxed"
        style={{ color: '#D1D5DB', fontSize: '14px', fontFamily: "'DM Sans', sans-serif" }}
      >
        "{snippet}{report.text?.length > 120 ? '…' : ''}"
      </p>

      {/* Verified count */}
      {report.verifiedBy > 0 && (
        <div
          className="flex items-center gap-1.5 text-xs font-semibold"
          style={{ color: '#6B7280', fontFamily: "'DM Sans', sans-serif" }}
        >
          <span>✅</span>
          <span>
            Imethibitishwa na{' '}
            <span style={{ color: '#D97706', fontFamily: "'JetBrains Mono', monospace" }}>
              {report.verifiedBy}
            </span>{' '}
            wananchi
          </span>
        </div>
      )}
    </div>
  );
};

const ReportsFeed = () => {
  const [reports, setReports]   = useState([]);
  const [loading, setLoading]   = useState(true);

  const fetchReports = () => {
    fetch('/api/reports?limit=8&sort=newest')
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((data) => {
        setReports(Array.isArray(data) && data.length > 0 ? data : FALLBACK_REPORTS);
        setLoading(false);
      })
      .catch(() => {
        setReports(FALLBACK_REPORTS);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchReports();
    const id = setInterval(fetchReports, 30_000);
    return () => clearInterval(id);
  }, []);

  return (
    <section
      className="py-20"
      style={{ background: '#111827', borderTop: '1px solid #1F2937' }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
              </span>
              <span
                className="font-bold uppercase tracking-widest"
                style={{ color: '#DC2626', fontSize: '10px', fontFamily: "'DM Sans', sans-serif" }}
              >
                Inasasishwa Kila Sekunde 30 · Refreshes Every 30s
              </span>
            </div>
            <h2
              className="font-display text-white leading-tight"
              style={{ fontSize: 'clamp(22px, 4vw, 32px)' }}
            >
              RIPOTI ZA WANANCHI
            </h2>
            <p
              className="mt-1"
              style={{ color: '#6B7280', fontSize: '14px', fontFamily: "'DM Sans', sans-serif" }}
            >
              Citizen Reports — Anonymous only. No names. No phone numbers.
            </p>
          </div>
          <Link
            to="/report"
            className="flex-shrink-0 inline-flex items-center gap-2 font-bold px-5 py-2.5 rounded-xl border transition-all hover:bg-white/5"
            style={{
              borderColor: '#D97706',
              color: '#D97706',
              fontSize: '14px',
              fontFamily: "'DM Sans', sans-serif",
            }}
          >
            + Ripoti Mpya
          </Link>
        </div>

        {/* Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="rounded-2xl p-5 flex flex-col gap-3" style={{ background: '#111827', border: '1px solid #1F2937' }}>
                <div className="skeleton" style={{ height: '20px', width: '60%' }} />
                <div className="skeleton" style={{ height: '40px', width: '100%' }} />
                <div className="skeleton" style={{ height: '12px', width: '40%' }} />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {reports.slice(0, 8).map((r) => (
              <ReportCard key={r._id || r.id} report={r} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

/* ═══════════════════════════════════════════════════════════
   CALL TO ACTION — Three columns
═══════════════════════════════════════════════════════════ */
const CTA_ITEMS = [
  {
    icon: '📸',
    title: 'RIPOTI',
    titleEn: 'Report',
    swahili: 'Umegundua mradi ulioachwa? Ripoti bila kutoa jina lako.',
    english: 'Found an abandoned project? Report without revealing your identity.',
    btnLabel: 'Ripoti Sasa →',
    btnTo: '/report',
    accentColor: '#DC2626',
  },
  {
    icon: '📍',
    title: 'THIBITISHA',
    titleEn: 'Verify',
    swahili: 'Nenda eneo la mradi. Piga picha. Thibitisha ukweli.',
    english: 'Go to the project site. Take a photo. Verify the truth.',
    btnLabel: 'Angalia Mapa →',
    btnTo: '/map',
    accentColor: '#D97706',
  },
  {
    icon: '🤖',
    title: 'ULIZA AI',
    titleEn: 'Ask AI',
    swahili: 'Uliza swali lolote kuhusu pesa za umma. AI itakujibu kwa lugha rahisi.',
    english: 'Ask any question about public money. AI will answer in plain language.',
    btnLabel: 'Uliza Sasa →',
    btnTo: '/audit',
    accentColor: '#7C3AED',
  },
];

const CTASection = () => (
  <section
    className="py-20"
    style={{
      background: '#0A0A0A',
      borderTop: '1px solid #1F2937',
    }}
  >
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Heading */}
      <div className="text-center mb-14">
        <h2
          className="font-display text-white mb-2"
          style={{ fontSize: 'clamp(24px, 4vw, 36px)' }}
        >
          Unaweza Kufanya Nini?
        </h2>
        <p style={{ color: '#6B7280', fontFamily: "'DM Sans', sans-serif", fontSize: '15px' }}>
          What Can You Do? — Three ways every citizen can fight back.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {CTA_ITEMS.map((item, i) => (
          <div
            key={i}
            className="rounded-2xl p-8 flex flex-col gap-5 relative overflow-hidden"
            style={{
              background: '#111827',
              border: '1px solid #1F2937',
              borderLeft: `3px solid ${item.accentColor}`,
            }}
          >
            {/* Background glow */}
            <div
              className="absolute top-0 right-0 pointer-events-none"
              style={{
                width: '120px',
                height: '120px',
                background: `radial-gradient(circle, ${item.accentColor}12 0%, transparent 70%)`,
              }}
            />

            {/* Icon */}
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl relative z-10"
              style={{ background: `${item.accentColor}15` }}
            >
              {item.icon}
            </div>

            <div className="flex-1 relative z-10">
              {/* Title */}
              <p
                className="font-display text-white mb-0.5"
                style={{ fontSize: '22px' }}
              >
                {item.title}
              </p>
              <p
                className="font-semibold uppercase tracking-widest mb-4"
                style={{ color: item.accentColor, fontSize: '10px', fontFamily: "'DM Sans', sans-serif" }}
              >
                {item.titleEn}
              </p>

              {/* Swahili copy */}
              <p
                className="leading-relaxed mb-2"
                style={{ color: '#D1D5DB', fontSize: '15px', fontFamily: "'DM Sans', sans-serif" }}
              >
                {item.swahili}
              </p>
              {/* English sub-copy */}
              <p
                className="leading-relaxed"
                style={{ color: '#6B7280', fontSize: '13px', fontFamily: "'DM Sans', sans-serif", fontStyle: 'italic' }}
              >
                {item.english}
              </p>
            </div>

            {/* Button */}
            <Link
              to={item.btnTo}
              className="relative z-10 inline-flex items-center justify-center gap-2 font-bold py-3 px-5 rounded-xl transition-all duration-200 hover:scale-[1.02]"
              style={{
                background: `${item.accentColor}15`,
                color: item.accentColor,
                border: `1px solid ${item.accentColor}40`,
                fontSize: '14px',
                fontFamily: "'DM Sans', sans-serif",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = `${item.accentColor}25`; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = `${item.accentColor}15`; }}
            >
              {item.btnLabel}
            </Link>
          </div>
        ))}
      </div>
    </div>
  </section>
);

/* ═══════════════════════════════════════════════════════════
   GPS / PHOTO VERIFICATION INSIGHT BANNER
   Explains the GPS-tagged photo verification feature idea
═══════════════════════════════════════════════════════════ */
const GpsVerificationBanner = () => (
  <div
    className="py-8"
    style={{ background: '#0D1117', borderTop: '1px solid #1F2937' }}
  >
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div
        className="rounded-2xl p-6 flex flex-col sm:flex-row items-start sm:items-center gap-5"
        style={{
          background: 'rgba(217,119,6,0.05)',
          border: '1px solid rgba(217,119,6,0.2)',
        }}
      >
        <div
          className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0"
          style={{ background: 'rgba(217,119,6,0.15)' }}
        >
          📡
        </div>
        <div className="flex-1">
          <p
            className="font-bold text-white mb-1"
            style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '15px' }}
          >
            📍 GPS-Tagged Photo Verification — Coming Soon
          </p>
          <p
            style={{ color: '#9CA3AF', fontSize: '13px', fontFamily: "'DM Sans', sans-serif", lineHeight: 1.6 }}
          >
            When you take a photo to verify a project site, your browser will request GPS coordinates
            at the moment of capture — so the location is automatically embedded and verified.{' '}
            <strong style={{ color: '#D97706' }}>You cannot fake a photo taken 50km from a project.</strong>{' '}
            This eliminates fabricated evidence and makes every citizen verification independently verifiable
            against the GPS coordinates of the actual project location on record.
          </p>
        </div>
        <Link
          to="/map"
          className="flex-shrink-0 font-bold px-4 py-2 rounded-xl transition-all hover:scale-105"
          style={{
            background: 'rgba(217,119,6,0.15)',
            color: '#D97706',
            border: '1px solid rgba(217,119,6,0.3)',
            fontSize: '13px',
            fontFamily: "'DM Sans', sans-serif",
            whiteSpace: 'nowrap',
          }}
        >
          Angalia Mapa →
        </Link>
      </div>
    </div>
  </div>
);

/* ═══════════════════════════════════════════════════════════
   HOME PAGE
═══════════════════════════════════════════════════════════ */
const Home = () => {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    fetch('/api/projects/stats')
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => { if (data) setStats(data); })
      .catch(() => {});
  }, []);

  return (
    <div
      className="min-h-screen"
      style={{ backgroundColor: '#0A0A0A' }}
    >
      {/* 1. Full-viewport hero */}
      <Hero globalStats={stats} />

      {/* 2. GPS verification insight banner */}
      <GpsVerificationBanner />

      {/* 3. QuickStats — animated counters */}
      <QuickStats stats={stats} />

      {/* 4. Citizen Reports Feed */}
      <ReportsFeed />

      {/* 5. Ward selector */}
      <WardSelector />

      {/* 6. CTA Section */}
      <CTASection />
    </div>
  );
};

export default Home;
