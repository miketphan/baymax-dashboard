import React, { useState, useCallback, useEffect } from 'react';
import { Project, api, CreateProjectRequest, UpdateProjectRequest } from '../lib/api';
import { KanbanColumn } from './KanbanColumn';
import { ProjectModal } from './ProjectModal';
import { ProjectDetailsModal } from './ProjectDetailsModal';
import { SkeletonLoader, ErrorState } from './LoadingStates';
import './KanbanBoard.css';

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
  const [isMobile, setIsMobile] = useState(false);

  // Detect mobile viewport
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

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
    setViewingProject(updatedProject);
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

  // Mobile: Move project to different status
  const handleMoveProject = async (project: Project, newStatus: 'backlog' | 'in_progress' | 'done' | 'archived') => {
    try {
      setActionError(null);
      await api.patchProject(project.id, { status: newStatus });
      onProjectsChange();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Failed to move project');
    }
  };

  const handleDragStart = useCallback((e: React.DragEvent, project: Project) => {
    if (isMobile) return;
    setDraggedProject(project);
    e.dataTransfer.effectAllowed = 'move';
  }, [isMobile]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    if (isMobile) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  }, [isMobile]);

  const handleDrop = useCallback(
    async (e: React.DragEvent, status: 'backlog' | 'in_progress' | 'done' | 'archived') => {
      if (isMobile) return;
      e.preventDefault();
      
      if (!draggedProject) return;
      
      if (draggedProject.status === status) {
        setDraggedProject(null);
        return;
      }
      
      const projectExists = projects.find(p => p.id === draggedProject.id);
      if (!projectExists) {
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
    [draggedProject, onProjectsChange, projects, isMobile]
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
    <div className="kanban-board">
      {(error || actionError) && (
        <div className="kanban-error-banner">
          <span>⚠️</span>
          <span>{error || actionError}</span>
          <button onClick={() => setActionError(null)}>×</button>
        </div>
      )}

      {/* Desktop: Horizontal Layout */}
      <div className="kanban-board-desktop">
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
            isMobile={false}
          />
        ))}
      </div>

      {/* Mobile: Vertical Stack Layout */}
      <div className="kanban-board-mobile">
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
            onMoveProject={handleMoveProject}
            isMobile={true}
          />
        ))}
      </div>

      {/* Archived Section - Collapsible */}
      <div className="kanban-archived-section">
        <button
          className="kanban-archived-toggle"
          onClick={() => setShowArchived(!showArchived)}
        >
          <span style={{ 
            transform: showArchived ? 'rotate(90deg)' : 'rotate(0deg)',
            transition: 'transform 0.2s ease',
          }}>▶</span>
          <span>📦 Archived</span>
          <span className="kanban-archived-count">
            {getProjectsByStatus('archived').length}
          </span>
        </button>
        
        {showArchived && (
          <div className="kanban-archived-content">
            {getProjectsByStatus('archived').length === 0 ? (
              <div className="kanban-archived-empty">No archived projects</div>
            ) : (
              <div className="kanban-archived-list">
                {getProjectsByStatus('archived').map((project) => (
                  <div
                    key={project.id}
                    className="kanban-archived-item"
                    onClick={() => handleViewDetails(project)}
                  >
                    <span>📦</span>
                    <span>{project.title}</span>
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
