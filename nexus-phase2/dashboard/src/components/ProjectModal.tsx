import React, { useState, useEffect } from 'react';
import { Project, CreateProjectRequest, UpdateProjectRequest } from '../lib/api';

interface ProjectModalProps {
  isOpen: boolean;
  project?: Project | null;
  defaultStatus?: 'backlog' | 'in_progress' | 'done' | 'archived';
  onClose: () => void;
  onSave: (data: CreateProjectRequest | UpdateProjectRequest) => void;
}

export const ProjectModal: React.FC<ProjectModalProps> = ({
  isOpen,
  project,
  defaultStatus = 'backlog',
  onClose,
  onSave,
}) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<'backlog' | 'in_progress' | 'done' | 'archived'>(defaultStatus);
  const [priority, setPriority] = useState<'high' | 'medium' | 'low'>('medium');
  const [errors, setErrors] = useState<{ name?: string }>({});

  const isEditing = !!project;

  useEffect(() => {
    if (project) {
      setName(project.name);
      setDescription(project.description || '');
      setStatus(project.status);
      setPriority(project.priority);
    } else {
      setName('');
      setDescription('');
      setStatus(defaultStatus);
      setPriority('medium');
    }
    setErrors({});
  }, [project, defaultStatus, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      setErrors({ name: 'Project name is required' });
      return;
    }

    const data: CreateProjectRequest | UpdateProjectRequest = {
      name: name.trim(),
      description: description.trim() || undefined,
      status,
      priority,
    };

    onSave(data);
  };

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0, 0, 0, 0.7)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: '#1e293b',
          borderRadius: '12px',
          padding: '24px',
          width: '100%',
          maxWidth: '480px',
          border: '1px solid #334155',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2
          style={{
            margin: '0 0 20px 0',
            color: '#f8fafc',
            fontSize: '18px',
            fontWeight: 600,
          }}
        >
          {isEditing ? 'Edit Project' : 'New Project'}
        </h2>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '16px' }}>
            <label
              style={{
                display: 'block',
                marginBottom: '6px',
                color: '#94a3b8',
                fontSize: '12px',
                fontWeight: 500,
              }}
            >
              Project Name *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter project name"
              style={{
                width: '100%',
                padding: '10px 12px',
                background: '#0f172a',
                border: `1px solid ${errors.name ? '#ef4444' : '#334155'}`,
                borderRadius: '6px',
                color: '#f8fafc',
                fontSize: '14px',
                boxSizing: 'border-box',
              }}
            />
            {errors.name && (
              <span style={{ color: '#ef4444', fontSize: '11px', marginTop: '4px', display: 'block' }}>
                {errors.name}
              </span>
            )}
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label
              style={{
                display: 'block',
                marginBottom: '6px',
                color: '#94a3b8',
                fontSize: '12px',
                fontWeight: 500,
              }}
            >
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter project description (optional)"
              rows={3}
              style={{
                width: '100%',
                padding: '10px 12px',
                background: '#0f172a',
                border: '1px solid #334155',
                borderRadius: '6px',
                color: '#f8fafc',
                fontSize: '14px',
                resize: 'vertical',
                boxSizing: 'border-box',
                fontFamily: 'inherit',
              }}
            />
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label
              style={{
                display: 'block',
                marginBottom: '6px',
                color: '#94a3b8',
                fontSize: '12px',
                fontWeight: 500,
              }}
            >
              Status
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as any)}
              style={{
                width: '100%',
                padding: '10px 12px',
                background: '#0f172a',
                border: '1px solid #334155',
                borderRadius: '6px',
                color: '#f8fafc',
                fontSize: '14px',
                cursor: 'pointer',
                boxSizing: 'border-box',
              }}
            >
              <option value="backlog">Backlog</option>
              <option value="in_progress">In Progress</option>
              <option value="done">Done</option>
              <option value="archived">Archived</option>
            </select>
          </div>

          <div style={{ marginBottom: '24px' }}>
            <label
              style={{
                display: 'block',
                marginBottom: '6px',
                color: '#94a3b8',
                fontSize: '12px',
                fontWeight: 500,
              }}
            >
              Priority
            </label>
            <div style={{ display: 'flex', gap: '8px' }}>
              {(['low', 'medium', 'high'] as const).map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPriority(p)}
                  style={{
                    flex: 1,
                    padding: '8px 12px',
                    border: `1px solid ${priority === p ? {
                      low: '#10b981',
                      medium: '#f59e0b',
                      high: '#ef4444',
                    }[p] : '#334155'}`,
                    borderRadius: '6px',
                    background: priority === p ? {
                      low: 'rgba(16, 185, 129, 0.2)',
                      medium: 'rgba(245, 158, 11, 0.2)',
                      high: 'rgba(239, 68, 68, 0.2)',
                    }[p] : 'transparent',
                    color: priority === p ? {
                      low: '#10b981',
                      medium: '#f59e0b',
                      high: '#ef4444',
                    }[p] : '#94a3b8',
                    fontSize: '12px',
                    fontWeight: 500,
                    cursor: 'pointer',
                    textTransform: 'capitalize',
                  }}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '10px 16px',
                background: 'transparent',
                border: '1px solid #334155',
                borderRadius: '6px',
                color: '#94a3b8',
                fontSize: '13px',
                cursor: 'pointer',
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              style={{
                padding: '10px 16px',
                background: '#3b82f6',
                border: 'none',
                borderRadius: '6px',
                color: 'white',
                fontSize: '13px',
                fontWeight: 500,
                cursor: 'pointer',
              }}
            >
              {isEditing ? 'Save Changes' : 'Create Project'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
