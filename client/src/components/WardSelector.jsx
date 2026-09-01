import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

/* ── Static fallback data if API is down ─────────────────── */
const FALLBACK_WARDS = [
  {
    name: 'Kabwareng',
    budgetAllocated: 85_000_000,
    projectCount: 12,
    completionRate: 42,
    healthScore: 'red',
    hasGhost: true,
  },
  {
    name: 'Terik',
    budgetAllocated: 72_000_000,
    projectCount: 9,
    completionRate: 60,
    healthScore: 'amber',
    hasGhost: false,
  },
  {
    name: 'Kemeloi-Maraba',
    budgetAllocated: 91_000_000,
    projectCount: 14,
    completionRate: 28,
    healthScore: 'red',
    hasGhost: true, // Kimaren Girls Secondary
  },
  {
    name: 'Kobujoi',
    budgetAllocated: 68_000_000,
    projectCount: 8,
    completionRate: 55,
    healthScore: 'amber',
    hasGhost: false,
  },
  {
    name: 'Kaptumo-Kaboi',
    budgetAllocated: 79_000_000,
    projectCount: 11,
    completionRate: 34,
    healthScore: 'red',
    hasGhost: false,
  },
  {
    name: 'Koyo-Ndurio',
    budgetAllocated: 62_000_000,
    projectCount: 7,
    completionRate: 71,
    healthScore: 'green',
    hasGhost: false,
  },
];

/* ── Health config ──────────────────────────────────────── */
const HEALTH = {
  red:   { bar: '#DC2626', label: 'Critical Issues', sw: 'Hali Mbaya Sana', icon: '🔴' },
  amber: { bar: '#D97706', label: 'Moderate Concerns', sw: 'Wasiwasi wa Wastani', icon: '🟡' },
  green: { bar: '#16A34A', label: 'Ongoing', sw: 'Inaendelea', icon: '🟢' },
};

const formatKsh = (n) => {
  if (n >= 1_000_000) return `Ksh ${(n / 1_000_000).toFixed(0)}M`;
  return `Ksh ${(n / 1_000).toFixed(0)}K`;
};

/* ── Skeleton Card ── */
const SkeletonCard = () => (
  <div className="rounded-2xl p-6 flex flex-col gap-3" style={{ background: '#111827', border: '1px solid #1F2937' }}>
    <div className="skeleton h-5 w-2/3" style={{ height: '20px' }} />
    <div className="skeleton h-3 w-1/2" style={{ height: '12px' }} />
    <div className="skeleton h-1.5 w-full rounded-full" style={{ height: '6px' }} />
    <div className="skeleton h-3 w-1/3" style={{ height: '12px' }} />
  </div>
);

