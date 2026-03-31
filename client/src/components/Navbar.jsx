import { useState, useEffect } from 'react';
import { Link, NavLink } from 'react-router-dom';
import AlertTicker from './AlertTicker';

const Navbar = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [reportCount, setReportCount] = useState(0);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const fetchCount = async () => {
      try {
        const res = await fetch('/api/projects/stats');
        const data = await res.json();
        setReportCount((data.citizensReporting || 0));
      } catch {}
    };
    fetchCount();
  }, []);

  const navLinks = [
    { to: '/', label: 'Home', exact: true },
    { to: '/map', label: '🗺️ Evidence Map', highlight: true },
    { to: '/audit', label: 'AI Auditor' },
    { to: '/report', label: 'File Report' },
    { to: '/about', label: 'About' },
  ];

  const linkClass = ({ isActive, highlight }) =>
    `text-sm font-semibold transition-all duration-200 px-3 py-1.5 rounded-lg ${
      isActive
        ? 'text-amber-400 bg-white/10'
        : highlight
        ? 'text-amber-400 hover:text-amber-300 bg-amber-500/10 hover:bg-amber-500/20'
        : 'text-forest-200 hover:text-white hover:bg-white/10'
    }`;

  return (
    <>
      <AlertTicker />
      <nav
        className={`sticky top-0 z-[1000] transition-all duration-300 ${
          scrolled
            ? 'bg-forest-950/90 backdrop-blur-md shadow-2xl bordered-b border-forest-800'
            : 'bg-forest-950'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14">

            {/* Logo */}
            <Link to="/" className="flex items-center gap-2.5 group" onClick={() => setMenuOpen(false)}>
              <div className="w-8 h-8 bg-amber-500 rounded-lg flex items-center justify-center shadow-md group-hover:scale-105 transition-transform">
                <span className="text-lg">👁️</span>
              </div>
              <div>
                <p className="text-white font-display font-black text-sm leading-none">Macho ya Mwananchi</p>
                <p className="text-amber-500 text-[10px] font-semibold leading-none tracking-widest uppercase">Citizen's Eye</p>
              </div>
            </Link>

            {/* Desktop Nav */}
            <div className="hidden md:flex items-center gap-1">
              {navLinks.map((link) => (
                <NavLink
                  key={link.to}
                  to={link.to}
                  end={link.exact}
                  className={({ isActive }) => linkClass({ isActive, highlight: link.highlight })}
                >
                  {link.label}
                </NavLink>
              ))}
            </div>

            {/* Report CTA */}
            <div className="hidden md:flex items-center gap-3">
              {reportCount > 0 && (
                <div className="flex items-center gap-1.5 bg-red-900/50 border border-red-700/50 rounded-full px-3 py-1">
                  <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />
                  <span className="text-red-300 text-xs font-bold">{reportCount} reporting</span>
                </div>
              )}
              <Link to="/report" className="bg-amber-500 hover:bg-amber-400 text-forest-950 text-xs font-black px-4 py-2 rounded-lg transition-all shadow-md hover:shadow-amber-500/30 hover:shadow-lg">
                Report Corruption →
              </Link>
            </div>

            {/* Mobile hamburger */}
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="md:hidden text-forest-200 hover:text-white p-2 rounded-lg hover:bg-white/10 transition-colors"
              aria-label="Toggle menu"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                {menuOpen
                  ? <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  : <path strokeLinecap="round" strokeLinejoin="round" d="M4 7h16M4 12h16M4 17h16" />}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {menuOpen && (
          <div className="md:hidden bg-forest-950/98 backdrop-blur-md border-t border-forest-800 px-4 py-4 space-y-1">
            {navLinks.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.exact}
                onClick={() => setMenuOpen(false)}
                className={({ isActive }) => `${linkClass({ isActive, highlight: link.highlight })} block w-full text-left`}
              >
                {link.label}
              </NavLink>
            ))}
            <div className="pt-3">
              <Link
                to="/report"
                onClick={() => setMenuOpen(false)}
                className="block bg-amber-500 hover:bg-amber-400 text-forest-950 text-sm font-black px-4 py-3 rounded-xl transition-all text-center"
              >
                🚨 Report Corruption
              </Link>
            </div>
          </div>
        )}
      </nav>
    </>
  );
};

export default Navbar;
