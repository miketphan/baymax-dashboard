import React, { useState, memo } from 'react';
import { Project, api } from '../lib/api';
import './ProjectCard.css';

interface ProjectCardProps {
  project: Project;
  onEdit: (project: Project) => void;
  onDelete: (id: string) => void;
  onViewDetails?: (project: Project) => void;
  dragHandleProps?: React.HTMLAttributes<HTMLDivElement>;
  isMobile?: boolean;
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

export const ProjectCard: React.FC<ProjectCardProps> = memo(({
  project,
  onEdit,
  onDelete,
  onViewDetails,
  dragHandleProps,
  isMobile = false,
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
      className={`project-card project-card--${project.priority}`}
      style={{
        '--card-border': config.border,
        '--card-glow': config.glow,
        '--card-color': config.color,
      } as React.CSSProperties}
      onClick={handleCardClick}
      {...dragHandleProps}
    >
      {/* Priority Badge */}
      <div
        className="priority-badge"
        style={{
          background: config.bg,
          color: config.color,
          borderColor: config.border,
        }}
      >
        {config.label}
      </div>

      {/* Title */}
      <h4 className="project-title">
        {project.title}
      </h4>

      {/* Short Description */}
      {project.description && (
        <p className="project-description">
          {truncateDescription(project.description)}
        </p>
      )}

      {/* Expanded Details */}
      {isExpanded && project.description && project.description.length > 80 && (
        <div className="project-expanded">
          <p className="project-expanded-text">
            {project.description}
          </p>
        </div>
      )}

      {/* Action Buttons */}
      <div className="project-actions">
        <button
          className={`btn-baymax ${notificationSent ? 'sent' : ''} ${isNotifying ? 'loading' : ''}`}
          onClick={handleTriggerBaymax}
          disabled={isNotifying}
        >
          <span>{isNotifying ? '⏳' : notificationSent ? '✓' : '🤖'}</span>
          <span>{isNotifying ? '...' : notificationSent ? 'Sent' : 'Alert'}</span>
        </button>

        <button
          className="btn-edit"
          onClick={(e) => {
            e.stopPropagation();
            onEdit(project);
          }}
        >
          Edit
        </button>

        <button
          className="btn-delete"
          onClick={(e) => {
            e.stopPropagation();
            onDelete(project.id);
          }}
        >
          Del
        </button>
      </div>

      {/* Click hint */}
      {project.description && project.description.length > 80 && (
        <div className="expand-hint">
          {isExpanded ? '▼ Click to collapse' : '▶ Click to expand'}
        </div>
      )}
    </div>
  );
});

ProjectCard.displayName = 'ProjectCard';
