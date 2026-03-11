import AnimatedCounter from './AnimatedCounter';

const QuickStats = ({ stats }) => {
  return (
    <section className="bg-white py-12 border-b border-forest-100 shadow-sm relative z-10 -mt-2">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="text-left mb-8 border-l-4 border-alert-red pl-4">
          <h2 className="text-2xl md:text-3xl font-display font-bold text-forest-900">
            Nandi County: The Auditor-General's Findings
          </h2>
          <p className="text-gray-600 mt-2">
            Based on official OAG Audit Reports 2021-2024. These are established facts, not accusations.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          
          {/* Stat 1 */}
          <div className="card p-6 border-t-4 border-t-alert-red bg-red-50/30">
            <div className="flex items-start">
              <div className="bg-red-100 p-3 rounded-lg text-alert-red mr-4">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className="text-2xl font-bold text-forest-900 leading-tight">
                  <AnimatedCounter targetValue={3.3} prefix="Ksh " suffix="B" />
                </p>
                <p className="text-sm font-semibold text-alert-red mb-1">Payroll Fraud</p>
                <p className="text-xs text-gray-600">Lost to manual payroll inflation in FY 2023/2024.</p>
              </div>
            </div>
          </div>

          {/* Stat 2 */}
          <div className="card p-6 border-t-4 border-t-alert-orange bg-orange-50/30">
            <div className="flex items-start">
              <div className="bg-orange-100 p-3 rounded-lg text-alert-orange mr-4">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                </svg>
              </div>
              <div>
                <p className="text-2xl font-bold text-forest-900 leading-tight">
                  <AnimatedCounter targetValue={1885} duration={2500} />
                </p>
                <p className="text-sm font-semibold text-alert-orange mb-1">Ghost Employees</p>
                <p className="text-xs text-gray-600">Unaccounted personnel drawing salaries monthly.</p>
              </div>
            </div>
          </div>

          {/* Stat 3 */}
          <div className="card p-6 border-t-4 border-t-forest-700 bg-forest-50/30">
            <div className="flex items-start">
              <div className="bg-forest-100 p-3 rounded-lg text-forest-700 mr-4">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 21v-8.25M15.75 21v-8.25M8.25 21v-8.25M3 9l9-6 9 6m-1.5 12V10.332A48.36 48.36 0 0012 9.75c-2.551 0-5.056.2-7.5.582V21M3 21h18M12 6.75h.008v.008H12V6.75z" />
                </svg>
              </div>
              <div>
                <p className="text-2xl font-bold text-forest-900 leading-tight">
                  <AnimatedCounter targetValue={1.2} prefix="Ksh " suffix="B" />
                </p>
                <p className="text-sm font-semibold text-forest-700 mb-1">Stalled Infrastructure</p>
                <p className="text-xs text-gray-600">Funds sunk into non-operational county projects.</p>
              </div>
            </div>
          </div>

          {/* Stat 4 */}
          <div className="card p-6 border-t-4 border-t-amber-500 bg-amber-50/30">
            <div className="flex items-start">
              <div className="bg-amber-100 p-3 rounded-lg text-amber-600 mr-4">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div>
                <p className="text-2xl font-bold text-forest-900 leading-tight">
                  <AnimatedCounter targetValue={144} duration={2000} />
                </p>
                <p className="text-sm font-semibold text-amber-600 mb-1">Facilities Shut Down</p>
                <p className="text-xs text-gray-600">Public health centers closed or lacking basic medicine.</p>
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
};

export default QuickStats;
