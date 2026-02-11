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
    bgClass: 'bg-red-500/20',
    borderClass: 'border-red-500/30',
    dotClass: 'bg-red-500',
    label: 'HIGH',
  },
  medium: { 
    bgClass: 'bg-amber-500/20',
    borderClass: 'border-amber-500/30',
    dotClass: 'bg-amber-500',
    label: 'MED',
  },
  low: { 
    bgClass: 'bg-blue-500/20',
    borderClass: 'border-blue-500/30',
    dotClass: 'bg-blue-500',
    label: 'LOW',
  },
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
    if (onViewDetails) {
      onViewDetails(project);
    }
  };

  const config = priorityConfig[project.priority];

  // Truncate description
  const shortDesc = project.description 
    ? project.description.length > 60 
      ? project.description.substring(0, 60) + '...'
      : project.description
    : null;

  return (
    <div
      className={`
        relative rounded-lg border ${config.borderClass} ${config.bgClass}
        transition-all duration-200 active:scale-[0.98]
        ${isMobile ? 'p-2' : 'p-3'}
      `}
      onClick={handleCardClick}
      {...dragHandleProps}
    >
      {/* Top Row: Priority dot + Title + Actions */}
      <div className="flex items-start gap-2">
        {/* Priority indicator */}
        <div className={`w-2 h-2 rounded-full ${config.dotClass} mt-1.5 flex-shrink-0`} />
        
        {/* Title */}
        <h4 className={`flex-1 font-medium text-slate-200 leading-tight ${isMobile ? 'text-xs' : 'text-sm'}`}>
          {project.title}
        </h4>
        
        {/* Quick Actions */}
        <div className="flex gap-0.5 flex-shrink-0">
          <button
            onClick={handleTriggerBaymax}
            disabled={isNotifying}
            className={`
              p-1 rounded transition-colors
              ${notificationSent 
                ? 'text-emerald-400' 
                : 'text-slate-500 hover:text-slate-300'}
              disabled:opacity-50
            `}
            title="Alert Baymax"
          >
            <span className="text-xs">{isNotifying ? '⏳' : notificationSent ? '✓' : '🤖'}</span>
          </button>
          
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEdit(project);
            }}
            className="p-1 rounded text-slate-500 hover:text-slate-300 transition-colors"
            title="Edit"
          >
            <span className="text-xs">✎</span>
          </button>
        </div>
      </div>
      
      {/* Description - only if exists */}
      {shortDesc && (
        <p className={`mt-1 text-slate-500 leading-snug ${isMobile ? 'text-[10px] line-clamp-1' : 'text-xs line-clamp-2'}`}>
          {shortDesc}
        </p>
      )}
      
      {/* Bottom: Priority label & Delete */}
      <div className="flex justify-between items-center mt-2">
        <span className={`text-[9px] font-bold tracking-wider ${config.dotClass.replace('bg-', 'text-')}`}>
          {config.label}
        </span>
        
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete(project.id);
          }}
          className="text-[10px] text-slate-600 hover:text-red-400 transition-colors"
        >
          Delete
        </button>
      </div>
    </div>
  );
});

ProjectCard.displayName = 'ProjectCard';
