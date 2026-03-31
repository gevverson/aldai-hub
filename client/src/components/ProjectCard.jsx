import { useState, useEffect } from 'react';
import VerifyModal from './VerifyModal';

const ProjectCard = ({ project }) => {
  const [verificationCount, setVerificationCount] = useState(0);
  const [showVerify, setShowVerify] = useState(false);

  useEffect(() => {
    const id = project.id?.toString() || project._id?.toString();
    if (!id) return;
    fetch(`/api/verifications/${id}`)
      .then(r => r.json())
      .then(data => setVerificationCount(Array.isArray(data) ? data.length : 0))
      .catch(() => {});
  }, [project]);

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
      case 'ABANDONED':
        return <span className="badge bg-gray-800 text-white border border-gray-900">💀 ABANDONED</span>;
      case 'MISALLOCATED':
        return <span className="badge bg-orange-500/10 text-orange-600 border border-orange-500/20">⛔ MISALLOCATED</span>;
      default:
        return <span className="badge bg-gray-100 text-gray-800 border border-gray-200">{status}</span>;
    }
  };

  const formatKsh = (num) =>
    new Intl.NumberFormat('en-KE', { style: 'currency', currency: 'KES', maximumFractionDigits: 0 }).format(num);

  return (
    <>
      <div className="card p-5 mb-4 border-l-4 border-l-forest-800 hover:border-l-amber-500 transition-colors">
        <div className="flex flex-col md:flex-row justify-between md:items-start gap-4 mb-4 border-b border-gray-100 pb-4">
          <div className="flex-1">
            <div className="flex flex-wrap items-start gap-2 mb-1">
              <h3 className="text-xl font-bold text-forest-900">{project.name}</h3>
              {verificationCount > 0 && (
                <span className="inline-flex items-center gap-1 bg-blue-50 border border-blue-200 text-blue-700 text-xs font-bold px-2 py-0.5 rounded-full">
                  📸 {verificationCount} citizen {verificationCount === 1 ? 'verification' : 'verifications'}
                </span>
              )}
            </div>
            <p className="text-sm text-gray-500 font-medium">
              <span className="text-forest-700">{project.ward}</span> · {project.fund} Fund · {project.year}
            </p>
          </div>
          <div className="text-left md:text-right shrink-0">
            <p className="text-lg font-bold text-forest-900">{formatKsh(project.allocated)}</p>
            <p className="text-xs text-gray-500 uppercase tracking-widest font-semibold mt-1">Allocated</p>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-4 mb-4">
          <div className="bg-gray-50 p-3 rounded-md border border-gray-200">
            <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Official Claim</p>
            <p className="font-medium text-gray-800">{project.officialStatus}</p>
          </div>
          <div className="bg-amber-50/50 p-3 rounded-md border border-amber-100">
            <p className="text-xs text-amber-800/60 uppercase font-semibold mb-1">Community Reality</p>
            {getStatusBadge(project.communityStatus)}
          </div>
        </div>

        <div className="bg-red-50 p-4 rounded-md border border-red-100">
          <div className="flex items-start gap-3">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-alert-red flex-shrink-0 mt-0.5">
              <path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zM12 8.25a.75.75 0 01.75.75v3.75a.75.75 0 01-1.5 0V9a.75.75 0 01.75-.75zm0 8.25a.75.75 0 100-1.5.75.75 0 000 1.5z" clipRule="evenodd" />
            </svg>
            <div>
              <p className="text-sm font-semibold text-alert-red uppercase tracking-wider mb-1">Audit Finding</p>
              <p className="text-gray-800 text-sm leading-relaxed">{project.auditNote}</p>
            </div>
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between">
          <p className="text-xs text-gray-400">
            {verificationCount > 0
              ? `📸 ${verificationCount} citizen${verificationCount > 1 ? 's have' : ' has'} verified this site`
              : '📸 No citizen verifications yet — be first'}
          </p>
          <button
            onClick={() => setShowVerify(true)}
            className="bg-forest-900 hover:bg-amber-500 text-white text-xs font-black px-4 py-2 rounded-lg transition-all flex items-center gap-1.5"
          >
            <span>📍</span> Verify This Site
          </button>
        </div>
      </div>

      {showVerify && (
        <VerifyModal
          project={project}
          onClose={() => setShowVerify(false)}
          onSuccess={(v) => {
            setVerificationCount(prev => prev + 1);
            setShowVerify(false);
          }}
        />
      )}
    </>
  );
};

export default ProjectCard;
