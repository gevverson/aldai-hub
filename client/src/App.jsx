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
    <div className="min-h-screen flex flex-col font-sans text-forest-900 bg-forest-50">
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
      <footer className="bg-forest-950 text-forest-100 py-8 text-center border-t border-forest-800">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-center gap-2 mb-2">
            <span className="text-2xl">👁️</span>
            <p className="font-display font-black text-xl text-white">Macho ya Mwananchi</p>
          </div>
          <p className="opacity-70 text-sm">Citizen's Eye — Aldai Constituency Accountability Platform</p>
          <div className="border-t border-forest-800 mt-4 pt-4 flex flex-col sm:flex-row gap-2 justify-center text-xs opacity-50">
            <span>Data: OAG Kenya · NG-CDF Board · Controller of Budget</span>
            <span className="hidden sm:inline">·</span>
            <span>EACC: 0800 720 629 · DCI: 0800 722 203</span>
          </div>
          <p className="mt-3 text-xs opacity-40 italic">"Ukweli ni nguvu." — The truth is power.</p>
        </div>
      </footer>
    </div>
  );
}

export default App;
