import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

const WardSelector = () => {
  const [wards, setWards] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchWards = async () => {
      try {
        const response = await fetch('/api/projects/wards');
        const data = await response.json();
        setWards(data);
      } catch (error) {
        console.error("Error fetching wards:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchWards();
  }, []);

  const getHealthScoreColor = (score) => {
    switch(score) {
      case 'red': return 'bg-alert-red text-white';
      case 'amber': return 'bg-amber-500 text-white';
      case 'green': return 'bg-alert-green text-white';
      default: return 'bg-gray-300 text-gray-800';
    }
  };

  const getHealthLabel = (score) => {
    switch(score) {
      case 'red': return 'Critical / Severe Issues';
      case 'amber': return 'Moderate Concerns';
      case 'green': return 'Ongoing (Monitoring)';
      default: return 'Unknown';
    }
  };

  // Format amount safely for Ksh
  const formatKsh = (amount) => {
    return `Ksh ${(amount / 1000000).toFixed(1)}M`;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-forest-800"></div>
      </div>
    );
  }

  return (
    <section id="wards" className="py-16 bg-forest-50 border-t border-forest-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-display font-bold text-forest-900 mb-4">
            Investigate Your Ward
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Select your ward in Aldai Constituency to see how your public funds are being spent, 
            which projects are real, and which are phantoms.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {wards.map((ward) => (
            <Link 
              to={`/ward/${encodeURIComponent(ward.name.toLowerCase())}`} 
              key={ward.name}
              className="group"
            >
              <div className="card h-full transition-all duration-300 group-hover:-translate-y-1 group-hover:shadow-lg border-2 border-transparent group-hover:border-forest-200">
                <div className={`h-2 w-full ${getHealthScoreColor(ward.healthScore)}`}></div>
                <div className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="text-xl font-bold font-display text-forest-900 group-hover:text-forest-700 transition-colors">
                      {ward.name}
                    </h3>
                    <span title={getHealthLabel(ward.healthScore)} className={`inline-flex h-3 w-3 rounded-full ${getHealthScoreColor(ward.healthScore)}`}></span>
                  </div>

                  <div className="space-y-3 mb-6">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500 font-medium tracking-wide text-xs uppercase">Allocated Budget</span>
                      <span className="font-bold text-forest-900">{formatKsh(ward.budgetAllocated)}</span>
                    </div>
                    
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-500 font-medium tracking-wide text-xs uppercase">Funds Expended</span>
                        <span className="font-bold text-forest-900">{ward.percentSpent}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                        <div 
                          className={`h-2 rounded-full ${
                            ward.percentSpent > 80 ? 'bg-alert-red' : 
                            ward.percentSpent > 50 ? 'bg-amber-500' : 'bg-forest-500'
                          }`} 
                          style={{ width: `${ward.percentSpent}%` }}
                        ></div>
                      </div>
                    </div>

                    <div className="flex justify-between text-sm pt-2 border-t border-gray-100">
                      <span className="text-alert-red font-semibold">Flagged / Stalled Projects</span>
                      <span className="font-bold text-alert-red bg-red-100 px-2 py-0.5 rounded text-xs">{ward.stalledCount} found</span>
                    </div>
                  </div>

                  <div className="text-amber-600 font-semibold text-sm flex items-center group-hover:text-amber-500 transition-colors">
                    View Project Ledger 
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 ml-1 transition-transform group-hover:translate-x-1">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                    </svg>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};

export default WardSelector;
