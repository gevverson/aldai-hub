import { useState, useEffect, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import ProjectList from '../components/ProjectList';
import { formatKsh, HEALTH, healthOf, slug } from '../lib/geo';

const NEGATIVE = ['GHOST PROJECT', 'STALLED', 'ABANDONED', 'INCOMPLETE', 'DISPUTED', 'MISALLOCATED'];

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

/**
 * ConstituencyPage — the leaf of the drill-down.
 *
 * Serves two shapes: a normal constituency, and a county's county-wide
 * (County Executive) projects when rendered at /county/:countyName/county-wide.
 */
const ConstituencyPage = ({ countyWide = false }) => {
  const { constituencyName, countyName } = useParams();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const title = countyWide ? `${countyName} County Executive` : constituencyName;

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setError(null);

    const url = countyWide
      ? `/api/projects?county=${encodeURIComponent(countyName)}&countyWide=true`
      : `/api/projects?constituency=${encodeURIComponent(constituencyName)}`;

    fetch(url)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error('Could not load projects'))))
      .then((json) => {
        if (!alive) return;
        setProjects(Array.isArray(json?.data) ? json.data : []);
        setLoading(false);
      })
      .catch((e) => {
        if (!alive) return;
        setError(e.message);
        setLoading(false);
      });
    return () => { alive = false; };
  }, [constituencyName, countyName, countyWide]);

  const stats = useMemo(() => {
    const total = projects.reduce((s, p) => s + (p.allocated || 0), 0);
    const flagged = projects.filter((p) => NEGATIVE.includes(p.communityStatus));
    const ghosts = projects.filter((p) => p.communityStatus === 'GHOST PROJECT');
    const years = [...new Set(projects.map((p) => p.year))].sort();
    return {
      projectCount: projects.length,
      totalAllocated: total,
      flaggedCount: flagged.length,
      flaggedValue: flagged.reduce((s, p) => s + (p.allocated || 0), 0),
      ghostCount: ghosts.length,
      years,
    };
  }, [projects]);

  const county = projects[0]?.county || countyName;
  const backTo = county ? `/county/${slug(county)}` : '/counties';
  const health = HEALTH[healthOf(stats)];

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col justify-center items-center" style={{ background: '#0A0A0A' }}>
        <div
          className="w-12 h-12 rounded-full border-4 animate-spin mb-4"
          style={{ borderColor: '#D97706', borderTopColor: 'transparent' }}
        />
        <p style={{ color: '#6B7280', fontFamily: "'DM Sans', sans-serif", fontSize: '14px' }}>
          Loading {title} ledger…
        </p>
      </div>
    );
  }

  return (
    <div className="pb-20">
      <div className="py-12 mb-8" style={{ background: '#0D1117', borderBottom: '3px solid #D97706' }}>
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <BackLink to={backTo}>{county ? `${county} County` : 'All Counties'}</BackLink>

          <div className="flex items-center gap-3 mb-3 flex-wrap">
            <h1 className="font-display text-white capitalize" style={{ fontSize: 'clamp(28px, 6vw, 44px)' }}>
              {title}
            </h1>
            {stats.ghostCount > 0 && (
              <span
                className="font-bold px-3 py-1 rounded-full uppercase tracking-wide animate-pulse"
                style={{
                  background: 'rgba(220,38,38,0.15)',
                  color: '#FCA5A5',
                  border: '1px solid rgba(220,38,38,0.3)',
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: '11px',
                }}
              >
                🔴 {stats.ghostCount} GHOST PROJECT{stats.ghostCount > 1 ? 'S' : ''}
              </span>
            )}
          </div>

          <p style={{ color: '#9CA3AF', fontSize: '16px', fontFamily: "'DM Sans', sans-serif" }}>
            Official allocation versus what auditors physically found on the ground.
          </p>

          {stats.years.length > 0 && (
            <p className="mt-2" style={{ color: '#6B7280', fontSize: '12px', fontFamily: "'DM Sans', sans-serif" }}>
              Audit years covered: {stats.years.join(' · ')}
            </p>
          )}
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {error && (
          <div
            className="rounded-2xl p-6 mb-8 text-center"
            style={{ background: '#111827', border: '1px solid rgba(220,38,38,0.3)' }}
          >
            <p style={{ color: '#F87171', fontSize: '14px', fontFamily: "'DM Sans', sans-serif" }}>
              ⚠️ {error}. Please try again shortly.
            </p>
          </div>
        )}

        {!error && stats.projectCount === 0 && (
          <div
            className="rounded-2xl p-10 text-center"
            style={{ background: '#111827', border: '1px solid #1F2937' }}
          >
            <div className="text-5xl mb-4">📂</div>
            <h2 className="font-display text-white mb-2" style={{ fontSize: '22px' }}>
              No Published Project Register Yet
            </h2>
            <p style={{ color: '#6B7280', fontSize: '14px', fontFamily: "'DM Sans', sans-serif", lineHeight: 1.7, maxWidth: '520px', margin: '0 auto 24px' }}>
              The Auditor-General has published reports for this area, but they do not
              include a project-by-project verification table. We show only what the
              source documents actually contain.
            </p>
            <Link
              to="/methodology"
              className="inline-block py-3 px-6 rounded-xl font-bold"
              style={{ background: '#1F2937', color: '#F9FAFB', fontSize: '14px', fontFamily: "'DM Sans', sans-serif" }}
            >
              How we verify →
            </Link>
          </div>
        )}

        {stats.projectCount > 0 && (
          <>
            <div className="rounded-2xl p-6 mb-8" style={{ background: '#111827', border: '1px solid #1F2937' }}>
              <h2
                className="font-bold uppercase tracking-widest mb-4"
                style={{ color: '#6B7280', fontSize: '11px', fontFamily: "'DM Sans', sans-serif" }}
              >
                Fiscal Summary · {health.label}
              </h2>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { l: 'Total Audited', v: formatKsh(stats.totalAllocated), c: '#D97706' },
                  { l: 'Projects', v: stats.projectCount, c: '#F9FAFB' },
                  { l: 'Flagged by Auditor', v: stats.flaggedCount, c: '#F59E0B' },
                  { l: 'Value at Risk', v: formatKsh(stats.flaggedValue), c: '#F87171' },
                ].map((s) => (
                  <div key={s.l}>
                    <p
                      className="uppercase tracking-widest font-semibold mb-1"
                      style={{ color: '#4B5563', fontSize: '10px', fontFamily: "'DM Sans', sans-serif" }}
                    >
                      {s.l}
                    </p>
                    <p className="font-bold font-mono-jet" style={{ color: s.c, fontSize: '18px' }}>{s.v}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="mb-6">
              <h2 className="text-2xl font-display font-bold text-white">Tracked Projects</h2>
              <p className="mt-1" style={{ color: '#6B7280', fontSize: '12px', fontFamily: "'DM Sans', sans-serif" }}>
                Each card cites the Auditor-General report and page it was read from.
              </p>
            </div>

            <ProjectList projects={projects} />
          </>
        )}
      </div>
    </div>
  );
};

export default ConstituencyPage;
