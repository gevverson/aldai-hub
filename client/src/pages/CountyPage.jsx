import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import AreaCard from '../components/AreaCard';
import { slug, formatKsh } from '../lib/geo';

const BackLink = ({ to, children }) => (
  <Link
    to={to}
    className="inline-flex items-center mb-6 transition-colors text-sm font-medium"
    style={{ color: '#6B7280' }}
    onMouseEnter={(e) => { e.currentTarget.style.color = '#D97706'; }}
    onMouseLeave={(e) => { e.currentTarget.style.color = '#6B7280'; }}
  >
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 mr-1">
      <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
    </svg>
    {children}
  </Link>
);

const CountyPage = () => {
  const { countyName } = useParams();
  const [county, setCounty] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setError(null);
    fetch(`/api/geography/${encodeURIComponent(countyName)}`)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error('County not found'))))
      .then((json) => {
        if (!alive) return;
        setCounty(json.data);
        setLoading(false);
      })
      .catch((e) => {
        if (!alive) return;
        setError(e.message);
        setLoading(false);
      });
    return () => { alive = false; };
  }, [countyName]);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col justify-center items-center" style={{ background: '#0A0A0A' }}>
        <div
          className="w-12 h-12 rounded-full border-4 animate-spin mb-4"
          style={{ borderColor: '#D97706', borderTopColor: 'transparent' }}
        />
        <p style={{ color: '#6B7280', fontFamily: "'DM Sans', sans-serif", fontSize: '14px' }}>
          Loading {countyName} county ledger…
        </p>
      </div>
    );
  }

  if (error || !county) {
    return (
      <div className="min-h-[80vh] flex flex-col justify-center items-center text-center px-4" style={{ background: '#0A0A0A' }}>
        <div className="rounded-2xl p-10 max-w-md w-full" style={{ background: '#111827', border: '1px solid #1F2937' }}>
          <div className="text-5xl mb-4">🗺️</div>
          <h2 className="font-display text-white mb-2" style={{ fontSize: '24px' }}>County Not Covered Yet</h2>
          <p style={{ color: '#D97706', fontSize: '12px', fontFamily: "'DM Sans', sans-serif", fontStyle: 'italic', marginBottom: '8px' }}>
            Kaunti Haijafikiwa Bado
          </p>
          <p style={{ color: '#6B7280', fontSize: '14px', fontFamily: "'DM Sans', sans-serif", lineHeight: 1.7, marginBottom: '24px' }}>
            We have not yet ingested Auditor-General reports for “{countyName}”.
            Coverage expands as official reports are published and verified.
          </p>
          <Link
            to="/counties"
            className="block w-full py-3 rounded-xl font-bold text-center"
            style={{ background: '#1F2937', color: '#F9FAFB', fontSize: '14px', fontFamily: "'DM Sans', sans-serif" }}
          >
            ← Back to All Counties
          </Link>
        </div>
      </div>
    );
  }

  const covered = county.constituencies.filter((k) => k.projectCount > 0).length;

  return (
    <div className="pb-20">
      <div className="py-12 mb-10" style={{ background: '#0D1117', borderBottom: '3px solid #D97706' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <BackLink to="/counties">All Counties</BackLink>

          <h1 className="font-display text-white mb-3" style={{ fontSize: 'clamp(28px, 6vw, 48px)' }}>
            {county.name} County
          </h1>
          <p style={{ color: '#9CA3AF', fontSize: '16px', fontFamily: "'DM Sans', sans-serif" }}>
            Select a constituency to see every audited project, with the report and page it came from.
          </p>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-8">
            {[
              { l: 'Projects Audited', v: county.projectCount, c: '#F9FAFB' },
              { l: 'Public Funds Traced', v: formatKsh(county.totalAllocated), c: '#D97706' },
              { l: 'Flagged by Auditor', v: `${county.flaggedCount} · ${formatKsh(county.flaggedValue)}`, c: '#F59E0B' },
              { l: 'Ghost Projects', v: county.ghostCount, c: '#F87171' },
            ].map((s) => (
              <div key={s.l}>
                <p className="uppercase tracking-widest font-semibold mb-1" style={{ color: '#4B5563', fontSize: '10px', fontFamily: "'DM Sans', sans-serif" }}>
                  {s.l}
                </p>
                <p className="font-bold font-mono-jet" style={{ color: s.c, fontSize: '18px' }}>{s.v}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-end justify-between gap-3 mb-6">
          <h2 className="text-2xl font-display font-bold text-white">Constituencies</h2>
          <p style={{ color: '#6B7280', fontSize: '12px', fontFamily: "'DM Sans', sans-serif" }}>
            {covered} of {county.constituencies.length} with published project data
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {county.constituencies.map((k) => (
            <AreaCard
              key={k.name}
              area={k}
              to={`/constituency/${slug(k.name)}`}
              kicker={county.name}
            />
          ))}
        </div>

        {county.countyWide?.projectCount > 0 && (
          <div className="mt-10">
            <h2 className="text-2xl font-display font-bold text-white mb-2">County-Wide Projects</h2>
            <p className="mb-5" style={{ color: '#6B7280', fontSize: '13px', fontFamily: "'DM Sans', sans-serif" }}>
              Projects run by the County Executive rather than a single constituency.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              <AreaCard
                area={{ ...county.countyWide, name: `${county.name} County Executive` }}
                to={`/county/${slug(county.name)}/county-wide`}
                kicker="County Executive"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CountyPage;
