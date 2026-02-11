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
  high: { bg: '#dc2626', text: '#ffffff', label: '🔴 HIGH' },
  medium: { bg: '#f59e0b', text: '#000000', label: '🟡 MED' },
  low: { bg: '#10b981', text: '#ffffff', label: '🟢 LOW' },
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

  const priorityStyle = priorityColors[project.priority];

  return (
    <div
      className="project-card"
      style={{
        background: '#1e293b',
        borderRadius: '8px',
        padding: '10px 12px',
        marginBottom: '6px',
        cursor: 'pointer',
        border: '1px solid #334155',
        position: 'relative',
        transition: 'all 0.2s ease',
      }}
      onClick={handleCardClick}
      {...dragHandleProps}
    >
      {/* Priority Badge - Top Right */}
      <div
        style={{
          position: 'absolute',
          top: '8px',
          right: '8px',
          padding: '2px 8px',
          borderRadius: '4px',
          fontSize: '10px',
          fontWeight: 700,
          backgroundColor: priorityStyle.bg,
          color: priorityStyle.text,
          letterSpacing: '0.5px',
        }}
      >
        {priorityStyle.label}
      </div>

      {/* Title */}
      <h4
        style={{
          margin: '0 0 6px 0',
          color: '#f8fafc',
          fontSize: '14px',
          fontWeight: 600,
          paddingRight: '70px',
          lineHeight: '1.3',
        }}
      >
        {project.title}
      </h4>

      {/* Short Description (1-2 lines max) */}
      {project.description && (
        <p
          style={{
            margin: '0 0 8px 0',
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

      {/* Expanded Details (shown on click) */}
      {isExpanded && project.description && project.description.length > 80 && (
        <div
          style={{
            margin: '10px 0',
            padding: '10px',
            background: '#0f172a',
            borderRadius: '6px',
            border: '1px solid #334155',
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
          <p
            style={{
              margin: '8px 0 0 0',
              color: '#64748b',
              fontSize: '10px',
            }}
          >
            ID: {project.id} • Created: {new Date(project.created_at).toLocaleDateString()}
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
            padding: '3px 8px',
            fontSize: '10px',
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
          title="Alert Baymax"
        >
          {isNotifying ? '...' : notificationSent ? '✓' : '🤖'}
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onEdit(project);
          }}
          style={{
            padding: '3px 8px',
            fontSize: '10px',
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
            padding: '3px 8px',
            fontSize: '10px',
            background: '#ef4444',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
          }}
        >
          Del
        </button>
      </div>

      {/* Click hint */}
      {project.description && project.description.length > 80 && (
        <div
          style={{
            textAlign: 'center',
            marginTop: '4px',
            color: '#64748b',
            fontSize: '9px',
          }}
        >
          {isExpanded ? '▼ Click to collapse' : '▶ Click to expand'}
        </div>
      )}
    </div>
  );
};
