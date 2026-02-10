import React, { useState, useEffect } from 'react';
import { KanbanBoard } from '../components/KanbanBoard';
import { Project, api } from '../lib/api';

export const ProjectsKanban: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadProjects = async () => {
    try {
      setError(null);
      const data = await api.getProjects();
      setProjects(data);
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
    <div style={{ height: '100%' }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '24px',
        }}
      >
        <div>
          <h1
            style={{
              margin: '0 0 4px 0',
              color: '#f8fafc',
              fontSize: '24px',
              fontWeight: 700,
            }}
          >
            Projects
          </h1>
          <p
            style={{
              margin: 0,
              color: '#94a3b8',
              fontSize: '14px',
            }}
          >
            Manage your projects with drag-and-drop Kanban
          </p>
        </div>
        <button
          onClick={loadProjects}
          style={{
            padding: '8px 16px',
            background: '#334155',
            border: 'none',
            borderRadius: '6px',
            color: '#f8fafc',
            fontSize: '13px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <span>↻</span>
          Refresh
        </button>
      </div>

      <KanbanBoard
        projects={projects}
        loading={loading}
        error={error}
        onProjectsChange={loadProjects}
      />
    </div>
  );
};
