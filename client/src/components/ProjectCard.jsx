const ProjectCard = ({ project }) => {
  const getStatusBadge = (status) => {
    switch(status) {
      case 'VERIFIED COMPLETE':
        return <span className="badge bg-alert-green/10 text-alert-green border border-alert-green/20">✅ VERIFIED COMPLETE</span>;
      case 'DISPUTED':
        return <span className="badge bg-amber-500/10 text-amber-600 border border-amber-500/20">⚠️ DISPUTED</span>;
      case 'GHOST PROJECT':
        return <span className="badge bg-alert-red text-white border border-red-700 animate-pulse">🚨 GHOST PROJECT</span>;
      case 'STALLED':
        return <span className="badge bg-alert-red/10 text-alert-red border border-alert-red/20">🔴 STALLED</span>;
      case 'UNDER INVESTIGATION':
        return <span className="badge bg-alert-purple/10 text-alert-purple border border-alert-purple/20">🔍 UNDER INVESTIGATION</span>;
      case 'MISALLOCATED':
        return <span className="badge bg-orange-500/10 text-orange-600 border border-orange-500/20">⛔ MISALLOCATED</span>;
      case 'ABANDONED':
        return <span className="badge bg-gray-800 text-white border border-gray-900">💀 ABANDONED</span>;
      default:
        return <span className="badge bg-gray-100 text-gray-800 border border-gray-200">{status}</span>;
    }
  };

  const formatKsh = (num) => {
    return new Intl.NumberFormat('en-KE', { style: 'currency', currency: 'KES', maximumFractionDigits: 0 }).format(num);
  };

  return (
    <div className="card p-5 mb-4 border-l-4 border-l-forest-800">
      <div className="flex flex-col md:flex-row justify-between md:items-start gap-4 mb-4 border-b border-gray-100 pb-4">
        <div>
          <h3 className="text-xl font-bold text-forest-900 mb-1">{project.name}</h3>
          <p className="text-sm text-gray-500 font-medium">
            <span className="text-forest-700">{project.ward}</span> • {project.fund} Fund • {project.year}
          </p>
        </div>
        <div className="text-left md:text-right">
          <p className="text-lg font-bold text-forest-900">{formatKsh(project.allocated)}</p>
          <p className="text-xs text-gray-500 uppercase tracking-widest font-semibold mt-1">Allocated Amount</p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4 mb-4">
        <div className="bg-gray-50 p-3 rounded-md border border-gray-200">
          <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Official Claim</p>
          <p className="font-medium text-gray-800">{project.officialStatus}</p>
        </div>
        <div className="bg-amber-50/50 p-3 rounded-md border border-amber-100 flex flex-col items-start">
          <p className="text-xs text-amber-800/60 uppercase font-semibold mb-1">Community Reality</p>
          {getStatusBadge(project.communityStatus)}
        </div>
      </div>

      <div className="bg-red-50 p-4 rounded-md border border-red-100 mt-2">
        <div className="flex items-start gap-3">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-alert-red flex-shrink-0 mt-0.5">
            <path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zM12 8.25a.75.75 0 01.75.75v3.75a.75.75 0 01-1.5 0V9a.75.75 0 01.75-.75zm0 8.25a.75.75 0 100-1.5.75.75 0 000 1.5z" clipRule="evenodd" />
          </svg>
          <div>
            <p className="text-sm font-semibold text-alert-red uppercase tracking-wider mb-1">Audit / Verification Note</p>
            <p className="text-gray-800 text-sm leading-relaxed">{project.auditNote}</p>
          </div>
        </div>
      </div>
      
      <div className="mt-4 pt-4 border-t border-gray-100 flex justify-end">
        <button className="text-sm font-semibold text-forest-700 hover:text-forest-900 transition-colors flex items-center">
          Upload Evidence
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 ml-1">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
          </svg>
        </button>
      </div>
    </div>
  );
};

export default ProjectCard;
