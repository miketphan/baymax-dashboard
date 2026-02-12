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
  onQuickMove?: (project: Project, direction: 'left' | 'right') => void;
  isMobile?: boolean;
}

const columnConfig: Record<string, { 
  icon: string;
  bgClass: string;
  borderClass: string;
  glowClass: string;
  textClass: string;
}> = {
  backlog: { 
    icon: '📥',
    bgClass: 'from-gray-700 to-gray-600',
    borderClass: 'border-gray-600',
    glowClass: 'shadow-gray-900/30',
    textClass: 'text-gray-400',
  },
  in_progress: { 
    icon: '⚡',
    bgClass: 'from-red-700 to-red-800',
    borderClass: 'border-red-700',
    glowClass: 'shadow-red-900/30',
    textClass: 'text-red-400',
  },
  done: { 
    icon: '✓',
    bgClass: 'from-emerald-600 to-emerald-700',
    borderClass: 'border-emerald-600',
    glowClass: 'shadow-emerald-900/30',
    textClass: 'text-emerald-400',
  },
  archived: { 
    icon: '📦',
    bgClass: 'from-gray-600 to-gray-700',
    borderClass: 'border-gray-600',
    glowClass: 'shadow-gray-900/20',
    textClass: 'text-gray-400',
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
  onQuickMove,
  isMobile = false,
}) => {
  const sortedProjects = sortByPriority(projects);
  const config = columnConfig[status];

  // Can move left/right for quick actions
  const canMoveLeft = status !== 'backlog';
  const canMoveRight = status !== 'done';

  return (
    <div
      className={`
        flex flex-col h-full w-full
        bg-gradient-to-b from-slate-800/60 to-slate-900/40
        ${isMobile ? '' : 'min-w-[280px] max-w-[320px] rounded-xl border border-white/5'}
      `}
      onDragOver={onDragOver}
      onDrop={(e) => onDrop(e, status)}
    >
      {/* Column Header - Compact */}
      <div className="flex justify-between items-center p-3 border-b border-white/5 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div
            className={`
              w-6 h-6 rounded-md flex items-center justify-center text-xs
              bg-gradient-to-br ${config.bgClass} shadow border border-white/10
            `}
          >
            {config.icon}
          </div>
          
          <div>
            <h3 className="text-xs font-semibold text-slate-200">{title}</h3>
            <span className={`text-[10px] ${config.textClass}`}>
              {sortedProjects.length} tasks
            </span>
          </div>
        </div>
        
        <button
          onClick={onAdd}
          title="Add new project"
          className="
            w-7 h-7 rounded-md flex items-center justify-center
            bg-slate-700/50 text-slate-300 text-lg font-bold
            transition-all hover:bg-slate-600 hover:text-white active:scale-95
          "
        >
          +
        </button>
      </div>

      {/* Projects List - Scrollable */}
      <div className="flex-1 overflow-y-auto px-2 py-2 space-y-3">
        {sortedProjects.map((project) => (
          <div
            key={project.id}
            draggable={!isMobile}
            onDragStart={(e) => onDragStart(e, project)}
            className="relative group"
          >
            {/* Quick Move Buttons (Mobile) */}
            {isMobile && onQuickMove && (
              <div className="absolute -left-2 top-1/2 -translate-y-1/2 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                {canMoveLeft && (
                  <button
                    onClick={() => onQuickMove(project, 'left')}
                    className="w-6 h-6 rounded-full bg-slate-700 text-white text-xs flex items-center justify-center shadow-lg active:scale-90"
                  >
                    ←
                  </button>
                )}
              </div>
            )}
            
            {isMobile && onQuickMove && (
              <div className="absolute -right-2 top-1/2 -translate-y-1/2 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                {canMoveRight && (
                  <button
                    onClick={() => onQuickMove(project, 'right')}
                    className="w-6 h-6 rounded-full bg-slate-700 text-white text-xs flex items-center justify-center shadow-lg active:scale-90"
                  >
                    →
                  </button>
                )}
              </div>
            )}

            <ProjectCard
              project={project}
              onEdit={onEdit}
              onDelete={onDelete}
              onViewDetails={onViewDetails}
              isMobile={isMobile}
            />
          </div>
        ))}
        
        {sortedProjects.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-slate-600 py-8">
            <div className="text-2xl mb-1 opacity-30">📋</div>
            <div className="text-[10px]">Empty</div>
          </div>
        )}
      </div>
    </div>
  );
});

KanbanColumn.displayName = 'KanbanColumn';