/* ── Ward Card ── */
const WardCard = ({ ward }) => {
  const health = HEALTH[ward.healthScore] || HEALTH.amber;

  return (
    <Link
      to={`/ward/${encodeURIComponent(ward.name.toLowerCase())}`}
      className="group block"
      aria-label={`${ward.name} ward — ${health.en}`}
    >
      <div
        className="rounded-2xl overflow-hidden h-full flex flex-col transition-all duration-300 border border-[#1F2937] group-hover:border-amber-500/50 group-hover:-translate-y-[3px] group-hover:shadow-[0_16px_48px_rgba(0,0,0,0.6)]"
        style={{ background: '#111827' }}
      >
        {/* Top accent bar — color coded by health */}
        <div className="h-1.5 w-full" style={{ background: health.bar }} />

        <div className="p-5 flex flex-col flex-1 gap-4">
          {/* Ward name + ghost badge */}
          <div className="flex items-start justify-between gap-2">
            <h3
              className="font-display text-white group-hover:text-amber-300 transition-colors leading-tight"
              style={{ fontSize: '20px' }}
            >
              {ward.name}
            </h3>
            {ward.hasGhost && (
              <span
                className="flex-shrink-0 text-xs font-bold px-2 py-1 rounded-full uppercase tracking-wide animate-pulse"
                style={{
                  background: 'rgba(220,38,38,0.15)',
                  color: '#FCA5A5',
                  border: '1px solid rgba(220,38,38,0.3)',
                  fontFamily: "'DM Sans', sans-serif",
                }}
              >
                🔴 GHOST
              </span>
            )}
          </div>

          {/* Stats row */}
          <div className="flex gap-4">
            <div>
              <p
                className="font-mono-jet font-bold"
                style={{ color: '#D97706', fontSize: '16px' }}
              >
                {formatKsh(ward.budgetAllocated)}
              </p>
              <p
                className="uppercase tracking-wider"
                style={{ color: '#6B7280', fontSize: '10px', fontFamily: "'DM Sans', sans-serif" }}
              >
                Budget (Bajeti)
              </p>
            </div>
            <div
              className="w-px"
              style={{ background: '#1F2937', alignSelf: 'stretch' }}
            />
            <div>
              <p
                className="font-mono-jet font-bold text-white"
                style={{ fontSize: '16px' }}
              >
                {ward.projectCount}
              </p>
              <p
                className="uppercase tracking-wider"
                style={{ color: '#6B7280', fontSize: '10px', fontFamily: "'DM Sans', sans-serif" }}
              >
                Projects (Miradi)
              </p>
            </div>
          </div>

          {/* Completion bar */}
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <span
                className="font-semibold uppercase tracking-wide"
                style={{ color: '#6B7280', fontSize: '10px', fontFamily: "'DM Sans', sans-serif" }}
              >
                Completion (Ukamilishaji)
              </span>
              <span
                className="font-mono-jet font-bold"
                style={{ color: health.bar, fontSize: '12px' }}
              >
                {ward.completionRate}%
              </span>
            </div>
            <div
              className="w-full rounded-full overflow-hidden"
              style={{ background: '#1F2937', height: '6px' }}
            >
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{ width: `${ward.completionRate}%`, background: health.bar }}
              />
            </div>
          </div>

          {/* Health label */}
          <div
            className="flex items-center gap-2 px-3 py-2 rounded-xl mt-auto"
            style={{ background: '#0A0A0A' }}
          >
            <span style={{ fontSize: '13px' }}>{health.icon}</span>
            <div>
              <p
                className="font-bold"
                style={{ color: '#F9FAFB', fontSize: '12px', fontFamily: "'DM Sans', sans-serif" }}
              >
                {health.label}
              </p>
              <p
                style={{ color: '#6B7280', fontSize: '10px', fontFamily: "'DM Sans', sans-serif" }}
              >
                {health.sw}
              </p>
            </div>
            <span
              className="ml-auto text-sm transition-transform group-hover:translate-x-1"
              style={{ color: '#D97706' }}
            >
              →
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
};

/* ── WardSelector ─────────────────────────────────────── */
const WardSelector = () => {
  const [wards, setWards]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(false);

  useEffect(() => {
    fetch('/api/projects/wards')
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((data) => {
        const list = data?.data;
        const usable = Array.isArray(list) && list.length > 0;
        // FALLBACK_WARDS are hardcoded estimates, not audited figures. Whenever
        // they are shown the reader must be told, or the platform is quietly
        // presenting invented numbers in the one place it promises not to.
        setWards(usable ? list : FALLBACK_WARDS);
        setError(!usable);
        setLoading(false);
      })
      .catch(() => {
        setWards(FALLBACK_WARDS);
        setError(true);
        setLoading(false);
      });
  }, []);

  return (
    <section
      id="wards"
      className="py-20"
      style={{ background: '#0A0A0A', borderTop: '1px solid #1F2937' }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Section header */}
        <div className="text-center mb-12">
          <p
            className="font-bold uppercase tracking-widest mb-3"
            style={{ color: '#D97706', fontSize: '11px', fontFamily: "'DM Sans', sans-serif" }}
          >
            Nandi County · Aldai Constituency
          </p>
          <h2
            className="font-display text-white leading-tight mb-3"
            style={{ fontSize: 'clamp(26px, 5vw, 40px)' }}
          >
            SELECT YOUR WARD
          </h2>
          <p
            style={{ color: '#6B7280', fontSize: '13px', fontFamily: "'DM Sans', sans-serif", maxWidth: '500px', margin: '0 auto', fontStyle: 'italic' }}
          >
            Chagua Wadi Yako
          </p>
          <p
            style={{ color: '#6B7280', fontSize: '16px', fontFamily: "'DM Sans', sans-serif", maxWidth: '500px', margin: '0 auto' }}
          >
            See exactly how public funds were used in your community. Every figure traced to official records.
          </p>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {loading
            ? Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)
            : wards.map((ward) => <WardCard key={ward.name} ward={ward} />)
          }
        </div>

        {error && (
          <p className="text-center mt-8" style={{ color: '#6B7280', fontSize: '14px' }}>
            ⚠️ API unavailable — showing estimated data. Try again shortly.
          </p>
        )}
      </div>
    </section>
  );
};

export default WardSelector;
