import { useState, useEffect, useRef } from 'react';
import { Link, NavLink } from 'react-router-dom';
import AlertTicker from './AlertTicker';

const NAV_LINKS = [
  { to: '/',       label: 'Projects', sw: 'Miradi',  exact: true },
  { to: '/map',    label: 'Map',      sw: 'Mapa' },
  { to: '/report', label: 'Report',   sw: 'Ripoti' },
  { to: '/audit',  label: 'Audit AI', sw: 'Ukaguzi' },
  { to: '/about',  label: 'About',    sw: 'Kuhusu' },
];

const Navbar = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [todayReports, setTodayReports] = useState(null);
  const [navHeight, setNavHeight] = useState(92);
  const wrapperRef = useRef(null);

  /* Scroll detection */
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  /* Fetch today's anonymous report count */
  useEffect(() => {
    const fetchCount = () => {
      fetch('/api/reports/today-count')
        .then((r) => (r.ok ? r.json() : null))
        .then((d) => { if (d !== null) setTodayReports(d.count ?? d); })
        .catch(() => {});
    };
    fetchCount();
    const id = setInterval(fetchCount, 30_000);
    return () => clearInterval(id);
  }, []);

  /* Measure wrapper height for mobile overlay positioning */
  useEffect(() => {
    if (!wrapperRef.current) return;
    const ro = new ResizeObserver(() => {
      setNavHeight(wrapperRef.current?.offsetHeight ?? 92);
    });
    ro.observe(wrapperRef.current);
    return () => ro.disconnect();
  }, []);

  /* Close mobile menu on route change */
  const closeMenu = () => setMenuOpen(false);

  /* Lock body scroll when menu open */
  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [menuOpen]);

  return (
    <div ref={wrapperRef}>
      {/* ── Alert ticker sits ABOVE the sticky nav ── */}
      <AlertTicker />

      {/* ─────────────── NAVBAR ─────────────── */}
      <nav
        role="navigation"
        aria-label="Main navigation"
        className="sticky top-0 z-[999] transition-all duration-300"
        style={{
          background: scrolled
            ? 'rgba(10,10,10,0.92)'
            : '#0A0A0A',
          backdropFilter: scrolled ? 'blur(14px)' : 'none',
          WebkitBackdropFilter: scrolled ? 'blur(14px)' : 'none',
          borderBottom: scrolled ? '1px solid #1F2937' : '1px solid transparent',
          boxShadow: scrolled ? '0 4px 30px rgba(0,0,0,0.6)' : 'none',
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">

            {/* ── Logo ── */}
            <Link
              to="/"
              onClick={closeMenu}
              className="flex items-center gap-3 group flex-shrink-0"
              aria-label="Macho ya Mwananchi — Home"
            >
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-105"
                style={{ background: 'linear-gradient(135deg, #D97706, #F59E0B)' }}
              >
                <span className="text-lg leading-none" role="img" aria-label="Eye">👁️</span>
              </div>
              <div className="leading-tight">
                <p
                  className="font-display font-bold text-white leading-none"
                  style={{ fontSize: '15px', letterSpacing: '0.01em' }}
                >
                  MACHO YA MWANANCHI{' '}
                  <span role="img" aria-label="Kenya flag">🇰🇪</span>
                </p>
                <p
                  className="font-semibold uppercase tracking-widest leading-none mt-0.5"
                  style={{ fontSize: '9px', color: '#D97706' }}
                >
                  Citizen's Eye · Aldai Constituency
                </p>
              </div>
            </Link>

            {/* ── Desktop Nav Links ── */}
            <div className="hidden md:flex items-center gap-1">
              {NAV_LINKS.map(({ to, label, en, exact }) => (
                <NavLink
                  key={to}
                  to={to}
                  end={exact}
                  className={({ isActive }) =>
                    `relative flex flex-col items-center px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 ${
                      isActive
                        ? 'text-amber-400 bg-amber-500/10'
                        : 'text-gray-400 hover:text-white hover:bg-white/6'
                    }`
                  }
                  style={{ fontFamily: "'DM Sans', sans-serif" }}
                >
                  {({ isActive }) => (
                    <>
                      <span>{label}</span>
                      <span
                        style={{ fontSize: '9px', marginTop: '1px', opacity: 0.6 }}
                        className={isActive ? 'text-amber-300' : 'text-gray-500'}
                      >
                        {sw}
                      </span>
                    </>
                  )}
                </NavLink>
              ))}
            </div>

            {/* ── Right: LIVE indicator + CTA ── */}
            <div className="hidden md:flex items-center gap-3 flex-shrink-0">
              {/* Live report count */}
              <div
                className="flex items-center gap-2 rounded-full px-3 py-1.5"
                style={{
                  background: 'rgba(220,38,38,0.12)',
                  border: '1px solid rgba(220,38,38,0.25)',
                }}
                title="Anonymous reports submitted today"
              >
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
                </span>
                <span
                  className="text-red-300 font-bold uppercase tracking-widest"
                  style={{ fontSize: '10px', fontFamily: "'DM Sans', sans-serif" }}
                >
                  ● LIVE
                </span>
                {todayReports !== null && (
                  <span
                    className="text-red-200 font-mono-jet font-bold"
                    style={{ fontSize: '11px' }}
                  >
                    {todayReports}
                  </span>
                )}
              </div>

              {/* Ripoti CTA */}
              <Link
                to="/report"
                className="font-bold rounded-xl px-4 py-2 transition-all duration-200 hover:scale-105"
                style={{
                  background: '#D97706',
                  color: '#0A0A0A',
                  fontSize: '13px',
                  fontFamily: "'DM Sans', sans-serif",
                  boxShadow: '0 4px 14px rgba(217,119,6,0.3)',
                }}
              >
                Report →
              </Link>
            </div>

            {/* ── Mobile hamburger ── */}
            <button
              onClick={() => setMenuOpen((v) => !v)}
              className="md:hidden p-2 rounded-xl transition-colors"
              style={{ color: '#9CA3AF' }}
              aria-label={menuOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={menuOpen}
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                {menuOpen
                  ? <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  : <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />}
              </svg>
            </button>
          </div>
        </div>
      </nav>

      {/* ── Mobile Full-Screen Overlay ── */}
      {menuOpen && (
        <div
          className="md:hidden fixed inset-0 z-[998] flex flex-col"
          style={{ background: 'rgba(10,10,10,0.97)', backdropFilter: 'blur(16px)', top: `${navHeight}px` }}
        >
          <div className="flex flex-col flex-1 px-6 py-8 gap-2">
            {NAV_LINKS.map(({ to, label, en, exact }) => (
              <NavLink
                key={to}
                to={to}
                end={exact}
                onClick={closeMenu}
                className={({ isActive }) =>
                  `flex items-center justify-between px-5 py-4 rounded-2xl transition-all ${
                    isActive
                      ? 'bg-amber-500/15 border border-amber-500/30'
                      : 'border border-transparent hover:bg-white/5'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <span
                      className={`text-xl font-display font-bold ${isActive ? 'text-amber-400' : 'text-white'}`}
                    >
                      {label}
                    </span>
                    <span className="text-gray-500 text-sm">{sw} →</span>
                  </>
                )}
              </NavLink>
            ))}
          </div>

          {/* Bottom CTA in mobile menu */}
          <div className="px-6 py-6 border-t" style={{ borderColor: '#1F2937' }}>
            {todayReports !== null && (
              <div className="flex items-center justify-center gap-2 mb-4">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
                </span>
                <span className="text-red-300 text-sm font-bold">
                  {todayReports} reports today (ripoti leo)
                </span>
              </div>
            )}
            <Link
              to="/report"
              onClick={closeMenu}
              className="block w-full text-center font-bold py-4 rounded-2xl text-lg transition-all"
              style={{
                background: 'linear-gradient(135deg, #D97706, #F59E0B)',
                color: '#0A0A0A',
                fontFamily: "'DM Sans', sans-serif",
                boxShadow: '0 8px 24px rgba(217,119,6,0.3)',
              }}
            >
              🚨 Report Corruption (Ripoti Ufisadi)
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};

export default Navbar;
