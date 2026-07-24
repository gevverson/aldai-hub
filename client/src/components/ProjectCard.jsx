import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import VerifyModal from './VerifyModal';
import { toneOf, statusTone } from '../lib/status';

const ProjectCard = ({ project }) => {
  const [verificationCount, setVerificationCount] = useState(0);
  const [showVerify, setShowVerify] = useState(false);

  useEffect(() => {
    const id = project.id?.toString() || project._id?.toString();
    if (!id) return;
    fetch(`/api/verifications/${id}`)
      .then(r => r.json())
      .then(data => setVerificationCount(data.total || 0))
      .catch(() => {});
  }, [project]);

  const getStatusBadge = (status) => {
    switch(status) {
      case 'VERIFIED COMPLETE':
        return <span className="badge bg-alert-green/10 text-alert-green border border-alert-green/20">✅ VERIFIED COMPLETE</span>;
      case 'COMPLETE':
        return <span className="badge bg-alert-green/10 text-alert-green border border-alert-green/20">✅ COMPLETE</span>;
      case 'DISPUTED':
        return <span className="badge bg-amber-500/10 text-amber-600 border border-amber-500/20">⚠️ DISPUTED</span>;
      case 'INCOMPLETE':
        return <span className="badge bg-amber-500/10 text-amber-600 border border-amber-500/20">🚧 INCOMPLETE</span>;
      case 'GHOST PROJECT':
        return <span className="badge bg-alert-red text-white border border-red-700 animate-pulse">🚨 GHOST PROJECT</span>;
      case 'STALLED':
        return <span className="badge bg-alert-red/10 text-alert-red border border-alert-red/20">🔴 STALLED</span>;
      case 'ABANDONED':
        return <span className="badge bg-gray-800 text-white border border-gray-900">💀 ABANDONED</span>;
      case 'MISALLOCATED':
        return <span className="badge bg-orange-500/10 text-orange-600 border border-orange-500/20">⛔ MISALLOCATED</span>;
      case 'IRREGULAR':
        return <span className="badge bg-red-500/10 text-red-400 border border-red-500/20">🚩 IRREGULAR</span>;
      default:
        // e.g. "REPORTED — SEE NOTE" — neutral, no false alarm.
        return <span className="badge bg-gray-700/20 text-gray-300 border border-gray-600/30">{status}</span>;
    }
  };

  const tone = toneOf(project.communityStatus);

  const formatKsh = (num) =>
    new Intl.NumberFormat('en-KE', { style: 'currency', currency: 'KES', maximumFractionDigits: 0 }).format(num);

  return (
    <>
      <div
        className="rounded-2xl mb-4 overflow-hidden transition-all duration-300 border border-[#1F2937] hover:border-amber-500/50 hover:-translate-y-[2px] hover:shadow-[0_12px_40px_rgba(0,0,0,0.5)]"
        style={{ background: '#111827' }}
      >
        {/* Top accent strip — colour tracks severity, green when complete */}
        <div className="h-1 w-full" style={{ background: tone.accent }} />

        <div className="p-5">
          <div className="flex flex-col md:flex-row justify-between md:items-start gap-4 mb-4 pb-4" style={{ borderBottom: '1px solid #1F2937' }}>
            <div className="flex-1">
              <div className="flex flex-wrap items-start gap-2 mb-1">
                <h3 className="text-xl font-bold text-white">{project.name}</h3>
                {verificationCount > 0 && (
                  <span
                    className="inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full"
                    style={{ background: 'rgba(14,165,233,0.12)', color: '#7DD3FC', border: '1px solid rgba(14,165,233,0.25)' }}
                  >
                    📸 {verificationCount} citizen {verificationCount === 1 ? 'verification' : 'verifications'}
                  </span>
                )}
              </div>
              <p className="text-sm font-medium" style={{ color: '#6B7280' }}>
                {/* OAG audits at constituency level; ward is only shown when a
                    source actually states it. Fall back so the line never
                    renders an empty or "null" location. */}
                <span style={{ color: '#D97706' }}>
                  {project.ward || project.constituency || project.county || 'Location not stated'}
                </span> · {project.fund} Fund · {project.year}
              </p>
            </div>
            <div className="text-left md:text-right shrink-0">
              <p className="text-lg font-bold font-mono-jet" style={{ color: '#D97706' }}>{formatKsh(project.allocated)}</p>
              <p className="text-xs uppercase tracking-widest font-semibold mt-1" style={{ color: '#4B5563' }}>Allocated</p>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-3 mb-4">
            <div className="p-3 rounded-xl" style={{ background: '#0A0A0A', border: '1px solid #1F2937' }}>
              <p className="text-xs uppercase font-semibold mb-1" style={{ color: '#4B5563' }}>Official Claim</p>
              <p className="font-medium text-white text-sm">{project.officialStatus}</p>
            </div>
            <div className="p-3 rounded-xl" style={{ background: 'rgba(217,119,6,0.06)', border: '1px solid rgba(217,119,6,0.2)' }}>
              <p className="text-xs uppercase font-semibold mb-1" style={{ color: '#92400E' }}>Community Reality</p>
              {getStatusBadge(project.communityStatus)}
            </div>
          </div>

          <div className="p-4 rounded-xl" style={{ background: tone.bg, border: `1px solid ${tone.border}` }}>
            <div className="flex items-start gap-3">
              {statusTone(project.communityStatus) === 'complete' ? (
                // Calm check for a project the auditor found complete.
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: tone.icon }}>
                  <path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm13.36-1.814a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: tone.icon }}>
                  <path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zM12 8.25a.75.75 0 01.75.75v3.75a.75.75 0 01-1.5 0V9a.75.75 0 01.75-.75zm0 8.25a.75.75 0 100-1.5.75.75 0 000 1.5z" clipRule="evenodd" />
                </svg>
              )}
              <div>
                <p className="text-sm font-semibold uppercase tracking-wider mb-1" style={{ color: tone.label }}>{tone.title}</p>
                <p className="text-sm leading-relaxed" style={{ color: '#D1D5DB' }}>{project.auditNote}</p>
                {project.source && (
                  <p className="text-xs mt-2" style={{ color: '#6B7280' }}>
                    <span aria-hidden>📄</span> Source: {project.source} ·{' '}
                    <Link to="/methodology" className="underline underline-offset-2 hover:text-amber-400" style={{ color: '#9CA3AF' }}>
                      view sources
                    </Link>
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 flex items-center justify-between" style={{ borderTop: '1px solid #1F2937' }}>
            <p className="text-xs" style={{ color: '#4B5563' }}>
              {verificationCount > 0
                ? `📸 ${verificationCount} citizen${verificationCount > 1 ? 's have' : ' has'} verified this site`
                : '📸 No citizen verifications yet — be first'}
            </p>
            <button
              onClick={() => setShowVerify(true)}
              className="text-xs font-black px-4 py-2 rounded-lg transition-all flex items-center gap-1.5"
              style={{ background: '#1B4332', color: '#fff' }}
              onMouseEnter={(e) => { e.currentTarget.style.background = '#D97706'; e.currentTarget.style.color = '#0A0A0A'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = '#1B4332'; e.currentTarget.style.color = '#fff'; }}
            >
              <span>📍</span> Verify This Site
            </button>
          </div>
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
