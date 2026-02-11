import React, { useState, useEffect } from 'react';
import { KanbanBoard } from '../components/KanbanBoard';
import { Project, api } from '../lib/api';

interface ProjectsKanbanProps {
  onRefresh?: () => void;
}

export const ProjectsKanban: React.FC<ProjectsKanbanProps> = ({ onRefresh }) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadProjects = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.getProjects();
      setProjects(data);
      if (onRefresh) onRefresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load projects');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProjects();
  }, []);

  return (
    <div style={{ height: '100%', minHeight: '400px' }}>
      <KanbanBoard
        projects={projects}
        loading={loading}
        error={error}
        onProjectsChange={loadProjects}
      />
    </div>
  );
};

export default ProjectsKanban;
