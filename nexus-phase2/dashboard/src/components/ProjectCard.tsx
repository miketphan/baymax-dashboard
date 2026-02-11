import React, { useState } from 'react';
import { Project, api } from '../lib/api';

interface ProjectCardProps {
  project: Project;
  onEdit: (project: Project) => void;
  onDelete: (id: string) => void;
  onViewDetails?: (project: Project) => void;
  dragHandleProps?: React.HTMLAttributes<HTMLDivElement>;
}

const priorityConfig = {
  high: { 
    bg: 'rgba(153, 27, 27, 0.15)', 
    border: 'rgba(220, 38, 38, 0.3)',
    glow: '0 0 20px rgba(220, 38, 38, 0.2)',
    label: 'HIGH',
    color: '#fca5a5'
  },
  medium: { 
    bg: 'rgba(202, 138, 4, 0.12)', 
    border: 'rgba(234, 179, 8, 0.25)',
    glow: '0 0 20px rgba(234, 179, 8, 0.15)',
    label: 'MED',
    color: '#fde047'
  },
  low: { 
    bg: 'rgba(29, 78, 216, 0.12)', 
    border: 'rgba(59, 130, 246, 0.25)',
    glow: '0 0 20px rgba(59, 130, 246, 0.15)',
    label: 'LOW',
    color: '#93c5fd'
  },
};

const truncateDescription = (text: string, maxLength: number = 80): string => {
  if (!text || text.length <= maxLength) return text || '';
  return text.substring(0, maxLength).trim() + '...';
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
  const [isExpanded, setIsExpanded] = useState(false);

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
    if (onViewDetails && !isExpanded) {
      onViewDetails(project);
    } else {
      setIsExpanded(!isExpanded);
    }
  };

  const config = priorityConfig[project.priority];

  return (
    <div
      style={{
        background: 'linear-gradient(145deg, rgba(30, 41, 59, 0.8) 0%, rgba(15, 23, 42, 0.9) 100%)',
        borderRadius: '12px',
        padding: '14px',
        cursor: 'pointer',
        border: `1px solid ${config.border}`,
        position: 'relative',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.3)',
      }}
      onClick={handleCardClick}
      {...dragHandleProps}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-3px) scale(1.01)';
        e.currentTarget.style.boxShadow = config.glow;
        e.currentTarget.style.borderColor = config.color;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0) scale(1)';
        e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.3)';
        e.currentTarget.style.borderColor = config.border;
      }}
    >
      {/* Priority Badge */}
      <div
        style={{
          position: 'absolute',
          top: '10px',
          right: '10px',
          padding: '3px 10px',
          borderRadius: '6px',
          fontSize: '9px',
          fontWeight: 800,
          textTransform: 'uppercase',
          letterSpacing: '1px',
          background: config.bg,
          color: config.color,
          border: `1px solid ${config.border}`,
          boxShadow: config.glow,
        }}
      >
        {config.label}
      </div>

      {/* Title */}
      <h4
        style={{
          margin: '0 0 8px 0',
          color: '#f8fafc',
          fontSize: '14px',
          fontWeight: 600,
          paddingRight: '60px',
          lineHeight: '1.3',
        }}
      >
        {project.title}
      </h4>

      {/* Short Description */}
      {project.description && (
        <p
          style={{
            margin: '0 0 10px 0',
            color: '#94a3b8',
            fontSize: '12px',
            lineHeight: '1.4',
            maxHeight: '34px',
            overflow: 'hidden',
          }}
        >
          {truncateDescription(project.description)}
        </p>
      )}

      {/* Expanded Details */}
      {isExpanded && project.description && project.description.length > 80 && (
        <div
          style={{
            margin: '12px 0',
            padding: '12px',
            background: 'rgba(0, 0, 0, 0.4)',
            borderRadius: '8px',
            border: '1px solid rgba(255, 255, 255, 0.05)',
          }}
        >
          <p
            style={{
              margin: 0,
              color: '#e2e8f0',
              fontSize: '12px',
              lineHeight: '1.5',
              whiteSpace: 'pre-wrap',
            }}
          >
            {project.description}
          </p>
        </div>
      )}

      {/* Action Buttons */}
      <div
        style={{
          display: 'flex',
          gap: '6px',
          justifyContent: 'flex-end',
        }}
      >
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleTriggerBaymax(e);
          }}
          disabled={isNotifying}
          style={{
            padding: '5px 10px',
            fontSize: '11px',
            background: notificationSent ? 'rgba(16, 185, 129, 0.15)' : isNotifying ? 'rgba(100, 100, 100, 0.1)' : 'rgba(220, 38, 38, 0.12)',
            color: notificationSent ? '#6ee7b7' : isNotifying ? '#9ca3af' : '#fca5a5',
            border: `1px solid ${notificationSent ? 'rgba(16, 185, 129, 0.25)' : isNotifying ? 'rgba(100, 100, 100, 0.2)' : 'rgba(220, 38, 38, 0.25)'}`,
            borderRadius: '6px',
            cursor: isNotifying ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            transition: 'all 0.2s ease',
            fontWeight: 600,
          }}
        >
          {isNotifying ? '...' : notificationSent ? 'Sent' : 'Baymax'}
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onEdit(project);
          }}
          style={{
            padding: '5px 10px',
            fontSize: '11px',
            background: 'rgba(59, 130, 246, 0.12)',
            color: '#93c5fd',
            border: '1px solid rgba(59, 130, 246, 0.25)',
            borderRadius: '6px',
            cursor: 'pointer',
            fontWeight: 600,
            transition: 'all 0.2s ease',
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
            padding: '5px 10px',
            fontSize: '11px',
            background: 'rgba(100, 100, 100, 0.08)',
            color: '#9ca3af',
            border: '1px solid rgba(100, 100, 100, 0.15)',
            borderRadius: '6px',
            cursor: 'pointer',
            fontWeight: 600,
            transition: 'all 0.2s ease',
          }}
        >
          Del
        </button>
      </div>
    </div>
  );
};
