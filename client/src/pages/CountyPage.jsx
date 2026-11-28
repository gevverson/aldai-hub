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
  const withFindings = county.constituencies.filter((k) => k.findingCount > 0).length;

  // Most OAG reports are narrative: they carry an opinion and its basis, but no
  // project-by-project register. 28 of 47 counties are in that shape. This page
  // used to render them as four zeros and a sentence about projects that do not
  // exist — Meru showed "Projects Audited 0 · Public Funds Traced KSh 0" while
  // holding 457 cited findings the reader was never told about.
  const findingsOnly = county.projectCount === 0 && county.findingCount > 0;
  const years = county.findingYears || [];
  const yearSpan = years.length
    ? (years.length === 1 ? years[0] : `${years[0]} – ${years[years.length - 1]}`)
    : '—';

  const stats = findingsOnly
    ? [
        { l: 'Audit Findings', v: county.findingCount, c: '#D97706' },
        { l: 'Constituencies Audited', v: `${withFindings} of ${county.constituencies.length}`, c: '#F9FAFB' },
        { l: 'Financial Years', v: yearSpan, c: '#F9FAFB' },
        // A count, not a sum: see the note on findingRollup in the API. These
        // findings are not addends and a total would invent a number.
        { l: 'Findings With a Figure', v: county.findingsWithAmount, c: '#F59E0B' },
      ]
    : [
        { l: 'Projects Audited', v: county.projectCount, c: '#F9FAFB' },
        { l: 'Public Funds Traced', v: formatKsh(county.totalAllocated), c: '#D97706' },
        { l: 'Flagged by Auditor', v: `${county.flaggedCount} · ${formatKsh(county.flaggedValue)}`, c: '#F59E0B' },
        { l: 'Ghost Projects', v: county.ghostCount, c: '#F87171' },
      ];

  return (
    <div className="pb-20">
      <div className="py-12 mb-10" style={{ background: '#0D1117', borderBottom: '3px solid #D97706' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <BackLink to="/counties">All Counties</BackLink>

          <h1 className="font-display text-white mb-3" style={{ fontSize: 'clamp(28px, 6vw, 48px)' }}>
            {county.name} County
          </h1>
          <p style={{ color: '#9CA3AF', fontSize: '16px', fontFamily: "'DM Sans', sans-serif" }}>
            {findingsOnly
              ? 'Select a constituency to read the Auditor-General’s findings, each cited to its report and page.'
              : 'Select a constituency to see every audited project, with the report and page it came from.'}
          </p>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-8">
            {stats.map((s) => (
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
        {/* Say why the project columns are absent, rather than showing zeros
            and letting a reader conclude their county was never audited. */}
        {findingsOnly && (
          <div className="rounded-2xl p-6 mb-10" style={{ background: '#111827', border: '1px solid #1F2937' }}>
            <div className="flex items-start gap-3">
              <span style={{ fontSize: '18px', lineHeight: 1.3 }}>📄</span>
              <div>
                <h2 className="font-display text-white mb-1" style={{ fontSize: '18px' }}>
                  No project register published for {county.name}
                </h2>
                <p style={{ color: '#D97706', fontSize: '12px', fontFamily: "'DM Sans', sans-serif", fontStyle: 'italic', marginBottom: '10px' }}>
                  Hakuna orodha ya miradi — matokeo ya ukaguzi yapo
                </p>
                <p style={{ color: '#9CA3AF', fontSize: '14px', fontFamily: "'DM Sans', sans-serif", lineHeight: 1.7 }}>
                  {county.name} was audited. Its Auditor-General reports are{' '}
                  <strong style={{ color: '#F9FAFB' }}>narrative</strong>: they give an opinion and the
                  findings behind it, but no project-by-project verification appendix listing what was
                  built and whether it exists. Only some NG-CDF reports carry that appendix.
                </p>
                <p className="mt-3" style={{ color: '#9CA3AF', fontSize: '14px', fontFamily: "'DM Sans', sans-serif", lineHeight: 1.7 }}>
                  So there are no project cards here — inventing them would mean inventing projects. What
                  the auditor did record is{' '}
                  <strong style={{ color: '#F9FAFB' }}>{county.findingCount} findings</strong> across{' '}
                  {withFindings} constituenc{withFindings === 1 ? 'y' : 'ies'}, each quoted verbatim and
                  cited to its report and page. Open a constituency below to read them.
                </p>
                <Link
                  to="/methodology"
                  className="inline-block mt-4 font-semibold"
                  style={{ color: '#D97706', fontSize: '13px', fontFamily: "'DM Sans', sans-serif" }}
                >
                  How coverage is decided →
                </Link>
              </div>
            </div>
          </div>
        )}

        <div className="flex flex-wrap items-end justify-between gap-3 mb-6">
          <h2 className="text-2xl font-display font-bold text-white">Constituencies</h2>
          <p style={{ color: '#6B7280', fontSize: '12px', fontFamily: "'DM Sans', sans-serif" }}>
            {findingsOnly
              ? `${withFindings} of ${county.constituencies.length} with audit findings on record`
              : `${covered} of ${county.constituencies.length} with published project data`}
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
                to={`/counties/${slug(county.name)}/county-wide`}
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
