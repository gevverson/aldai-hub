import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import ProjectList from '../components/ProjectList';

const WardPage = () => {
  const { wardName } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchWardData = async () => {
      setLoading(true);
      try {
        const response = await fetch(`/api/projects/ward/${wardName}`);
        if (!response.ok) throw new Error('Ward not found');
        
        const json = await response.json();
        setData(json.data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchWardData();
  }, [wardName]);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col justify-center items-center" style={{ background: '#0A0A0A' }}>
        <div
          className="w-12 h-12 rounded-full border-4 border-t-transparent animate-spin mb-4"
          style={{ borderColor: '#D97706', borderTopColor: 'transparent' }}
        />
        <p style={{ color: '#6B7280', fontFamily: "'DM Sans', sans-serif", fontSize: '14px' }}>
          Loading {wardName} ledger...
        </p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div
        className="min-h-[80vh] flex flex-col justify-center items-center text-center px-4"
        style={{ background: '#0A0A0A' }}
      >
        <div
          className="rounded-2xl p-10 max-w-md w-full"
          style={{ background: '#111827', border: '1px solid #1F2937' }}
        >
          <div className="text-5xl mb-4">📂</div>
          <h2 className="font-display text-white mb-2" style={{ fontSize: '24px' }}>
            Ward Data Not Found
          </h2>
          <p style={{ color: '#D97706', fontSize: '12px', fontFamily: "'DM Sans', sans-serif", fontStyle: 'italic', marginBottom: '8px' }}>
            Data ya Wadi Haikupatikana
          </p>
          <p style={{ color: '#6B7280', fontSize: '14px', fontFamily: "'DM Sans', sans-serif", lineHeight: 1.7, marginBottom: '24px' }}>
            The {wardName} ward ledger is not yet in our database. Project data is being compiled
            from official audit records. Check back soon.
          </p>
          <div className="flex flex-col gap-3">
            <a
              href="/report"
              className="block w-full py-3 rounded-xl font-bold text-center transition-all"
              style={{ background: '#DC2626', color: '#fff', fontSize: '14px', fontFamily: "'DM Sans', sans-serif" }}
            >
              🚨 Report an Issue in This Ward
            </a>
            <a
              href="/"
              className="block w-full py-3 rounded-xl font-bold text-center transition-all"
              style={{ background: '#1F2937', color: '#F9FAFB', fontSize: '14px', fontFamily: "'DM Sans', sans-serif" }}
            >
              ← Back to All Wards
            </a>
          </div>
        </div>
      </div>
    );
  }

  // Capitalize properly
  const displayName = data.ward.name || wardName.charAt(0).toUpperCase() + wardName.slice(1);

  return (
    <div className="pb-20">
      {/* Ward Header */}
      <div className="py-12 mb-8" style={{ background: '#0D1117', borderBottom: '3px solid #D97706' }}>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <Link
            to="/"
            className="inline-flex items-center mb-6 transition-colors text-sm font-medium"
            style={{ color: '#6B7280' }}
            onMouseEnter={(e) => { e.currentTarget.style.color = '#D97706'; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = '#6B7280'; }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 mr-1">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
            </svg>
            Back to Overview
          </Link>
          <h1 className="font-display text-white mb-4" style={{ fontSize: 'clamp(28px, 6vw, 48px)' }}>{displayName} Ward Ledger</h1>
          <p style={{ color: '#9CA3AF', fontSize: '16px', fontFamily: "'DM Sans', sans-serif" }}>
            Official allocations vs. Community reality. Uncovering the truth project by project.
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {data.ward.budgetAllocated && (
          <div className="rounded-2xl p-6 mb-8" style={{ background: '#111827', border: '1px solid #1F2937' }}>
            <h2 className="font-bold uppercase tracking-widest mb-4" style={{ color: '#6B7280', fontSize: '11px', fontFamily: "'DM Sans', sans-serif" }}>Ward Fiscal Summary</h2>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <p className="text-xs uppercase tracking-widest font-semibold mb-1" style={{ color: '#4B5563' }}>Total Allocation</p>
                <p className="font-bold text-lg font-mono-jet" style={{ color: '#D97706' }}>Ksh {(data.ward.budgetAllocated/1000000).toFixed(1)}M</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-widest font-semibold mb-1" style={{ color: '#4B5563' }}>Completion</p>
                <p className="font-bold text-lg font-mono-jet" style={{ color: '#F59E0B' }}>{data.ward.completionRate ?? '—'}%</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-widest font-semibold mb-1" style={{ color: '#DC2626' }}>Stalled Issues</p>
                <p className="font-bold text-lg font-mono-jet" style={{ color: '#F87171' }}>{data.ward.stalledCount ?? 0} Found</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-widest font-semibold mb-1" style={{ color: '#4B5563' }}>Investigate</p>
                <Link to="/report" className="flex items-center mt-1 text-sm font-bold transition-colors" style={{ color: '#D97706' }}>
                  Report Issue
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 ml-1">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                  </svg>
                </Link>
              </div>
            </div>
          </div>
        )}

        <div className="mb-6 flex justify-between items-end">
          <h2 className="text-2xl font-display font-bold text-white">Tracked Projects</h2>
        </div>
        
        <ProjectList projects={data.projects} />
      </div>
    </div>
  );
};

export default WardPage;
