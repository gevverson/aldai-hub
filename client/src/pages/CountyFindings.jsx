import { useState, useEffect } from 'react';
import ProjectList from '../components/ProjectList';

/**
 * County findings — Nandi County Executive & Assembly.
 * These findings are county-wide (not tied to one of the six Aldai wards),
 * so they don't appear on the ward ledgers. This page gives them a home.
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

  const executive = (projects || []).filter((p) => !/Assembly/i.test(p.fund));
  const assembly  = (projects || []).filter((p) => /Assembly/i.test(p.fund));

  return (
    <div className="min-h-screen py-16 pb-24 px-4 sm:px-6 lg:px-8" style={{ background: '#0A0A0A' }}>
      <div className="max-w-4xl mx-auto">

        {/* Header */}
        <div className="text-center mb-14">
          <p className="font-bold uppercase tracking-widest mb-4"
             style={{ color: '#D97706', fontSize: '11px', fontFamily: "'DM Sans', sans-serif" }}>
            Serikali ya Kaunti ya Nandi · County-Level Findings
          </p>
          <h1 className="font-display text-white mb-6" style={{ fontSize: 'clamp(30px, 6vw, 48px)' }}>
            Nandi County: Executive &amp; Assembly
          </h1>
          <p className="max-w-2xl mx-auto font-medium leading-relaxed"
             style={{ color: '#9CA3AF', fontSize: '17px', fontFamily: "'DM Sans', sans-serif" }}>
            County-wide findings from the 2023/24 &amp; 2024/25 Auditor-General reports — pending bills,
            payroll fraud, hidden income and unsupported spending. These affect the whole county, so they
            are not tied to a single Aldai ward.
          </p>
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

        {projects && (
          <div className="space-y-14">
            <section>
              <h2 className="font-display text-white mb-1" style={{ fontSize: '22px' }}>County Executive</h2>
              <p className="mb-5" style={{ color: '#6B7280', fontSize: '13px', fontFamily: "'DM Sans', sans-serif" }}>
                Governor's administration — {executive.length} documented finding{executive.length === 1 ? '' : 's'}.
              </p>
              <ProjectList projects={executive} />
            </section>

            <section>
              <h2 className="font-display text-white mb-1" style={{ fontSize: '22px' }}>County Assembly</h2>
              <p className="mb-5" style={{ color: '#6B7280', fontSize: '13px', fontFamily: "'DM Sans', sans-serif" }}>
                The legislature that is meant to provide oversight — {assembly.length} documented finding{assembly.length === 1 ? '' : 's'}.
              </p>
              <ProjectList projects={assembly} />
            </section>
          </div>
        )}
      </div>
    </div>
  );
};

export default CountyFindings;
