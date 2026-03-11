import { useState } from 'react';
import ProjectCard from './ProjectCard';

const ProjectList = ({ projects }) => {
  const [filter, setFilter] = useState('ALL');

  if (!projects || projects.length === 0) {
    return (
      <div className="text-center py-12 bg-white rounded-xl shadow-sm border border-gray-100">
        <p className="text-gray-500 font-medium">No projects found for the selected criteria.</p>
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
          className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${filter === 'ALL' ? 'bg-forest-800 text-white' : 'bg-white text-forest-800 border border-forest-200 hover:bg-forest-50'}`}
        >
          All Projects ({projects.length})
        </button>
        <button 
          onClick={() => setFilter('CRITICAL')}
          className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${filter === 'CRITICAL' ? 'bg-alert-red text-white' : 'bg-white text-alert-red border border-red-200 hover:bg-red-50'}`}
        >
          Critical / Stalled ({projects.filter(p => ['GHOST PROJECT', 'STALLED', 'ABANDONED', 'MISALLOCATED'].includes(p.communityStatus)).length})
        </button>
        <button 
          onClick={() => setFilter('DISPUTED')}
          className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${filter === 'DISPUTED' ? 'bg-amber-500 text-white' : 'bg-white text-amber-600 border border-amber-200 hover:bg-amber-50'}`}
        >
          Disputed ({projects.filter(p => p.communityStatus === 'DISPUTED').length})
        </button>
        <button 
          onClick={() => setFilter('VERIFIED')}
          className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${filter === 'VERIFIED' ? 'bg-alert-green text-white' : 'bg-white text-alert-green border border-green-200 hover:bg-green-50'}`}
        >
          Verified Complete ({projects.filter(p => p.communityStatus === 'VERIFIED COMPLETE').length})
        </button>
      </div>

      {/* Projects List */}
      <div className="space-y-6">
        {filteredProjects.length > 0 ? (
          filteredProjects.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))
        ) : (
          <div className="text-center py-10 bg-gray-50 rounded-lg border border-dashed border-gray-300">
            <p className="text-gray-500">No projects match the selected filter.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProjectList;
