import React, { useState, useCallback, useEffect } from 'react';
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
    <div className="h-full">
      {/* Error Banner */}
      {(error || actionError) && (
        <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-3 mb-4 text-red-400 text-sm">
          <span>⚠️</span>
          <span>{error || actionError}</span>
          <button 
            onClick={() => setActionError(null)}
            className="ml-auto bg-transparent border-none text-red-400 text-lg hover:text-red-300"
          >
            ×
          </button>
        </div>
      )}

      {/* Desktop: Horizontal Layout */}
      <div className="hidden md:flex gap-4 h-[calc(100%-60px)] overflow-x-auto pb-2 snap-x snap-mandatory scrollbar-hide">
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
      <div className="flex md:hidden flex-col gap-5 pb-24">
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
      <div className="mt-4">
        <button
          onClick={() => setShowArchived(!showArchived)}
          className="flex items-center gap-2 w-full px-4 py-2.5 bg-gradient-to-br from-gray-700/20 to-gray-600/10 border border-gray-500/30 rounded-lg text-gray-400 text-xs font-semibold transition-all hover:border-gray-500/50 hover:text-gray-300"
        >
          <span 
            className="transition-transform duration-200"
            style={{ transform: showArchived ? 'rotate(90deg)' : 'rotate(0deg)' }}
          >
            ▶
          </span>
          <span>📦 Archived</span>
          <span className="ml-auto bg-gray-600/25 px-2 py-0.5 rounded-full text-xs">
            {getProjectsByStatus('archived').length}
          </span>
        </button>
        
        {showArchived && (
          <div className="mt-3 p-4 bg-gradient-to-br from-slate-800/50 to-slate-900/30 rounded-xl border border-gray-500/20">
            {getProjectsByStatus('archived').length === 0 ? (
              <div className="text-gray-500 text-sm text-center py-5">No archived projects</div>
            ) : (
              <div className="flex flex-wrap gap-3">
                {getProjectsByStatus('archived').map((project) => (
                  <div
                    key={project.id}
                    onClick={() => handleViewDetails(project)}
                    className="flex items-center gap-2 px-3.5 py-2.5 bg-slate-900/60 rounded-lg border border-gray-500/20 cursor-pointer transition-all hover:border-gray-500/40 hover:bg-slate-900/80"
                  >
                    <span className="text-xs opacity-50">📦</span>
                    <span className="text-xs text-gray-400">{project.title}</span>
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
