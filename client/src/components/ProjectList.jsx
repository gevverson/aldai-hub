import { useState } from 'react';
import ProjectCard from './ProjectCard';
import { isCritical, isComplete, isConcern } from '../lib/status';

const ProjectList = ({ projects }) => {
  const [filter, setFilter] = useState('ALL');

  if (!projects || projects.length === 0) {
    return (
      <div className="text-center py-12 rounded-2xl" style={{ background: '#111827', border: '1px solid #1F2937' }}>
        <p className="font-medium" style={{ color: '#6B7280' }}>No projects found for the selected criteria.</p>
      </div>
    );
  }

  const matches = {
    ALL:      () => true,
    CRITICAL: (p) => isCritical(p.communityStatus),
    CONCERN:  (p) => isConcern(p.communityStatus),
    VERIFIED: (p) => isComplete(p.communityStatus),
  };
  const count = (key) => projects.filter(matches[key]).length;
  const filteredProjects = projects.filter(matches[filter] || matches.ALL);

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
          Critical / Stalled ({count('CRITICAL')})
        </button>
        <button
          onClick={() => setFilter('CONCERN')}
          className="px-4 py-2 rounded-full text-sm font-medium transition-all"
          style={filter === 'CONCERN' ? { background: '#D97706', color: '#0A0A0A', border: '1px solid #D97706' } : { background: 'transparent', color: '#FCD34D', border: '1px solid rgba(217,119,6,0.3)' }}
        >
          Disputed / Incomplete ({count('CONCERN')})
        </button>
        <button
          onClick={() => setFilter('VERIFIED')}
          className="px-4 py-2 rounded-full text-sm font-medium transition-all"
          style={filter === 'VERIFIED' ? { background: '#16A34A', color: '#fff', border: '1px solid #16A34A' } : { background: 'transparent', color: '#4ADE80', border: '1px solid rgba(22,163,74,0.3)' }}
        >
          Complete ({count('VERIFIED')})
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
