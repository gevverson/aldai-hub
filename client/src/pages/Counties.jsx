import { useState, useEffect, useMemo, useRef } from 'react';
import AreaCard from '../components/AreaCard';
import { slug, formatKsh } from '../lib/geo';

/* ── Kenya's 8 former provinces → county mapping ── */
const REGIONS = {
  'All Counties': null,
  'Nairobi':      ['Nairobi'],
  'Central':      ['Nyandarua', 'Nyeri', 'Kirinyaga', "Murang'a", 'Kiambu'],
  'Coast':        ['Mombasa', 'Kwale', 'Kilifi', 'Tana River', 'Lamu', 'Taita-Taveta'],
  'Eastern':      ['Marsabit', 'Isiolo', 'Meru', 'Tharaka-Nithi', 'Embu', 'Kitui', 'Machakos', 'Makueni'],
  'North Eastern': ['Garissa', 'Wajir', 'Mandera'],
  'Nyanza':       ['Siaya', 'Kisumu', 'Homa Bay', 'Migori', 'Kisii', 'Nyamira'],
  'Rift Valley':  ['Turkana', 'West Pokot', 'Samburu', 'Trans-Nzoia', 'Uasin Gishu', 'Elgeyo-Marakwet', 'Nandi', 'Baringo', 'Laikipia', 'Nakuru', 'Narok', 'Kajiado', 'Kericho', 'Bomet'],
  'Western':      ['Kakamega', 'Vihiga', 'Bungoma', 'Busia'],
};

