import React, { memo } from 'react';
import { Project } from '../lib/api';
import { ProjectCard } from './ProjectCard';

interface KanbanColumnProps {
  title: string;
  status: 'backlog' | 'in_progress' | 'done' | 'archived';
  projects: Project[];
  onDragStart: (e: React.DragEvent, project: Project) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent, status: 'backlog' | 'in_progress' | 'done' | 'archived') => void;
  onEdit: (project: Project) => void;
  onDelete: (id: string) => void;
  onViewDetails?: (project: Project) => void;
  onAdd: () => void;
  onMoveProject?: (project: Project, newStatus: 'backlog' | 'in_progress' | 'done' | 'archived') => void;
  isMobile?: boolean;
}

const columnConfig: Record<string, { 
  icon: string;
  bgClass: string;
  borderClass: string;
  glowClass: string;
}> = {
  backlog: { 
    icon: '📥',
    bgClass: 'from-gray-700 to-gray-600',
    borderClass: 'border-gray-600',
    glowClass: 'shadow-gray-900/50',
  },
  in_progress: { 
    icon: '⚡',
    bgClass: 'from-red-800 to-red-900',
    borderClass: 'border-red-800',
    glowClass: 'shadow-red-900/50',
  },
  done: { 
    icon: '✓',
    bgClass: 'from-emerald-600 to-emerald-700',
    borderClass: 'border-emerald-600',
    glowClass: 'shadow-emerald-900/50',
  },
  archived: { 
    icon: '📦',
    bgClass: 'from-gray-600 to-gray-700',
    borderClass: 'border-gray-600',
    glowClass: 'shadow-gray-900/30',
  },
};

const priorityOrder: Record<string, number> = {
  high: 3,
  medium: 2,
  low: 1,
};

const sortByPriority = (projects: Project[]): Project[] => {
  return [...projects].sort((a, b) => priorityOrder[b.priority] - priorityOrder[a.priority]);
};

// Mobile move options based on current status
const getMoveOptions = (currentStatus: string): { label: string; status: 'backlog' | 'in_progress' | 'done' | 'archived' }[] => {
  const options: { label: string; status: 'backlog' | 'in_progress' | 'done' | 'archived' }[] = [];
  
  if (currentStatus !== 'backlog') {
    options.push({ label: '← Backlog', status: 'backlog' });
  }
  if (currentStatus !== 'in_progress') {
    options.push({ label: '⚡ In Progress', status: 'in_progress' });
  }
  if (currentStatus !== 'done') {
    options.push({ label: '✓ Done', status: 'done' });
  }
  if (currentStatus !== 'archived') {
    options.push({ label: '📦 Archive', status: 'archived' });
  }
  
  return options;
};

export const KanbanColumn: React.FC<KanbanColumnProps> = memo(({
  title,
  status,
  projects,
  onDragStart,
  onDragOver,
  onDrop,
  onEdit,
  onDelete,
  onViewDetails,
  onAdd,
  onMoveProject,
  isMobile = false,
}) => {
  const sortedProjects = sortByPriority(projects);
  const config = columnConfig[status];

  return (
    <div
      className={`
        flex-1 flex flex-col rounded-2xl p-4 md:p-5
        bg-gradient-to-b from-slate-800/80 to-slate-900/60
        border border-t-[3px] border-white/5 ${config.borderClass}
        shadow-lg ${config.glowClass}
        transition-all duration-300
        hover:border-opacity-30 hover:shadow-xl
        snap-start
        ${isMobile ? 'w-full mb-0' : 'min-w-[280px] md:min-w-[300px] max-w-[420px]'}
      `}
      onDragOver={onDragOver}
      onDrop={(e) => onDrop(e, status)}
    >
      {/* Column Header */}
      <div className="flex justify-between items-center mb-3.5 md:mb-4 pb-3 md:pb-3.5 border-b border-white/5">
        <div className="flex items-center gap-2 md:gap-3">
          {/* Icon */}
          <div
            className={`
              w-8 h-8 md:w-9 md:h-9 rounded-lg flex items-center justify-center text-sm md:text-base
              bg-gradient-to-br ${config.bgClass}
              shadow-lg border border-white/10
            `}
          >
            {config.icon}
          </div>
          
          <h3 className="text-sm md:text-base font-semibold text-slate-100 tracking-tight">{title}</h3>
          
          <div
            className={`
              px-2.5 py-1 rounded-full text-xs font-bold text-white
              bg-gradient-to-br ${config.bgClass}
              shadow-lg border border-white/10 min-w-[28px] text-center
            `}
          >
            {sortedProjects.length}
          </div>
        </div>
        
        {/* Add Button */}
        <button
          onClick={onAdd}
          title="Add new project"
          className="
            w-9 h-9 md:w-8 md:h-8 rounded-lg
            flex items-center justify-center
            border border-red-700/40 bg-red-700/10 text-red-700
            text-lg md:text-xl font-bold
            transition-all duration-300
            hover:bg-gradient-to-br hover:from-red-700 hover:to-red-800 hover:text-white hover:scale-110 hover:rotate-90
            active:scale-95
          "
        >
          +
        </button>
      </div>

      {/* Projects List */}
      <div className="flex-1 min-h-[120px] md:min-h-[150px] flex flex-col gap-2.5 md:gap-3 overflow-y-auto">
        {sortedProjects.map((project, index) => (
          <div
            key={project.id}
            draggable={!isMobile}
            onDragStart={(e) => onDragStart(e, project)}
            className="cursor-grab animate-slide-in"
            style={{ animationDelay: `${index * 0.03}s` }}
          >
            <ProjectCard
              project={project}
              onEdit={onEdit}
              onDelete={onDelete}
              onViewDetails={onViewDetails}
              isMobile={isMobile}
            />
            
            {/* Mobile Move Buttons */}
            {isMobile && onMoveProject && (
              <div className="flex flex-wrap gap-1.5 mt-2 pt-2 border-t border-white/5">
                {getMoveOptions(project.status).map((option) => (
                  <button
                    key={option.status}
                    onClick={() => onMoveProject(project, option.status)}
                    className="
                      px-2.5 py-1.5 text-xs font-medium
                      rounded-md border border-white/10
                      bg-slate-900/50 text-slate-400
                      transition-all duration-200
                      hover:bg-red-700/20 hover:border-red-700/40 hover:text-slate-100
                      active:scale-95
                    "
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
        
        {sortedProjects.length === 0 && (
          <div className="text-center py-8 md:py-12 px-5 text-slate-500 text-xs md:text-sm font-medium border-2 border-dashed border-blue-500/15 rounded-2xl bg-slate-900/30 transition-all hover:border-blue-500/30 hover:bg-slate-900/50 hover:text-slate-400">
            <div className="text-2xl md:text-3xl mb-2 opacity-50">📋</div>
            <div>{isMobile ? 'No projects yet' : 'Drop projects here'}</div>
          </div>
        )}
      </div>
    </div>
  );
});

KanbanColumn.displayName = 'KanbanColumn';
