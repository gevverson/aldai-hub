import { useState, useEffect } from 'react';
import AreaCard from '../components/AreaCard';
import { slug, formatKsh } from '../lib/geo';

/* ── Skeleton ── */
const SkeletonCard = () => (
  <div className="rounded-2xl p-6 flex flex-col gap-3" style={{ background: '#111827', border: '1px solid #1F2937' }}>
    <div className="skeleton" style={{ height: '20px', width: '66%' }} />
    <div className="skeleton" style={{ height: '12px', width: '50%' }} />
    <div className="skeleton" style={{ height: '6px', width: '100%', borderRadius: '9999px' }} />
    <div className="skeleton" style={{ height: '12px', width: '33%' }} />
  </div>
);

const Counties = () => {
  const [counties, setCounties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let alive = true;
    fetch('/api/geography')
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error('unavailable'))))
      .then((json) => {
        if (!alive) return;
        setCounties(Array.isArray(json?.data) ? json.data : []);
        setLoading(false);
      })
      .catch(() => {
        if (!alive) return;
        setError(true);
        setLoading(false);
      });
    return () => { alive = false; };
  }, []);

  const totals = counties.reduce(
    (acc, c) => ({
      projects: acc.projects + (c.projectCount || 0),
      value: acc.value + (c.totalAllocated || 0),
      ghosts: acc.ghosts + (c.ghostCount || 0),
      covered: acc.covered + c.constituencies.filter((k) => k.projectCount > 0).length,
      constituencies: acc.constituencies + c.constituencies.length,
    }),
    { projects: 0, value: 0, ghosts: 0, covered: 0, constituencies: 0 }
  );

  return (
    <div className="pb-20">
      {/* Header */}
      <div className="py-12 mb-10" style={{ background: '#0D1117', borderBottom: '3px solid #D97706' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p
            className="font-bold uppercase tracking-widest mb-3"
            style={{ color: '#D97706', fontSize: '11px', fontFamily: "'DM Sans', sans-serif" }}
          >
            Public Fund Accountability · Kenya
          </p>
          <h1 className="font-display text-white leading-tight mb-3" style={{ fontSize: 'clamp(28px, 6vw, 48px)' }}>
            SELECT YOUR COUNTY
          </h1>
          <p
            style={{ color: '#D97706', fontSize: '13px', fontFamily: "'DM Sans', sans-serif", fontStyle: 'italic' }}
          >
            Chagua Kaunti Yako
          </p>
          <p
            className="mt-3"
            style={{ color: '#9CA3AF', fontSize: '16px', fontFamily: "'DM Sans', sans-serif", maxWidth: '640px', margin: '12px auto 0' }}
          >
            Every figure below is read directly from a signed Auditor-General report
            and cited to its page. Nothing is estimated.
          </p>

          {!loading && !error && totals.projects > 0 && (
            <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3 mt-8">
              {[
                { v: totals.projects, l: 'Projects audited' },
                { v: formatKsh(totals.value), l: 'Public funds traced' },
                { v: totals.ghosts, l: 'Ghost projects found', danger: true },
                { v: `${totals.covered}/${totals.constituencies}`, l: 'Constituencies covered' },
              ].map((s) => (
                <div key={s.l} className="text-center">
                  <p
                    className="font-mono-jet font-bold"
                    style={{ color: s.danger ? '#F87171' : '#D97706', fontSize: '22px' }}
                  >
                    {s.v}
                  </p>
                  <p
                    className="uppercase tracking-wider"
                    style={{ color: '#6B7280', fontSize: '10px', fontFamily: "'DM Sans', sans-serif" }}
                  >
                    {s.l}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {error && (
          <div
            className="rounded-2xl p-6 mb-8 text-center"
            style={{ background: '#111827', border: '1px solid rgba(220,38,38,0.3)' }}
          >
            <p style={{ color: '#F87171', fontSize: '14px', fontFamily: "'DM Sans', sans-serif" }}>
              ⚠️ Could not reach the audit database. Please try again shortly —
              we would rather show nothing than show numbers we cannot verify.
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {loading
            ? Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={i} />)
            : counties.map((county) => (
                <AreaCard
                  key={county.name}
                  area={county}
                  to={`/county/${slug(county.name)}`}
                  kicker={`${county.constituencies.length} constituencies`}
                />
              ))}
        </div>

        {!loading && !error && (
          <p
            className="text-center mt-10"
            style={{ color: '#4B5563', fontSize: '12px', fontFamily: "'DM Sans', sans-serif" }}
          >
            More counties are added as their Auditor-General reports are ingested.
            Coverage grows; claims never outrun the sources.
          </p>
        )}
      </div>
    </div>
  );
};

export default Counties;
