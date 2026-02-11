import React, { useState, useCallback } from 'react';
import { Project, api, CreateProjectRequest, UpdateProjectRequest } from '../lib/api';
import { KanbanColumn } from './KanbanColumn';
import { ProjectModal } from './ProjectModal';
import { ProjectDetailsModal } from './ProjectDetailsModal';
import { SkeletonLoader, ErrorState } from './LoadingStates';

interface KanbanBoardProps {
  projects: Project[];
  loading: boolean;
  error: string | null;
  onProjectsChange: () => void;
}

export const KanbanBoard: React.FC<KanbanBoardProps> = ({
  projects,
  loading,
  error,
  onProjectsChange,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [viewingProject, setViewingProject] = useState<Project | null>(null);
  const [defaultStatus, setDefaultStatus] = useState<'backlog' | 'in_progress' | 'done' | 'archived'>('backlog');
  const [draggedProject, setDraggedProject] = useState<Project | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [showArchived, setShowArchived] = useState(false);

  const columns: { status: 'backlog' | 'in_progress' | 'done'; title: string }[] = [
    { status: 'backlog', title: 'Backlog' },
    { status: 'in_progress', title: 'In Progress' },
    { status: 'done', title: 'Done' },
  ];

  const getProjectsByStatus = (status: string) =>
    projects.filter((p) => p.status === status);

  const handleAdd = (status: 'backlog' | 'in_progress' | 'done' | 'archived') => {
    setEditingProject(null);
    setDefaultStatus(status);
    setIsModalOpen(true);
  };

  const handleEdit = (project: Project) => {
    setEditingProject(project);
    setDefaultStatus(project.status);
    setIsModalOpen(true);
  };

  const handleViewDetails = (project: Project) => {
    setViewingProject(project);
    setIsDetailsModalOpen(true);
  };

  const handleDetailsSave = (updatedProject: Project) => {
    // Update the viewing project with the new data
    setViewingProject(updatedProject);
    // Refresh the project list
    onProjectsChange();
  };

  const handleSave = async (data: CreateProjectRequest | UpdateProjectRequest) => {
    try {
      setActionError(null);
      if (editingProject) {
        await api.updateProject(editingProject.id, data as UpdateProjectRequest);
      } else {
        await api.createProject(data as CreateProjectRequest);
      }
      setIsModalOpen(false);
      onProjectsChange();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Failed to save project');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this project?')) return;
    
    try {
      setActionError(null);
      await api.deleteProject(id);
      onProjectsChange();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Failed to delete project');
    }
  };

  const handleDragStart = useCallback((e: React.DragEvent, project: Project) => {
    setDraggedProject(project);
    e.dataTransfer.effectAllowed = 'move';
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  }, []);

  const handleDrop = useCallback(
    async (e: React.DragEvent, status: 'backlog' | 'in_progress' | 'done' | 'archived') => {
      e.preventDefault();
      
      // Safety check: ensure we have a valid dragged project
      if (!draggedProject) {
        console.log('Drop ignored: no dragged project');
        return;
      }
      
      // Safety check: don't update if status hasn't changed
      if (draggedProject.status === status) {
        setDraggedProject(null);
        return;
      }
      
      // Safety check: ensure dragged project is in the current project list
      const projectExists = projects.find(p => p.id === draggedProject.id);
      if (!projectExists) {
        console.log('Drop ignored: project not in current list');
        setDraggedProject(null);
        return;
      }

      try {
        setActionError(null);
        await api.patchProject(draggedProject.id, { status });
        onProjectsChange();
      } catch (err) {
        setActionError(err instanceof Error ? err.message : 'Failed to move project');
      } finally {
        setDraggedProject(null);
      }
    },
    [draggedProject, onProjectsChange, projects]
  );

  if (loading) {
    return <SkeletonLoader />;
  }

  if (error && !projects.length) {
    return (
      <ErrorState 
        message={error} 
        onRetry={onProjectsChange}
      />
    );
  }

  return (
    <div style={{ height: '100%' }}>
      {(error || actionError) && (
        <div
          style={{
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: '8px',
            padding: '12px 16px',
            marginBottom: '16px',
            color: '#ef4444',
            fontSize: '13px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <span>⚠️</span>
          <span>{error || actionError}</span>
          <button
            onClick={() => setActionError(null)}
            style={{
              marginLeft: 'auto',
              background: 'transparent',
              border: 'none',
              color: '#ef4444',
              cursor: 'pointer',
              fontSize: '16px',
            }}
          >
            ×
          </button>
        </div>
      )}

      <div
        style={{
          display: 'flex',
          gap: '16px',
          height: 'calc(100% - 60px)',
          overflowX: 'auto',
          paddingBottom: '8px',
        }}
      >
        {columns.map((column) => (
          <KanbanColumn
            key={column.status}
            title={column.title}
            status={column.status}
            projects={getProjectsByStatus(column.status)}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onViewDetails={handleViewDetails}
            onAdd={() => handleAdd(column.status)}
          />
        ))}
      </div>

      {/* Archived Section - Collapsible */}
      <div style={{ marginTop: '16px' }}>
        <button
          onClick={() => setShowArchived(!showArchived)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 16px',
            background: 'linear-gradient(145deg, rgba(107, 114, 128, 0.2) 0%, rgba(75, 85, 99, 0.1) 100%)',
            border: '1px solid rgba(107, 114, 128, 0.3)',
            borderRadius: '10px',
            color: '#9ca3af',
            fontSize: '12px',
            fontWeight: 600,
            cursor: 'pointer',
            width: '100%',
            justifyContent: 'flex-start',
            transition: 'all 0.2s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = 'rgba(107, 114, 128, 0.5)';
            e.currentTarget.style.color = '#d1d5db';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = 'rgba(107, 114, 128, 0.3)';
            e.currentTarget.style.color = '#9ca3af';
          }}
        >
          <span style={{ 
            transform: showArchived ? 'rotate(90deg)' : 'rotate(0deg)',
            transition: 'transform 0.2s ease',
          }}>▶</span>
          <span>📦 Archived</span>
          <span style={{ 
            marginLeft: 'auto', 
            background: 'rgba(107, 114, 128, 0.25)',
            padding: '2px 8px',
            borderRadius: '9999px',
            fontSize: '11px',
          }}>
            {getProjectsByStatus('archived').length}
          </span>
        </button>
        
        {showArchived && (
          <div
            style={{
              marginTop: '12px',
              padding: '16px',
              background: 'linear-gradient(145deg, rgba(26, 35, 50, 0.5) 0%, rgba(15, 23, 42, 0.3) 100%)',
              borderRadius: '12px',
              border: '1px solid rgba(107, 114, 128, 0.2)',
            }}
          >
            {getProjectsByStatus('archived').length === 0 ? (
              <div style={{ color: '#6b7280', fontSize: '13px', textAlign: 'center', padding: '20px' }}>
                No archived projects
              </div>
            ) : (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
                {getProjectsByStatus('archived').map((project) => (
                  <div
                    key={project.id}
                    onClick={() => handleViewDetails(project)}
                    style={{
                      padding: '10px 14px',
                      background: 'rgba(15, 23, 42, 0.6)',
                      borderRadius: '8px',
                      border: '1px solid rgba(107, 114, 128, 0.2)',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      transition: 'all 0.2s ease',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = 'rgba(107, 114, 128, 0.4)';
                      e.currentTarget.style.background = 'rgba(15, 23, 42, 0.8)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = 'rgba(107, 114, 128, 0.2)';
                      e.currentTarget.style.background = 'rgba(15, 23, 42, 0.6)';
                    }}
                  >
                    <span style={{ fontSize: '10px', opacity: 0.5 }}>📦</span>
                    <span style={{ fontSize: '12px', color: '#9ca3af' }}>{project.title}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <ProjectModal
        isOpen={isModalOpen}
        project={editingProject}
        defaultStatus={defaultStatus}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSave}
      />

      <ProjectDetailsModal
        project={viewingProject}
        isOpen={isDetailsModalOpen}
        onClose={() => setIsDetailsModalOpen(false)}
        onSave={handleDetailsSave}
      />
    </div>
  );
};