const REGION_COLORS = {
  'All Counties':  '#D97706',
  'Nairobi':       '#F59E0B',
  'Central':       '#10B981',
  'Coast':         '#06B6D4',
  'Eastern':       '#8B5CF6',
  'North Eastern': '#EF4444',
  'Nyanza':        '#3B82F6',
  'Rift Valley':   '#F97316',
  'Western':       '#EC4899',
};

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
  const [search, setSearch] = useState('');
  const [region, setRegion] = useState('All Counties');
  const [view, setView] = useState('grid'); // 'grid' | 'list'
  const searchRef = useRef(null);

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

  /* ── Filter logic ── */
  const filtered = useMemo(() => {
    let list = counties;

    // Region filter
    if (region !== 'All Counties' && REGIONS[region]) {
      const allowed = new Set(REGIONS[region]);
      list = list.filter((c) => allowed.has(c.name));
    }

    // Search filter
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter((c) =>
        c.name.toLowerCase().includes(q) ||
        c.constituencies?.some((con) => con.name.toLowerCase().includes(q))
      );
    }

    return list;
  }, [counties, region, search]);

  /* ── Data tiers ── */
  const live     = filtered.filter((c) => c.projectCount > 0);
  const reviewed = filtered.filter((c) => c.projectCount === 0 && (c.findingCount || 0) > 0);
  const soon     = filtered.filter((c) => c.projectCount === 0 && (c.findingCount || 0) === 0);

  const totals = counties.reduce(
    (acc, c) => ({
      projects:     acc.projects + (c.projectCount || 0),
      value:        acc.value + (c.totalAllocated || 0),
      ghosts:       acc.ghosts + (c.ghostCount || 0),
      findings:     acc.findings + (c.findingCount || 0),
      liveCounties: acc.liveCounties + (c.projectCount > 0 ? 1 : 0),
      countyTotal:  acc.countyTotal + 1,
    }),
    { projects: 0, value: 0, ghosts: 0, findings: 0, liveCounties: 0, countyTotal: 0 }
  );

  /* ── Keyboard shortcut: Ctrl+K → focus search ── */
  useEffect(() => {
    const handler = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        searchRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  return (
    <div className="pb-20">
      {/* ── Header ── */}
      <div className="py-12 mb-6" style={{ background: '#0D1117', borderBottom: '3px solid #D97706' }}>
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
                { v: totals.findings.toLocaleString(), l: 'Audit findings' },
                { v: totals.ghosts, l: 'Ghost projects', danger: true },
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
        {/* ── Search + Filters Bar ── */}
        {!loading && !error && (
          <div className="mb-8 space-y-4">
            {/* Search */}
            <div className="relative max-w-xl mx-auto">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <svg className="w-5 h-5" style={{ color: '#6B7280' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                ref={searchRef}
                id="county-search"
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search county or constituency… (Ctrl+K)"
                className="w-full rounded-xl py-3.5 pl-12 pr-10 text-sm transition-all duration-200 focus:outline-none focus:ring-2"
                style={{
                  background: '#111827',
                  border: '1px solid #1F2937',
                  color: '#F9FAFB',
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: '14px',
                }}
                onFocus={(e) => { e.target.style.borderColor = '#D97706'; e.target.style.boxShadow = '0 0 0 2px rgba(217,119,6,0.25)'; }}
                onBlur={(e) => { e.target.style.borderColor = '#1F2937'; e.target.style.boxShadow = 'none'; }}
              />
              {search && (
                <button
                  onClick={() => setSearch('')}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center"
                  aria-label="Clear search"
                >
                  <svg className="w-4 h-4" style={{ color: '#6B7280' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>

            {/* Region pills + view toggle */}
            <div className="flex flex-wrap items-center gap-2 justify-center">
              {Object.keys(REGIONS).map((r) => {
                const isActive = region === r;
                const regionCounties = r === 'All Counties' ? counties : counties.filter((c) => REGIONS[r]?.includes(c.name));
                const count = regionCounties.length;
                return (
                  <button
                    key={r}
                    onClick={() => setRegion(r)}
                    className="px-3.5 py-1.5 rounded-full text-xs font-bold uppercase tracking-wide transition-all duration-200"
                    style={{
                      background: isActive ? REGION_COLORS[r] : 'transparent',
                      color: isActive ? '#0A0A0A' : '#9CA3AF',
                      border: `1.5px solid ${isActive ? REGION_COLORS[r] : '#1F2937'}`,
                      fontFamily: "'DM Sans', sans-serif",
                      transform: isActive ? 'scale(1.05)' : 'scale(1)',
                      boxShadow: isActive ? `0 4px 16px ${REGION_COLORS[r]}40` : 'none',
                    }}
                  >
                    {r === 'All Counties' ? `All (${counties.length})` : `${r} (${count})`}
                  </button>
                );
              })}

              {/* View toggle */}
              <div
                className="ml-auto hidden sm:flex items-center rounded-lg overflow-hidden"
                style={{ border: '1px solid #1F2937' }}
              >
                <button
                  onClick={() => setView('grid')}
                  className="p-2 transition-colors"
                  style={{ background: view === 'grid' ? '#1F2937' : 'transparent', color: view === 'grid' ? '#D97706' : '#6B7280' }}
                  aria-label="Grid view"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM11 13a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                  </svg>
                </button>
                <button
                  onClick={() => setView('list')}
                  className="p-2 transition-colors"
                  style={{ background: view === 'list' ? '#1F2937' : 'transparent', color: view === 'list' ? '#D97706' : '#6B7280' }}
                  aria-label="List view"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Active filter + results count */}
            {(search || region !== 'All Counties') && (
              <div className="flex items-center justify-between">
                <p style={{ color: '#9CA3AF', fontSize: '13px', fontFamily: "'DM Sans', sans-serif" }}>
                  Showing <strong style={{ color: '#F9FAFB' }}>{filtered.length}</strong> of {counties.length} counties
                  {region !== 'All Counties' && (
                    <span style={{ color: REGION_COLORS[region] }}> in {region}</span>
                  )}
                  {search && (
                    <span> matching "<em style={{ color: '#D97706' }}>{search}</em>"</span>
                  )}
                </p>
                <button
                  onClick={() => { setSearch(''); setRegion('All Counties'); }}
                  className="text-xs font-bold uppercase tracking-wide transition-colors hover:text-white"
                  style={{ color: '#6B7280', fontFamily: "'DM Sans', sans-serif" }}
                >
                  Clear filters ×
                </button>
              </div>
            )}
          </div>
        )}

        {/* ── Error state ── */}
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

        {/* ── Loading state ── */}
        {loading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        )}

        {/* ── No results ── */}
        {!loading && !error && filtered.length === 0 && (
          <div className="text-center py-16">
            <p className="text-5xl mb-4">🔍</p>
            <p className="font-display text-white text-xl mb-2">No counties found</p>
            <p style={{ color: '#6B7280', fontSize: '14px', fontFamily: "'DM Sans', sans-serif" }}>
              Try a different search term or clear your filters.
            </p>
          </div>
        )}

        {/* ── County grid / list ── */}
        {!loading && !error && filtered.length > 0 && (
          <>
            {live.length > 0 && (
              <Section
                title="Live now"
                subtitle="Counties with Auditor-General data ingested and verified."
                badge={live.length}
                badgeColor="#16A34A"
              >
                <CountyGrid counties={live} view={view} />
              </Section>
            )}

            {reviewed.length > 0 && (
              <Section
                title="Audit findings available"
                subtitle="Counties whose Auditor-General reports raise findings but publish no project register — real, cited audit data, no project map yet."
                badge={reviewed.length}
                badgeColor="#D97706"
              >
                <CountyGrid counties={reviewed} view={view} />
              </Section>
            )}

            {soon.length > 0 && (
              <Section
                title={`Coming soon · ${soon.length} counties`}
                subtitle="Every Kenyan county is mapped. Evidence fills in as each one's Auditor-General reports are processed — claims never outrun the sources."
              >
                <div className="flex flex-wrap gap-2">
                  {soon.map((county) => (
                    <span
                      key={county.name}
                      className="px-3 py-1.5 rounded-full transition-all duration-200 hover:border-amber-500/50"
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
              </Section>
            )}
          </>
        )}
      </div>
    </div>
  );
};

/* ── Section wrapper ── */
const Section = ({ title, subtitle, badge, badgeColor, children }) => (
  <div className="mb-14">
    <div className="flex items-center gap-3 mb-1">
      <h2 className="font-display text-white" style={{ fontSize: '22px' }}>
        {title}
      </h2>
      {badge != null && (
        <span
          className="font-mono-jet font-bold px-2.5 py-0.5 rounded-full"
          style={{ background: `${badgeColor}20`, color: badgeColor, fontSize: '12px' }}
        >
          {badge}
        </span>
      )}
    </div>
    <p className="mb-5" style={{ color: '#6B7280', fontSize: '13px', fontFamily: "'DM Sans', sans-serif" }}>
      {subtitle}
    </p>
    {children}
  </div>
);

/* ── Grid / List renderer ── */
const CountyGrid = ({ counties, view }) => {
  if (view === 'list') {
    return (
      <div className="space-y-2">
        {counties.map((county) => (
          <a
            key={county.name}
            href={`/counties/${slug(county.name)}`}
            className="group flex items-center justify-between gap-4 px-5 py-3.5 rounded-xl transition-all duration-200 hover:-translate-y-[1px]"
            style={{ background: '#111827', border: '1px solid #1F2937' }}
            onMouseOver={(e) => { e.currentTarget.style.borderColor = '#D97706'; }}
            onMouseOut={(e) => { e.currentTarget.style.borderColor = '#1F2937'; }}
          >
            <div className="flex items-center gap-4 min-w-0">
              <h3 className="font-display text-white group-hover:text-amber-300 transition-colors truncate" style={{ fontSize: '16px' }}>
                {county.name}
              </h3>
              <span style={{ color: '#4B5563', fontSize: '11px', fontFamily: "'DM Sans', sans-serif" }}>
                {county.constituencies.length} constituencies
              </span>
            </div>
            <div className="flex items-center gap-6 flex-shrink-0">
              {county.projectCount > 0 && (
                <span className="font-mono-jet font-bold" style={{ color: '#D97706', fontSize: '14px' }}>
                  {formatKsh(county.totalAllocated)}
                </span>
              )}
              <span className="font-mono-jet font-bold text-white" style={{ fontSize: '14px' }}>
                {county.projectCount > 0 ? `${county.projectCount} projects` : `${county.findingCount || 0} findings`}
              </span>
              {county.ghostCount > 0 && (
                <span className="badge badge-ghost text-xs">🔴 {county.ghostCount} ghost</span>
              )}
              <span className="text-sm transition-transform group-hover:translate-x-1" style={{ color: '#D97706' }}>→</span>
            </div>
          </a>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
      {counties.map((county) => (
        <AreaCard
          key={county.name}
          area={county}
          to={`/counties/${slug(county.name)}`}
          kicker={`${county.constituencies.length} constituencies`}
        />
      ))}
    </div>
  );
};

export default Counties;
