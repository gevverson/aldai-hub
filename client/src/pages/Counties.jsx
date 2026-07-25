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
      liveCounties: acc.liveCounties + (c.projectCount > 0 ? 1 : 0),
      countyTotal: acc.countyTotal + 1,
    }),
    { projects: 0, value: 0, ghosts: 0, liveCounties: 0, countyTotal: 0 }
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
                { v: `${totals.liveCounties}/${totals.countyTotal}`, l: 'Counties live' },
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

        {loading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        )}

        {!loading && !error && (() => {
          // Three tiers: counties with a project register, counties with audit
          // findings only (still real, cited data), and the rest as compact
          // "coming soon" chips — so real evidence is never buried.
          const live = counties.filter((c) => c.projectCount > 0);
          const reviewed = counties.filter((c) => c.projectCount === 0 && (c.findingCount || 0) > 0);
          const soon = counties.filter((c) => c.projectCount === 0 && (c.findingCount || 0) === 0);
          return (
            <>
              {live.length > 0 && (
                <>
                  <h2 className="font-display text-white mb-1" style={{ fontSize: '22px' }}>
                    Live now
                  </h2>
                  <p className="mb-5" style={{ color: '#6B7280', fontSize: '13px', fontFamily: "'DM Sans', sans-serif" }}>
                    Counties with Auditor-General data ingested and verified.
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-14">
                    {live.map((county) => (
                      <AreaCard
                        key={county.name}
                        area={county}
                        to={`/counties/${slug(county.name)}`}
                        kicker={`${county.constituencies.length} constituencies`}
                      />
                    ))}
                  </div>
                </>
              )}

              {reviewed.length > 0 && (
                <>
                  <h2 className="font-display text-white mb-1" style={{ fontSize: '22px' }}>
                    Audit findings available
                  </h2>
                  <p className="mb-5" style={{ color: '#6B7280', fontSize: '13px', fontFamily: "'DM Sans', sans-serif" }}>
                    Counties whose Auditor-General reports raise findings but publish no
                    project register — real, cited audit data, no project map yet.
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-14">
                    {reviewed.map((county) => (
                      <AreaCard
                        key={county.name}
                        area={county}
                        to={`/counties/${slug(county.name)}`}
                        kicker={`${county.constituencies.length} constituencies`}
                      />
                    ))}
                  </div>
                </>
              )}

              {soon.length > 0 && (
                <>
                  <h2 className="font-display text-white mb-1" style={{ fontSize: '22px' }}>
                    Coming soon · {soon.length} counties
                  </h2>
                  <p className="mb-5" style={{ color: '#6B7280', fontSize: '13px', fontFamily: "'DM Sans', sans-serif" }}>
                    Every Kenyan county is mapped. Evidence fills in as each one's
                    Auditor-General reports are processed — claims never outrun the sources.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {soon.map((county) => (
                      <span
                        key={county.name}
                        className="px-3 py-1.5 rounded-full"
                        style={{
                          background: '#0D1117',
                          border: '1px solid #1F2937',
                          color: '#6B7280',
                          fontSize: '12px',
                          fontFamily: "'DM Sans', sans-serif",
                        }}
                        title={`${county.constituencies.length} constituencies · data coming`}
                      >
                        {county.name}
                      </span>
                    ))}
                  </div>
                </>
              )}
            </>
          );
        })()}
      </div>
    </div>
  );
};

export default Counties;
