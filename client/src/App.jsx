import { Routes, Route, Link } from 'react-router-dom';
import { Suspense, lazy } from 'react';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import WardPage from './pages/WardPage';
import AuditTranslator from './pages/AuditTranslator';
import ReportPage from './pages/ReportPage';
import About from './pages/About';
import Methodology from './pages/Methodology';
import CountyFindings from './pages/CountyFindings';
import Counties from './pages/Counties';
import CountyPage from './pages/CountyPage';
import ConstituencyPage from './pages/ConstituencyPage';

// Lazy-load the map — Leaflet is heavy, so keep it out of the initial bundle
// for faster first paint on low-bandwidth mobile connections.
const VerificationMap = lazy(() => import('./pages/VerificationMap'));

// Any unmatched URL previously rendered nothing at all — a stale link or a
// typo left the citizen staring at a bare header and footer with no clue what
// went wrong. Send them somewhere useful instead.
const NotFound = () => (
  <div className="max-w-2xl mx-auto px-6 py-24 text-center">
    <p className="text-sm tracking-widest uppercase" style={{ color: '#D97706' }}>
      404 · Ukurasa haupatikani
    </p>
    <h1 className="mt-4 text-3xl font-bold">This page doesn't exist</h1>
    <p className="mt-4" style={{ color: '#9CA3AF' }}>
      The link may be out of date. Every county, constituency and audit finding
      is reachable from the county list.
    </p>
    <div className="mt-8 flex flex-wrap gap-3 justify-center">
      <Link to="/counties" className="px-5 py-2.5 rounded-lg font-semibold"
            style={{ background: '#D97706', color: '#0A0A0A' }}>
        Browse counties
      </Link>
      <Link to="/" className="px-5 py-2.5 rounded-lg font-semibold"
            style={{ border: '1px solid #1F2937', color: '#F9FAFB' }}>
        Home
      </Link>
    </div>
  </div>
);

const RouteFallback = () => (
  <div className="flex items-center justify-center" style={{ minHeight: '60vh' }}>
    <div className="w-10 h-10 border-4 rounded-full animate-spin"
         style={{ borderColor: '#D97706', borderTopColor: 'transparent' }} />
  </div>
);

function App() {
  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#0A0A0A', color: '#F9FAFB' }}>
      <Navbar />
      <main className="flex-grow w-full">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/ward/:wardName" element={<WardPage />} />
          <Route path="/audit" element={<AuditTranslator />} />
          <Route path="/report" element={<ReportPage />} />
          <Route path="/about" element={<About />} />
          <Route path="/county" element={<CountyFindings />} />

          {/* County → Constituency → Projects drill-down.
              Kept under /counties/* so the "Counties" nav item prefix-matches
              the whole flow, and never collides with /county (Findings). */}
          <Route path="/counties" element={<Counties />} />
          <Route path="/counties/:countyName" element={<CountyPage />} />
          <Route path="/counties/:countyName/county-wide" element={<ConstituencyPage countyWide />} />
          <Route path="/constituency/:constituencyName" element={<ConstituencyPage />} />
          <Route path="/methodology" element={<Methodology />} />
          <Route path="/map" element={
            <Suspense fallback={<RouteFallback />}>
              <VerificationMap />
            </Suspense>
          } />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>

      {/* ── Footer ── */}
      <footer
        className="py-12 text-center"
        style={{ background: '#0D1117', borderTop: '1px solid #1F2937' }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Logo row */}
          <div className="flex items-center justify-center gap-3 mb-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #D97706, #F59E0B)' }}
            >
              <span className="text-xl">👁️</span>
            </div>
            <div className="text-left">
              <p
                className="font-display font-bold text-white leading-none"
                style={{ fontSize: '17px' }}
              >
                MACHO YA MWANANCHI 🇰🇪
              </p>
              <p
                className="font-semibold uppercase tracking-widest leading-none mt-0.5"
                style={{ fontSize: '9px', color: '#D97706' }}
              >
                Citizen's Eye · Public Fund Accountability · Kenya
              </p>
            </div>
          </div>

          <p
            className="mb-6"
            style={{ color: '#6B7280', fontSize: '13px', fontFamily: "'DM Sans', sans-serif" }}
          >
            "Ukweli ni nguvu." — The truth is power.
          </p>

          {/* Data attribution */}
          <div
            className="flex flex-col sm:flex-row items-center justify-center gap-2 text-center"
            style={{ color: '#4B5563', fontSize: '11px', fontFamily: "'DM Sans', sans-serif" }}
          >
            <span>Data: OAG Kenya · NG-CDF Board · Controller of Budget</span>
            <span className="hidden sm:inline" aria-hidden>·</span>
            <span>EACC Hotline: 0800 720 629</span>
            <span className="hidden sm:inline" aria-hidden>·</span>
            <span>DCI: 0800 722 203</span>
          </div>

          <p
            className="mt-6"
            style={{ color: '#374151', fontSize: '11px', fontFamily: "'DM Sans', sans-serif" }}
          >
            Citizens are fully anonymous. No identity data is stored. EXIF metadata stripped from all uploads.
          </p>

          {/* Builder credit */}
          <div
            className="mt-8 pt-6 flex flex-col items-center gap-2"
            style={{ borderTop: '1px solid #1a1a1a' }}
          >
            <p style={{ color: '#374151', fontSize: '10px', fontFamily: "'DM Sans', sans-serif", letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              Designed &amp; Built by
            </p>
            <p
              className="font-display font-bold"
              style={{ color: '#9CA3AF', fontSize: '14px', letterSpacing: '0.04em' }}
            >
              Gevverson Kipkoech
            </p>
            <p style={{ color: '#4B5563', fontSize: '10px', fontFamily: "'DM Sans', sans-serif" }}>
              AI Software Engineer · LLM &amp; Automation Specialist · Full-Stack Architect
            </p>
            <div className="flex items-center gap-4 mt-1">
              {/* LinkedIn */}
              <a
                href="https://linkedin.com/in/gevverson-kipkoech"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Gevverson Kipkoech on LinkedIn"
                className="transition-opacity hover:opacity-100"
                style={{ opacity: 0.45 }}
                onMouseEnter={(e) => { e.currentTarget.style.opacity = '1'; }}
                onMouseLeave={(e) => { e.currentTarget.style.opacity = '0.45'; }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="#9CA3AF" xmlns="http://www.w3.org/2000/svg">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                </svg>
              </a>
              {/* GitHub */}
              <a
                href="https://github.com/gevverson"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Gevverson Kipkoech on GitHub"
                className="transition-opacity hover:opacity-100"
                style={{ opacity: 0.45 }}
                onMouseEnter={(e) => { e.currentTarget.style.opacity = '1'; }}
                onMouseLeave={(e) => { e.currentTarget.style.opacity = '0.45'; }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="#9CA3AF" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/>
                </svg>
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
