import { Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import WardPage from './pages/WardPage';
import AuditTranslator from './pages/AuditTranslator';
import ReportPage from './pages/ReportPage';
import About from './pages/About';

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
        </Routes>
      </main>
      <footer className="bg-forest-900 text-forest-100 py-8 text-center border-t-4 border-amber-500">
        <div className="container mx-auto px-4">
          <p className="font-display font-bold text-xl mb-2 text-white">Macho ya Mwananchi</p>
          <p className="opacity-80">Citizen's Eye — Nandi County Accountability Platform</p>
          <p className="mt-4 text-sm opacity-60">"Ukweli ni nguvu." — The truth is power.</p>
        </div>
      </footer>
    </div>
  );
}

export default App;
