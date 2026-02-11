import React, { memo } from 'react';
import { Project } from '../lib/api';
import { ProjectCard } from './ProjectCard';
import './KanbanColumn.css';

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
}

// Command Center Column Config
const columnConfig: Record<string, { 
  color: string; 
  gradient: string; 
  icon: string;
  accentColor: string;
  glowColor: string;
}> = {
  backlog: { 
    color: '#4b5563', 
    gradient: 'linear-gradient(135deg, #374151 0%, #4b5563 100%)',
    icon: '📥',
    accentColor: '#4b5563',
    glowColor: 'rgba(75, 85, 99, 0.3)'
  },
  in_progress: { 
    color: '#991b1b', 
    gradient: 'linear-gradient(135deg, #991b1b 0%, #7f1d1d 100%)',
    icon: '⚡',
    accentColor: '#991b1b',
    glowColor: 'rgba(153, 27, 27, 0.4)'
  },
  done: { 
    color: '#10b981', 
    gradient: 'linear-gradient(135deg, #059669 0%, #10b981 100%)',
    icon: '✓',
    accentColor: '#10b981',
    glowColor: 'rgba(16, 185, 129, 0.4)'
  },
  archived: { 
    color: '#6b7280', 
    gradient: 'linear-gradient(135deg, #4b5563 0%, #6b7280 100%)',
    icon: '📦',
    accentColor: '#6b7280',
    glowColor: 'rgba(107, 114, 128, 0.2)'
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
}) => {
  const sortedProjects = sortByPriority(projects);
  const config = columnConfig[status];

  return (
    <div
      className="kanban-column"
      style={{
        '--column-accent': config.accentColor,
        '--column-glow': config.glowColor,
      } as React.CSSProperties}
      onDragOver={onDragOver}
      onDrop={(e) => onDrop(e, status)}
    >
      {/* Column Header - Command Center Style */}
      <div className="kanban-column-header">
        <div className="kanban-column-title">
          {/* Icon with glow */}
          <div
            className="kanban-column-icon"
            style={{ background: config.gradient }}
          >
            {config.icon}
          </div>
          
          <h3 className="kanban-column-name">{title}</h3>
          
          <div
            className="kanban-column-count"
            style={{ background: config.gradient }}
          >
            {sortedProjects.length}
          </div>
        </div>
        
        {/* Add Button */}
        <button
          className="kanban-add-btn"
          onClick={onAdd}
          title="Add new project"
        >
          +
        </button>
      </div>

      {/* Projects List */}
      <div className="kanban-projects-list">
        {sortedProjects.map((project, index) => (
          <div
            key={project.id}
            draggable
            onDragStart={(e) => onDragStart(e, project)}
            className="kanban-project-wrapper"
            style={{ animationDelay: `${index * 0.03}s` }}
          >
            <ProjectCard
              project={project}
              onEdit={onEdit}
              onDelete={onDelete}
              onViewDetails={onViewDetails}
            />
          </div>
        ))}
        
        {sortedProjects.length === 0 && (
          <div className="kanban-empty-state">
            <div className="kanban-empty-icon">📋</div>
            <div>Drop projects here</div>
          </div>
        )}
      </div>
    </div>
  );
});

KanbanColumn.displayName = 'KanbanColumn';
