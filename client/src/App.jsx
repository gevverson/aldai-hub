import { Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import WardPage from './pages/WardPage';
import AuditTranslator from './pages/AuditTranslator';
import ReportPage from './pages/ReportPage';
import About from './pages/About';
import VerificationMap from './pages/VerificationMap';

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
          <Route path="/map" element={<VerificationMap />} />
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
                Citizen's Eye · Aldai Constituency Accountability
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
        </div>
      </footer>
    </div>
  );
}

export default App;
