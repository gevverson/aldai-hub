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
      <div className="bg-forest-900 text-white py-12 mb-8 border-b-4 border-amber-500">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <Link to="/" className="inline-flex items-center text-forest-200 hover:text-white mb-6 transition-colors text-sm font-medium">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 mr-1">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
            </svg>
            Back to Overview
          </Link>
          <h1 className="text-4xl md:text-5xl font-display font-bold mb-4">{displayName} Ward Ledger</h1>
          <p className="text-xl text-forest-200">
            Official allocations vs. Community reality. Uncovering the truth project by project.
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Ward Overview specific to WardPage - in real app, these numbers would be dynamic */}
        {data.ward.budgetAllocated && (
           <div className="card p-6 mb-8 bg-forest-50/50 border-forest-200">
            <h2 className="text-lg font-bold text-forest-900 mb-4 font-display uppercase tracking-widest text-xs">Ward Fiscal Summary</h2>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
               <div>
                  <p className="text-xs text-gray-500 uppercase tracking-widest font-semibold mb-1">Total Allocation</p>
                  <p className="font-bold text-forest-900 text-lg">Ksh {(data.ward.budgetAllocated/1000000).toFixed(1)}M</p>
               </div>
               <div>
                  <p className="text-xs text-gray-500 uppercase tracking-widest font-semibold mb-1">Funds Spent</p>
                  <p className="font-bold text-amber-600 text-lg">{data.ward.completionRate ?? '—'}%</p>
               </div>
               <div>
                  <p className="text-xs text-alert-red uppercase tracking-widest font-semibold mb-1">Stalled Issues</p>
                  <p className="font-bold text-alert-red text-lg">{data.ward.stalledCount} Found</p>
               </div>
               <div>
                  <p className="text-xs text-gray-500 uppercase tracking-widest font-semibold mb-1">Investigate</p>
                  <Link to="/report" className="text-amber-500 hover:text-amber-600 text-sm font-bold flex items-center mt-1">
                    Report Issue
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 ml-1">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                    </svg>
                  </Link>
               </div>
            </div>
           </div>
        )}

        {/* Project List */}
        <div className="mb-6 flex justify-between items-end">
          <h2 className="text-2xl font-display font-bold text-forest-900">Tracked Projects</h2>
        </div>
        
        <ProjectList projects={data.projects} />
      </div>
    </div>
  );
};

export default WardPage;
