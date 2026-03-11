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
        setData(json);
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
      <div className="min-h-[60vh] flex flex-col justify-center items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-forest-800 mb-4"></div>
        <p className="text-forest-700 font-medium">Investigating ledger for {wardName}...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-[60vh] flex flex-col justify-center items-center text-center px-4">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-16 h-16 text-alert-red mb-4">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
        <h2 className="text-2xl font-bold text-forest-900 mb-2">Ward Data Not Found</h2>
        <p className="text-gray-600 mb-6">We could not load the ledger for {wardName}.</p>
        <Link to="/" className="btn-primary">Return Home</Link>
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
                  <p className="font-bold text-amber-600 text-lg">{data.ward.percentSpent}%</p>
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
