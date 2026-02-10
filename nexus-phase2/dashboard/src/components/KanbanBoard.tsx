import React, { useState, useCallback } from 'react';
import { Project, api } from '../lib/api';
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

  const columns: { status: 'backlog' | 'in_progress' | 'done' | 'archived'; title: string }[] = [
    { status: 'backlog', title: 'Backlog' },
    { status: 'in_progress', title: 'In Progress' },
    { status: 'done', title: 'Done' },
    { status: 'archived', title: 'Archived' },
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

  const handleSave = async (data: Parameters<typeof api.createProject>[0]) => {
    try {
      setActionError(null);
      if (editingProject) {
        await api.updateProject(editingProject.id, data);
      } else {
        await api.createProject(data);
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
      if (!draggedProject || draggedProject.status === status) {
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
    [draggedProject, onProjectsChange]
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
