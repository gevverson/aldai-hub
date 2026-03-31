import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Hero from '../components/Hero';
import QuickStats from '../components/QuickStats';
import WardSelector from '../components/WardSelector';

const BreakingEvidence = () => {
  const [verifications, setVerifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/verifications/recent')
      .then(r => r.json())
      .then(data => { setVerifications(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const STATUS_LABELS = {
    CONFIRMS_GHOST:    { label: '👻 Ghost Confirmed', bg: 'bg-purple-100 text-purple-800 border-purple-200' },
    CONFIRMS_STALLED:  { label: '🚧 Stalled Confirmed', bg: 'bg-orange-100 text-orange-800 border-orange-200' },
    CONFIRMS_COMPLETE: { label: '✅ Working', bg: 'bg-green-100 text-green-800 border-green-200' },
    DISPUTES_OFFICIAL: { label: '⚠️ Disputed', bg: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
  };

  if (loading || verifications.length === 0) return null;

  return (
    <section className="bg-gray-950 py-10 border-y border-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 bg-red-500 rounded-full animate-ping" />
              <span className="text-red-400 text-xs font-black uppercase tracking-widest">Live Evidence</span>
            </div>
            <h2 className="text-white font-display font-bold text-xl">Breaking Citizen Reports</h2>
          </div>
          <Link to="/map" className="text-amber-400 hover:text-amber-300 text-sm font-semibold transition-colors flex items-center gap-1">
            View all on map →
          </Link>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {verifications.slice(0, 3).map((v) => {
            const status = STATUS_LABELS[v.status] || { label: v.status, bg: 'bg-gray-100 text-gray-800' };
            return (
              <div key={v._id} className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden hover:border-gray-600 transition-colors group">
                {v.photoUrl && (
                  <div className="h-36 overflow-hidden">
                    <img src={v.photoUrl} alt="Evidence" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  </div>
                )}
                <div className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${status.bg}`}>{status.label}</span>
                    <span className="text-gray-500 text-xs">{new Date(v.createdAt).toLocaleDateString('en-KE', { day: 'numeric', month: 'short' })}</span>
                  </div>
                  <p className="text-white font-semibold text-sm leading-tight mb-1">{v.projectName}</p>
                  <p className="text-gray-400 text-xs">Citizen <span className="text-amber-400 font-bold">{v.verifierCodename}</span> · {v.ward} Ward</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

const Home = () => {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    fetch('/api/projects/stats')
      .then(r => r.json())
      .then(setStats)
      .catch(() => {});
  }, []);

  return (
    <div className="min-h-screen">
      <Hero globalStats={stats} />
      <BreakingEvidence />
      <QuickStats stats={stats} />
      <WardSelector />
    </div>
  );
};

export default Home;
