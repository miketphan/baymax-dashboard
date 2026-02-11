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

// Circular Count Badge - Tech Style
const CountBadge: React.FC<{ count: number; gradient: string; glowColor: string }> = ({ 
  count, 
  gradient, 
  glowColor 
}) => (
  <div
    style={{
      background: gradient,
      color: 'white',
      padding: '4px 12px',
      borderRadius: '9999px',
      fontSize: '12px',
      fontWeight: 700,
      boxShadow: `0 0 12px ${glowColor}`,
      border: '1px solid rgba(255, 255, 255, 0.15)',
      minWidth: '28px',
      textAlign: 'center',
    }}
  >
    {count}
  </div>
);

export const KanbanColumn: React.FC<KanbanColumnProps> = ({
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
      style={{
        flex: 1,
        minWidth: '300px',
        maxWidth: '420px',
        background: 'linear-gradient(180deg, rgba(26, 35, 50, 0.6) 0%, rgba(15, 23, 42, 0.4) 100%)',
        backdropFilter: 'blur(16px)',
        borderRadius: '20px',
        padding: '20px',
        display: 'flex',
        flexDirection: 'column',
        border: '1px solid rgba(255, 255, 255, 0.06)',
        borderTop: `3px solid ${config.accentColor}`,
        boxShadow: `0 8px 32px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.05)`,
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      }}
      onDragOver={onDragOver}
      onDrop={(e) => onDrop(e, status)}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = 'rgba(153, 27, 27, 0.3)';
        e.currentTarget.style.boxShadow = `0 12px 40px rgba(0, 0, 0, 0.5), 0 0 30px ${config.glowColor}`;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.06)';
        e.currentTarget.style.boxShadow = '0 8px 32px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.05)';
      }}
    >
      {/* Column Header - Command Center Style */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '18px',
          paddingBottom: '14px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {/* Icon with glow */}
          <div
            style={{
              width: '36px',
              height: '36px',
              background: config.gradient,
              borderRadius: '10px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '16px',
              boxShadow: `0 0 15px ${config.glowColor}`,
              border: '1px solid rgba(255, 255, 255, 0.1)',
            }}
          >
            {config.icon}
          </div>
          
          <h3 style={{ 
            margin: 0, 
            color: '#f8fafc', 
            fontSize: '15px', 
            fontWeight: 600,
            letterSpacing: '-0.2px',
            textShadow: '0 0 10px rgba(248, 250, 252, 0.1)',
          }}>
            {title}
          </h3>
          
          <CountBadge 
            count={sortedProjects.length} 
            gradient={config.gradient}
            glowColor={config.glowColor}
          />
        </div>
        
        {/* Add Button - Tech Style */}
        <button
          onClick={onAdd}
          style={{
            width: '34px',
            height: '34px',
            borderRadius: '10px',
            border: '1px solid rgba(153, 27, 27, 0.4)',
            background: 'rgba(153, 27, 27, 0.1)',
            color: '#991b1b',
            cursor: 'pointer',
            fontSize: '20px',
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
            fontFamily: "'Inter', sans-serif",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'linear-gradient(135deg, #991b1b 0%, #7f1d1d 100%)';
            e.currentTarget.style.color = '#ffffff';
            e.currentTarget.style.transform = 'scale(1.1) rotate(90deg)';
            e.currentTarget.style.boxShadow = '0 0 20px rgba(153, 27, 27, 0.5)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(153, 27, 27, 0.1)';
            e.currentTarget.style.color = '#991b1b';
            e.currentTarget.style.transform = 'scale(1) rotate(0deg)';
            e.currentTarget.style.boxShadow = 'none';
          }}
          title="Add new project"
        >
          +
        </button>
      </div>

      {/* Projects List */}
      <div
        style={{
          flex: 1,
          minHeight: '150px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
        }}
      >
        {sortedProjects.map((project, index) => (
          <div
            key={project.id}
            draggable
            onDragStart={(e) => onDragStart(e, project)}
            style={{ 
              cursor: 'grab',
              animation: `slideIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) ${index * 0.06}s both`,
            }}
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
          <div
            style={{
              textAlign: 'center',
              padding: '50px 24px',
              color: '#64748b',
              fontSize: '13px',
              fontWeight: 500,
              border: '2px dashed rgba(59, 130, 246, 0.15)',
              borderRadius: '16px',
              background: 'rgba(15, 23, 42, 0.3)',
              transition: 'all 0.3s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = 'rgba(59, 130, 246, 0.3)';
              e.currentTarget.style.background = 'rgba(15, 23, 42, 0.5)';
              e.currentTarget.style.color = '#94a3b8';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = 'rgba(59, 130, 246, 0.15)';
              e.currentTarget.style.background = 'rgba(15, 23, 42, 0.3)';
              e.currentTarget.style.color = '#64748b';
            }}
          >
            <div style={{ 
              fontSize: '32px', 
              marginBottom: '10px', 
              opacity: 0.5,
              filter: 'drop-shadow(0 0 10px rgba(59, 130, 246, 0.3))'
            }}>
              📋
            </div>
            <div>Drop projects here</div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes slideIn {
          from { 
            opacity: 0; 
            transform: translateY(15px) scale(0.95); 
          }
          to { 
            opacity: 1; 
            transform: translateY(0) scale(1); 
          }
        }
      `}</style>
    </div>
  );
};
