import { useState, useEffect, useMemo } from 'react';
import ProjectList from '../components/ProjectList';

/**
 * County-government findings — County Executive & County Assembly.
 *
 * These are county-wide: they come from the Auditor-General's reports on a
 * county government as a whole, not from an NG-CDF constituency report, so they
 * have no constituency or ward to sit under and would otherwise never surface.
 *
 * Grouped by county rather than hardcoded to one. Until 2026-09 this page
 * queried every county's projects but presented them under a fixed "Nandi
 * County" heading — correct only for as long as Nandi was the only county with
 * an Executive/Assembly register, and silently wrong the moment a second one
 * was ingested.
 */
const CountyFindings = () => {
  const [projects, setProjects] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch('/api/projects')
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error('Failed to load'))))
      .then((json) => setProjects((json.data || []).filter((p) => p.fund !== 'NG-CDF')))
      .catch((err) => setError(err.message));
  }, []);

  // county → { executive: [], assembly: [] }, counties in descending size so the
  // best-evidenced county leads.
  const byCounty = useMemo(() => {
    const m = new Map();
    for (const p of projects || []) {
      const county = p.county || 'Unattributed';
      if (!m.has(county)) m.set(county, { executive: [], assembly: [] });
      m.get(county)[/Assembly/i.test(p.fund) ? 'assembly' : 'executive'].push(p);
    }
    return [...m.entries()].sort(
      (a, b) =>
        b[1].executive.length + b[1].assembly.length -
        (a[1].executive.length + a[1].assembly.length),
    );
  }, [projects]);

  const total = (projects || []).length;

  return (
    <div className="min-h-screen py-16 pb-24 px-4 sm:px-6 lg:px-8" style={{ background: '#0A0A0A' }}>
      <div className="max-w-4xl mx-auto">

        {/* Header */}
        <div className="text-center mb-14">
          <p className="font-bold uppercase tracking-widest mb-4"
             style={{ color: '#D97706', fontSize: '11px', fontFamily: "'DM Sans', sans-serif" }}>
            Serikali za Kaunti · County-Level Findings
          </p>
          <h1 className="font-display text-white mb-6" style={{ fontSize: 'clamp(30px, 6vw, 48px)' }}>
            County Executive &amp; Assembly
          </h1>
          <p className="max-w-2xl mx-auto font-medium leading-relaxed"
             style={{ color: '#9CA3AF', fontSize: '17px', fontFamily: "'DM Sans', sans-serif" }}>
            County-wide findings from Auditor-General reports on county governments — pending bills,
            payroll irregularities, undisclosed income and unsupported spending. These affect a whole
            county, so they are not tied to any single constituency or ward.
          </p>
          {projects && total > 0 && (
            <p className="mt-4" style={{ color: '#6B7280', fontSize: '13px', fontFamily: "'DM Sans', sans-serif" }}>
              {total} finding{total === 1 ? '' : 's'} across {byCounty.length}{' '}
              count{byCounty.length === 1 ? 'y' : 'ies'} with a county-government register.
            </p>
          )}
          <div className="w-24 h-1 mx-auto mt-8" style={{ background: '#D97706' }} />
        </div>

        {error && (
          <div className="rounded-2xl p-8 text-center" style={{ background: '#111827', border: '1px solid #1F2937' }}>
            <p style={{ color: '#6B7280' }}>Could not load findings right now. Please try again shortly.</p>
          </div>
        )}

        {!projects && !error && (
          <div className="flex flex-col items-center py-16">
            <div className="w-12 h-12 rounded-full border-4 border-t-transparent animate-spin mb-4"
                 style={{ borderColor: '#D97706', borderTopColor: 'transparent' }} />
            <p style={{ color: '#6B7280', fontFamily: "'DM Sans', sans-serif", fontSize: '14px' }}>Loading county findings…</p>
          </div>
        )}

        {projects && total === 0 && (
          <div className="rounded-2xl p-8 text-center" style={{ background: '#111827', border: '1px solid #1F2937' }}>
            <p style={{ color: '#9CA3AF' }}>
              No county-government findings are published yet. Constituency-level audit findings are
              available on the Counties pages.
            </p>
          </div>
        )}

        {projects && total > 0 && (
          <div className="space-y-16">
            {byCounty.map(([county, { executive, assembly }]) => (
              <div key={county}>
                <div className="flex items-baseline gap-3 mb-6 pb-3" style={{ borderBottom: '1px solid #1F2937' }}>
                  <h2 className="font-display text-white" style={{ fontSize: '26px' }}>{county} County</h2>
                  <span style={{ color: '#6B7280', fontSize: '13px', fontFamily: "'DM Sans', sans-serif" }}>
                    {executive.length + assembly.length} finding{executive.length + assembly.length === 1 ? '' : 's'}
                  </span>
                </div>

                <div className="space-y-12">
                  {executive.length > 0 && (
                    <section>
                      <h3 className="font-display text-white mb-1" style={{ fontSize: '20px' }}>County Executive</h3>
                      <p className="mb-5" style={{ color: '#6B7280', fontSize: '13px', fontFamily: "'DM Sans', sans-serif" }}>
                        The Governor&rsquo;s administration — {executive.length} documented finding{executive.length === 1 ? '' : 's'}.
                      </p>
                      <ProjectList projects={executive} />
                    </section>
                  )}

                  {assembly.length > 0 && (
                    <section>
                      <h3 className="font-display text-white mb-1" style={{ fontSize: '20px' }}>County Assembly</h3>
                      <p className="mb-5" style={{ color: '#6B7280', fontSize: '13px', fontFamily: "'DM Sans', sans-serif" }}>
                        The legislature that is meant to provide oversight — {assembly.length} documented finding{assembly.length === 1 ? '' : 's'}.
                      </p>
                      <ProjectList projects={assembly} />
                    </section>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default CountyFindings;
