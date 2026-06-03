import { useState } from 'react';
import ProjectCard from './ProjectCard';

const ProjectList = ({ projects }) => {
  const [filter, setFilter] = useState('ALL');

  if (!projects || projects.length === 0) {
    return (
      <div className="text-center py-12 rounded-2xl" style={{ background: '#111827', border: '1px solid #1F2937' }}>
        <p className="font-medium" style={{ color: '#6B7280' }}>No projects found for the selected criteria.</p>
      </div>
    );
  }

  const filteredProjects = projects.filter(p => {
    if (filter === 'ALL') return true;
    if (filter === 'CRITICAL') return ['GHOST PROJECT', 'STALLED', 'ABANDONED', 'MISALLOCATED'].includes(p.communityStatus);
    if (filter === 'DISPUTED') return p.communityStatus === 'DISPUTED';
    if (filter === 'VERIFIED') return p.communityStatus === 'VERIFIED COMPLETE';
    return true;
  });

  return (
    <div>
      {/* Filter Bar */}
      <div className="flex flex-wrap gap-2 mb-6">
        <button
          onClick={() => setFilter('ALL')}
          className="px-4 py-2 rounded-full text-sm font-medium transition-all"
          style={filter === 'ALL' ? { background: '#1B4332', color: '#fff', border: '1px solid #1B4332' } : { background: 'transparent', color: '#9CA3AF', border: '1px solid #1F2937' }}
        >
          All Projects ({projects.length})
        </button>
        <button
          onClick={() => setFilter('CRITICAL')}
          className="px-4 py-2 rounded-full text-sm font-medium transition-all"
          style={filter === 'CRITICAL' ? { background: '#DC2626', color: '#fff', border: '1px solid #DC2626' } : { background: 'transparent', color: '#F87171', border: '1px solid rgba(220,38,38,0.3)' }}
        >
          Critical / Stalled ({projects.filter(p => ['GHOST PROJECT', 'STALLED', 'ABANDONED', 'MISALLOCATED'].includes(p.communityStatus)).length})
        </button>
        <button
          onClick={() => setFilter('DISPUTED')}
          className="px-4 py-2 rounded-full text-sm font-medium transition-all"
          style={filter === 'DISPUTED' ? { background: '#D97706', color: '#0A0A0A', border: '1px solid #D97706' } : { background: 'transparent', color: '#FCD34D', border: '1px solid rgba(217,119,6,0.3)' }}
        >
          Disputed ({projects.filter(p => p.communityStatus === 'DISPUTED').length})
        </button>
        <button
          onClick={() => setFilter('VERIFIED')}
          className="px-4 py-2 rounded-full text-sm font-medium transition-all"
          style={filter === 'VERIFIED' ? { background: '#16A34A', color: '#fff', border: '1px solid #16A34A' } : { background: 'transparent', color: '#4ADE80', border: '1px solid rgba(22,163,74,0.3)' }}
        >
          Verified Complete ({projects.filter(p => p.communityStatus === 'VERIFIED COMPLETE').length})
        </button>
      </div>

      {/* Projects List */}
      <div className="space-y-6">
        {filteredProjects.length > 0 ? (
          filteredProjects.map((project) => (
            <ProjectCard key={project._id} project={project} />
          ))
        ) : (
          <div className="text-center py-10 rounded-2xl" style={{ background: '#111827', border: '1px dashed #374151' }}>
            <p style={{ color: '#6B7280' }}>No projects match the selected filter.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProjectList;
