import React, { useState } from 'react';
import { Project, api } from '../lib/api';

interface ProjectCardProps {
  project: Project;
  onEdit: (project: Project) => void;
  onDelete: (id: string) => void;
  onViewDetails?: (project: Project) => void;
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
  onViewDetails,
  dragHandleProps,
}) => {
  const [isNotifying, setIsNotifying] = useState(false);
  const [notificationSent, setNotificationSent] = useState(false);

  const handleTriggerBaymax = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isNotifying) return;
    
    setIsNotifying(true);
    try {
      await api.triggerBaymaxAlert({
        title: `Project Alert: ${project.title}`,
        message: `Baymax has been summoned for project "${project.title}"`,
        source_id: project.id,
        source_type: 'project',
      });
      setNotificationSent(true);
      setTimeout(() => setNotificationSent(false), 3000);
    } catch (error) {
      console.error('Failed to trigger Baymax:', error);
    } finally {
      setIsNotifying(false);
    }
  };

  const handleCardClick = () => {
    onViewDetails?.(project);
  };

  return (
    <div
      className="project-card"
      style={{
        background: '#1e293b',
        borderRadius: '8px',
        padding: '12px',
        marginBottom: '8px',
        cursor: onViewDetails ? 'pointer' : 'grab',
        border: '1px solid #334155',
        position: 'relative',
        transition: 'all 0.2s ease',
      }}
      onClick={handleCardClick}
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
        {project.title}
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
          marginTop: '8px',
        }}
      >
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleTriggerBaymax(e);
          }}
          disabled={isNotifying}
          style={{
            padding: '4px 8px',
            fontSize: '11px',
            background: notificationSent ? '#10b981' : isNotifying ? '#475569' : '#8b5cf6',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: isNotifying ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            transition: 'all 0.2s ease',
          }}
          title="Alert Baymax about this project"
        >
          {isNotifying ? (
            <span>🤖...</span>
          ) : notificationSent ? (
            <span>✓ Sent</span>
          ) : (
            <span>🤖 Baymax</span>
          )}
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onEdit(project);
          }}
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
          onClick={(e) => {
            e.stopPropagation();
            onDelete(project.id);
          }}
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
