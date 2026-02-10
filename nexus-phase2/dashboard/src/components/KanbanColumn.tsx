import React from 'react';
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
  onAdd: () => void;
}

const columnColors: Record<string, string> = {
  backlog: '#64748b',
  in_progress: '#3b82f6',
  done: '#10b981',
  archived: '#94a3b8',
};

export const KanbanColumn: React.FC<KanbanColumnProps> = ({
  title,
  status,
  projects,
  onDragStart,
  onDragOver,
  onDrop,
  onEdit,
  onDelete,
  onAdd,
}) => {
  return (
    <div
      className="kanban-column"
      style={{
        flex: 1,
        minWidth: '250px',
        background: '#0f172a',
        borderRadius: '12px',
        padding: '16px',
        display: 'flex',
        flexDirection: 'column',
        border: '1px solid #1e293b',
      }}
      onDragOver={onDragOver}
      onDrop={(e) => onDrop(e, status)}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '16px',
          paddingBottom: '12px',
          borderBottom: `2px solid ${columnColors[status]}`,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <h3 style={{ margin: 0, color: '#f8fafc', fontSize: '14px', fontWeight: 600 }}>
            {title}
          </h3>
          <span
            style={{
              background: columnColors[status],
              color: 'white',
              padding: '2px 8px',
              borderRadius: '12px',
              fontSize: '11px',
              fontWeight: 600,
            }}
          >
            {projects.length}
          </span>
        </div>
        <button
          onClick={onAdd}
          style={{
            width: '24px',
            height: '24px',
            borderRadius: '6px',
            border: 'none',
            background: '#334155',
            color: '#f8fafc',
            cursor: 'pointer',
            fontSize: '16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          title="Add new project"
        >
          +
        </button>
      </div>

      <div
        style={{
          flex: 1,
          minHeight: '100px',
        }}
      >
        {projects.map((project) => (
          <div
            key={project.id}
            draggable
            onDragStart={(e) => onDragStart(e, project)}
            style={{ cursor: 'grab' }}
          >
            <ProjectCard
              project={project}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          </div>
        ))}
        {projects.length === 0 && (
          <div
            style={{
              textAlign: 'center',
              padding: '24px',
              color: '#475569',
              fontSize: '12px',
              border: '2px dashed #334155',
              borderRadius: '8px',
            }}
          >
            Drop projects here
          </div>
        )}
      </div>
    </div>
  );
};
