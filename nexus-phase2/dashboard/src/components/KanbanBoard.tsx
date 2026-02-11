import React, { useState, useCallback, useEffect, useRef } from 'react';
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
  const [activeColumn, setActiveColumn] = useState(0);
  const [isMobile, setIsMobile] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Detect mobile viewport
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const columns: { status: 'backlog' | 'in_progress' | 'done'; title: string; color: string }[] = [
    { status: 'backlog', title: 'Backlog', color: '#6b7280' },
    { status: 'in_progress', title: 'In Progress', color: '#dc2626' },
    { status: 'done', title: 'Done', color: '#10b981' },
  ];

  const getProjectsByStatus = (status: string) =>
    projects.filter((p) => p.status === status);

  // Handle scroll snap to detect active column
  const handleScroll = () => {
    if (!scrollRef.current || !isMobile) return;
    const scrollLeft = scrollRef.current.scrollLeft;
    const columnWidth = scrollRef.current.offsetWidth;
    const newIndex = Math.round(scrollLeft / columnWidth);
    if (newIndex !== activeColumn && newIndex >= 0 && newIndex < columns.length) {
      setActiveColumn(newIndex);
    }
  };

  // Scroll to specific column
  const scrollToColumn = (index: number) => {
    if (!scrollRef.current) return;
    const columnWidth = scrollRef.current.offsetWidth;
    scrollRef.current.scrollTo({ left: columnWidth * index, behavior: 'smooth' });
    setActiveColumn(index);
  };

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

  // Quick move to next/previous column
  const handleQuickMove = async (project: Project, direction: 'left' | 'right') => {
    const statusOrder = ['backlog', 'in_progress', 'done'];
    const currentIndex = statusOrder.indexOf(project.status);
    let newIndex = direction === 'left' ? currentIndex - 1 : currentIndex + 1;
    
    if (newIndex >= 0 && newIndex < statusOrder.length) {
      await handleMoveProject(project, statusOrder[newIndex] as 'backlog' | 'in_progress' | 'done');
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
    <div className="h-full flex flex-col">
      {/* Error Banner */}
      {(error || actionError) && (
        <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2 mb-3 text-red-400 text-xs flex-shrink-0">
          <span>⚠️</span>
          <span className="flex-1 truncate">{error || actionError}</span>
          <button 
            onClick={() => setActionError(null)}
            className="text-red-400 hover:text-red-300 text-lg leading-none"
          >
            ×
          </button>
        </div>
      )}

      {/* Mobile: Column Tabs */}
      {isMobile && (
        <div className="flex-shrink-0 flex gap-1 mb-2 bg-slate-800/50 p-1 rounded-lg">
          {columns.map((col, idx) => (
            <button
              key={col.status}
              onClick={() => scrollToColumn(idx)}
              className={`
                flex-1 py-2 px-2 rounded-md text-xs font-medium transition-all
                ${activeColumn === idx 
                  ? 'bg-slate-700 text-white shadow' 
                  : 'text-slate-400 hover:text-slate-200'}
              `}
              style={{ 
                borderBottom: activeColumn === idx ? `2px solid ${col.color}` : '2px solid transparent'
              }}
            >
              <span className="block truncate">{col.title}</span>
              <span className="text-[10px] opacity-70">
                {getProjectsByStatus(col.status).length}
              </span>
            </button>
          ))}
        </div>
      )}

      {/* Desktop: Horizontal Layout */}
      <div className="hidden md:flex gap-3 flex-1 overflow-x-auto pb-2 snap-x snap-mandatory scrollbar-hide">
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

      {/* Mobile: Swipeable Horizontal Layout - No overflow */}
      <div 
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex md:hidden flex-1 w-full overflow-x-auto snap-x snap-mandatory scrollbar-hide"
      >
        {columns.map((column) => (
          <div 
            key={column.status}
            className="w-full h-full flex-shrink-0 snap-start px-2"
          >
            <KanbanColumn
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
              onQuickMove={handleQuickMove}
              isMobile={true}
            />
          </div>
        ))}
      </div>

      {/* Mobile: Column Indicator Dots */}
      {isMobile && (
        <div className="flex-shrink-0 flex justify-center gap-2 py-2">
          {columns.map((col, idx) => (
            <button
              key={col.status}
              onClick={() => scrollToColumn(idx)}
              className={`
                w-2 h-2 rounded-full transition-all
                ${activeColumn === idx ? 'bg-white w-4' : 'bg-slate-600'}
              `}
            />
          ))}
        </div>
      )}

      {/* Archived Section - Collapsible */}
      <div className="flex-shrink-0 mt-2">
        <button
          onClick={() => setShowArchived(!showArchived)}
          className="flex items-center gap-2 w-full px-3 py-2 bg-slate-800/50 border border-slate-700/50 rounded-lg text-slate-400 text-xs font-medium transition-all hover:border-slate-600 hover:text-slate-300"
        >
          <span 
            className="transition-transform duration-200"
            style={{ transform: showArchived ? 'rotate(90deg)' : 'rotate(0deg)' }}
          >
            ▶
          </span>
          <span>📦 Archived</span>
          <span className="ml-auto bg-slate-700/50 px-2 py-0.5 rounded-full text-[10px]">
            {getProjectsByStatus('archived').length}
          </span>
        </button>
        
        {showArchived && (
          <div className="mt-2 p-3 bg-slate-800/30 rounded-lg border border-slate-700/30">
            {getProjectsByStatus('archived').length === 0 ? (
              <div className="text-slate-500 text-xs text-center py-3">No archived projects</div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {getProjectsByStatus('archived').map((project) => (
                  <div
                    key={project.id}
                    onClick={() => handleViewDetails(project)}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-900/60 rounded-md border border-slate-700/30 cursor-pointer text-xs text-slate-400 hover:border-slate-600 hover:bg-slate-900/80"
                  >
                    <span className="opacity-50">📦</span>
                    <span className="truncate max-w-[120px]">{project.title}</span>
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
