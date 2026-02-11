import React, { useState, memo } from 'react';
import { Project, api } from '../lib/api';

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
    bgClass: 'bg-red-700/15',
    borderClass: 'border-red-600/30',
    glowClass: 'shadow-red-600/20',
    label: 'HIGH',
    textClass: 'text-red-300',
  },
  medium: { 
    bgClass: 'bg-amber-500/12',
    borderClass: 'border-amber-500/25',
    glowClass: 'shadow-amber-500/15',
    label: 'MED',
    textClass: 'text-amber-300',
  },
  low: { 
    bgClass: 'bg-blue-700/12',
    borderClass: 'border-blue-500/25',
    glowClass: 'shadow-blue-500/15',
    label: 'LOW',
    textClass: 'text-blue-300',
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
      className={`
        relative p-3 md:p-4 rounded-xl
        bg-slate-900/60 border ${config.borderClass}
        backdrop-blur-sm
        transition-all duration-300
        hover:border-opacity-60 hover:shadow-lg ${config.glowClass}
        cursor-pointer
        ${isMobile ? 'touch-manipulation' : ''}
      `}
      onClick={handleCardClick}
      {...dragHandleProps}
    >
      {/* Priority Badge */}
      <div
        className={`
          inline-block px-2 py-0.5 rounded text-[10px] font-bold tracking-wider
          ${config.bgClass} ${config.textClass} ${config.borderClass}
          border mb-2
        `}
      >
        {config.label}
      </div>

      {/* Title */}
      <h4 className="text-sm md:text-base font-semibold text-slate-100 mb-1 pr-12">
        {project.title}
      </h4>

      {/* Short Description */}
      {project.description && (
        <p className="text-xs md:text-sm text-slate-400 line-clamp-2">
          {truncateDescription(project.description)}
        </p>
      )}

      {/* Expanded Details */}
      {isExpanded && project.description && project.description.length > 80 && (
        <div className="mt-3 p-3 bg-slate-800/50 rounded-lg border border-white/5">
          <p className="text-xs md:text-sm text-slate-300">
            {project.description}
          </p>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-2 mt-3">
        <button
          onClick={handleTriggerBaymax}
          disabled={isNotifying}
          className={`
            flex-1 flex items-center justify-center gap-1.5
            px-3 py-2 rounded-lg text-xs font-medium
            transition-all duration-200
            ${notificationSent 
              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
              : 'bg-red-700/20 text-red-300 border border-red-700/30 hover:bg-red-700/30'}
            disabled:opacity-50
          `}
        >
          <span>{isNotifying ? '⏳' : notificationSent ? '✓' : '🤖'}</span>
          <span>{isNotifying ? '...' : notificationSent ? 'Sent' : 'Alert'}</span>
        </button>

        <button
          onClick={(e) => {
            e.stopPropagation();
            onEdit(project);
          }}
          className="
            px-3 py-2 rounded-lg text-xs font-medium
            bg-blue-600/20 text-blue-300 border border-blue-600/30
            transition-all hover:bg-blue-600/30
          "
        >
          Edit
        </button>

        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete(project.id);
          }}
          className="
            px-3 py-2 rounded-lg text-xs font-medium
            bg-red-600/20 text-red-300 border border-red-600/30
            transition-all hover:bg-red-600/30
          "
        >
          Del
        </button>
      </div>

      {/* Click hint */}
      {project.description && project.description.length > 80 && (
        <div className="text-[10px] text-slate-500 mt-2 text-center">
          {isExpanded ? '▼ Click to collapse' : '▶ Click to expand'}
        </div>
      )}
    </div>
  );
});

ProjectCard.displayName = 'ProjectCard';
