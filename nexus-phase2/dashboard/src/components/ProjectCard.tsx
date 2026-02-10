import React from 'react';
import { Project } from '../lib/api';

interface ProjectCardProps {
  project: Project;
  onEdit: (project: Project) => void;
  onDelete: (id: string) => void;
  dragHandleProps?: React.HTMLAttributes<HTMLDivElement>;
}

const priorityColors = {
  high: '#ef4444',
  medium: '#f59e0b',
  low: '#10b981',
};

export const ProjectCard: React.FC<ProjectCardProps> = ({
  project,
  onEdit,
  onDelete,
  dragHandleProps,
}) => {
  return (
    <div
      className="project-card"
      style={{
        background: '#1e293b',
        borderRadius: '8px',
        padding: '12px',
        marginBottom: '8px',
        cursor: 'grab',
        border: '1px solid #334155',
        position: 'relative',
      }}
      {...dragHandleProps}
    >
      <div
        className="priority-indicator"
        style={{
          position: 'absolute',
          top: '8px',
          right: '8px',
          width: '8px',
          height: '8px',
          borderRadius: '50%',
          backgroundColor: priorityColors[project.priority],
        }}
        title={`Priority: ${project.priority}`}
      />
      <h4
        style={{
          margin: '0 0 8px 0',
          color: '#f8fafc',
          fontSize: '14px',
          fontWeight: 600,
          paddingRight: '16px',
        }}
      >
        {project.name}
      </h4>
      {project.description && (
        <p
          style={{
            margin: '0 0 12px 0',
            color: '#94a3b8',
            fontSize: '12px',
            lineHeight: '1.4',
          }}
        >
          {project.description}
        </p>
      )}
      <div
        style={{
          display: 'flex',
          gap: '8px',
          justifyContent: 'flex-end',
        }}
      >
        <button
          onClick={() => onEdit(project)}
          style={{
            padding: '4px 8px',
            fontSize: '11px',
            background: '#3b82f6',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
          }}
        >
          Edit
        </button>
        <button
          onClick={() => onDelete(project.id)}
          style={{
            padding: '4px 8px',
            fontSize: '11px',
            background: '#ef4444',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
          }}
        >
          Delete
        </button>
      </div>
    </div>
  );
};
