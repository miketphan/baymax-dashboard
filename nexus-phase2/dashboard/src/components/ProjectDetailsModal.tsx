import React, { useState, useEffect } from 'react';
import { Project, api } from '../lib/api';

interface ProjectDetailsModalProps {
  project: Project | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (project: Project) => void;
}

interface ActivityItem {
  id: number;
  action: string;
  field?: string;
  old_value?: string;
  new_value?: string;
  created_at: string;
}

export const ProjectDetailsModal: React.FC<ProjectDetailsModalProps> = ({
  project,
  isOpen,
  onClose,
  onSave,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [activity, setActivity] = useState<ActivityItem[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<Project['status']>('backlog');
  const [priority, setPriority] = useState<Project['priority']>('medium');

  // Load project data and activity
  useEffect(() => {
    if (project && isOpen) {
      setTitle(project.title);
      setDescription(project.description || '');
      setStatus(project.status);
      setPriority(project.priority);
      setIsEditing(false);
      setError(null);
      loadActivity(project.id);
    }
  }, [project, isOpen]);

  const loadActivity = async (_projectId: string) => {
    try {
      // This will be implemented once we have the activity log endpoint
      // For now, show placeholder activity based on project data
      const mockActivity: ActivityItem[] = [
        {
          id: 1,
          action: 'created',
          created_at: project?.created_at || new Date().toISOString(),
        },
      ];
      if (project?.updated_at !== project?.created_at) {
        mockActivity.push({
          id: 2,
          action: 'updated',
          created_at: project?.updated_at || new Date().toISOString(),
        });
      }
      setActivity(mockActivity);
    } catch (err) {
      console.error('Failed to load activity:', err);
    }
  };

  const handleSave = async () => {
    if (!project) return;
    
    if (!title.trim()) {
      setError('Title is required');
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      const updates = {
        title: title.trim(),
        description: description.trim() || undefined,
        status,
        priority,
      };

      const updated = await api.updateProject(project.id, updates);
      onSave(updated);
      setIsEditing(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setIsSaving(false);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatRelativeTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (minutes < 1) return 'just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 30) return `${days}d ago`;
    return formatDate(dateStr);
  };

  const getActivityIcon = (action: string) => {
    switch (action) {
      case 'created': return '🆕';
      case 'updated': return '✏️';
      case 'deleted': return '🗑️';
      case 'status_changed': return '📋';
      case 'priority_changed': return '⚡';
      default: return '📝';
    }
  };

  const getActivityText = (item: ActivityItem) => {
    switch (item.action) {
      case 'created': return 'Project created';
      case 'updated': return item.field 
        ? `Updated ${item.field}` 
        : 'Project updated';
      case 'deleted': return 'Project deleted';
      case 'status_changed': 
        return item.old_value && item.new_value
          ? `Status changed from "${item.old_value}" to "${item.new_value}"`
          : 'Status changed';
      case 'priority_changed':
        return item.old_value && item.new_value
          ? `Priority changed from "${item.old_value}" to "${item.new_value}"`
          : 'Priority changed';
      default: return 'Activity recorded';
    }
  };

  const priorityColors = {
    high: '#ef4444',
    medium: '#f59e0b',
    low: '#10b981',
  };

  const statusLabels = {
    backlog: 'Backlog',
    in_progress: 'In Progress',
    done: 'Done',
    archived: 'Archived',
  };

  const statusColors = {
    backlog: '#64748b',
    in_progress: '#3b82f6',
    done: '#10b981',
    archived: '#475569',
  };

  // Keyboard shortcuts
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (isEditing) {
          setIsEditing(false);
          // Reset form
          if (project) {
            setTitle(project.title);
            setDescription(project.description || '');
            setStatus(project.status);
            setPriority(project.priority);
          }
        } else {
          onClose();
        }
      }
      if (e.key === 'e' && !isEditing && e.ctrlKey) {
        e.preventDefault();
        setIsEditing(true);
      }
      if (e.key === 's' && isEditing && e.ctrlKey) {
        e.preventDefault();
        handleSave();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isEditing, project, title, description, status, priority]);

  if (!isOpen || !project) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0, 0, 0, 0.8)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '20px',
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: '#1e293b',
          borderRadius: '12px',
          width: '100%',
          maxWidth: '700px',
          maxHeight: '90vh',
          border: '1px solid #334155',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: '20px 24px',
            borderBottom: '1px solid #334155',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
          }}
        >
          <div style={{ flex: 1 }}>
            {isEditing ? (
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  background: '#0f172a',
                  border: `1px solid ${error ? '#ef4444' : '#334155'}`,
                  borderRadius: '6px',
                  color: '#f8fafc',
                  fontSize: '18px',
                  fontWeight: 600,
                  boxSizing: 'border-box',
                }}
                placeholder="Project title"
              />
            ) : (
              <h2
                style={{
                  margin: '0 0 8px 0',
                  color: '#f8fafc',
                  fontSize: '20px',
                  fontWeight: 600,
                }}
              >
                {project.title}
              </h2>
            )}
            {error && (
              <span style={{ color: '#ef4444', fontSize: '12px' }}>{error}</span>
            )}
            
            {/* Metadata badges */}
            <div style={{ display: 'flex', gap: '8px', marginTop: '12px', flexWrap: 'wrap' }}>
              {isEditing ? (
                <>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as Project['status'])}
                    style={{
                      padding: '4px 8px',
                      background: '#0f172a',
                      border: '1px solid #334155',
                      borderRadius: '4px',
                      color: '#f8fafc',
                      fontSize: '12px',
                    }}
                  >
                    <option value="backlog">Backlog</option>
                    <option value="in_progress">In Progress</option>
                    <option value="done">Done</option>
                    <option value="archived">Archived</option>
                  </select>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as Project['priority'])}
                    style={{
                      padding: '4px 8px',
                      background: '#0f172a',
                      border: '1px solid #334155',
                      borderRadius: '4px',
                      color: '#f8fafc',
                      fontSize: '12px',
                    }}
                  >
                    <option value="low">Low Priority</option>
                    <option value="medium">Medium Priority</option>
                    <option value="high">High Priority</option>
                  </select>
                </>
              ) : (
                <>
                  <span
                    style={{
                      padding: '4px 10px',
                      background: `${statusColors[project.status]}20`,
                      color: statusColors[project.status],
                      borderRadius: '4px',
                      fontSize: '12px',
                      fontWeight: 500,
                      textTransform: 'capitalize',
                    }}
                  >
                    {statusLabels[project.status]}
                  </span>
                  <span
                    style={{
                      padding: '4px 10px',
                      background: `${priorityColors[project.priority]}20`,
                      color: priorityColors[project.priority],
                      borderRadius: '4px',
                      fontSize: '12px',
                      fontWeight: 500,
                      textTransform: 'capitalize',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                  >
                    <span
                      style={{
                        width: '6px',
                        height: '6px',
                        borderRadius: '50%',
                        background: priorityColors[project.priority],
                      }}
                    />
                    {project.priority} Priority
                  </span>
                </>
              )}
            </div>
          </div>
          
          <div style={{ display: 'flex', gap: '8px' }}>
            {isEditing ? (
              <>
                <button
                  onClick={() => {
                    setIsEditing(false);
                    if (project) {
                      setTitle(project.title);
                      setDescription(project.description || '');
                      setStatus(project.status);
                      setPriority(project.priority);
                    }
                    setError(null);
                  }}
                  style={{
                    padding: '8px 16px',
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
                  onClick={handleSave}
                  disabled={isSaving}
                  style={{
                    padding: '8px 16px',
                    background: isSaving ? '#475569' : '#3b82f6',
                    border: 'none',
                    borderRadius: '6px',
                    color: 'white',
                    fontSize: '13px',
                    cursor: isSaving ? 'not-allowed' : 'pointer',
                    fontWeight: 500,
                  }}
                >
                  {isSaving ? 'Saving...' : 'Save Changes'}
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => setIsEditing(true)}
                  style={{
                    padding: '8px 16px',
                    background: '#3b82f6',
                    border: 'none',
                    borderRadius: '6px',
                    color: 'white',
                    fontSize: '13px',
                    cursor: 'pointer',
                    fontWeight: 500,
                  }}
                >
                  ✏️ Edit
                </button>
                <button
                  onClick={onClose}
                  style={{
                    padding: '8px',
                    background: 'transparent',
                    border: 'none',
                    color: '#94a3b8',
                    fontSize: '18px',
                    cursor: 'pointer',
                    lineHeight: 1,
                  }}
                >
                  ✕
                </button>
              </>
            )}
          </div>
        </div>

        {/* Content */}
        <div
          style={{
            padding: '24px',
            overflowY: 'auto',
            flex: 1,
          }}
        >
          {/* Description Section */}
          <div style={{ marginBottom: '32px' }}>
            <h3
              style={{
                margin: '0 0 12px 0',
                color: '#94a3b8',
                fontSize: '12px',
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
              }}
            >
              Description
            </h3>
            {isEditing ? (
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Add a description..."
                rows={5}
                style={{
                  width: '100%',
                  padding: '12px',
                  background: '#0f172a',
                  border: '1px solid #334155',
                  borderRadius: '6px',
                  color: '#f8fafc',
                  fontSize: '14px',
                  lineHeight: '1.6',
                  resize: 'vertical',
                  minHeight: '100px',
                  boxSizing: 'border-box',
                  fontFamily: 'inherit',
                }}
              />
            ) : (
              <p
                style={{
                  margin: 0,
                  color: project.description ? '#e2e8f0' : '#64748b',
                  fontSize: '14px',
                  lineHeight: '1.6',
                  whiteSpace: 'pre-wrap',
                }}
              >
                {project.description || 'No description provided.'}
              </p>
            )}
          </div>

          {/* Metadata Section */}
          <div style={{ marginBottom: '32px' }}>
            <h3
              style={{
                margin: '0 0 12px 0',
                color: '#94a3b8',
                fontSize: '12px',
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
              }}
            >
              Details
            </h3>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '16px',
              }}
            >
              <div
                style={{
                  background: '#0f172a',
                  padding: '12px',
                  borderRadius: '6px',
                  border: '1px solid #334155',
                }}
              >
                <span
                  style={{
                    display: 'block',
                    color: '#64748b',
                    fontSize: '11px',
                    marginBottom: '4px',
                  }}
                >
                  Created
                </span>
                <span style={{ color: '#e2e8f0', fontSize: '13px' }}>
                  {formatDate(project.created_at)}
                </span>
              </div>
              <div
                style={{
                  background: '#0f172a',
                  padding: '12px',
                  borderRadius: '6px',
                  border: '1px solid #334155',
                }}
              >
                <span
                  style={{
                    display: 'block',
                    color: '#64748b',
                    fontSize: '11px',
                    marginBottom: '4px',
                  }}
                >
                  Last Updated
                </span>
                <span style={{ color: '#e2e8f0', fontSize: '13px' }}>
                  {formatRelativeTime(project.updated_at)}
                </span>
              </div>
              <div
                style={{
                  background: '#0f172a',
                  padding: '12px',
                  borderRadius: '6px',
                  border: '1px solid #334155',
                }}
              >
                <span
                  style={{
                    display: 'block',
                    color: '#64748b',
                    fontSize: '11px',
                    marginBottom: '4px',
                  }}
                >
                  Project ID
                </span>
                <span
                  style={{
                    color: '#e2e8f0',
                    fontSize: '13px',
                    fontFamily: 'monospace',
                  }}
                >
                  {project.id}
                </span>
              </div>
            </div>
          </div>

          {/* Activity Log Section */}
          <div>
            <h3
              style={{
                margin: '0 0 12px 0',
                color: '#94a3b8',
                fontSize: '12px',
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
              }}
            >
              Activity Log
            </h3>
            <div
              style={{
                background: '#0f172a',
                borderRadius: '6px',
                border: '1px solid #334155',
                maxHeight: '200px',
                overflowY: 'auto',
              }}
            >
              {activity.length === 0 ? (
                <p
                  style={{
                    padding: '16px',
                    color: '#64748b',
                    fontSize: '13px',
                    textAlign: 'center',
                    margin: 0,
                  }}
                >
                  No activity recorded yet.
                </p>
              ) : (
                <div style={{ padding: '8px' }}>
                  {activity.map((item) => (
                    <div
                      key={item.id}
                      style={{
                        display: 'flex',
                        gap: '12px',
                        padding: '10px',
                        borderRadius: '4px',
                        background: '#0f172a',
                      }}
                    >
                      <span style={{ fontSize: '16px' }}>{getActivityIcon(item.action)}</span>
                      <div style={{ flex: 1 }}>
                        <p
                          style={{
                            margin: '0 0 4px 0',
                            color: '#e2e8f0',
                            fontSize: '13px',
                          }}
                        >
                          {getActivityText(item)}
                        </p>
                        <span style={{ color: '#64748b', fontSize: '11px' }}>
                          {formatRelativeTime(item.created_at)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer with keyboard hints */}
        <div
          style={{
            padding: '12px 24px',
            borderTop: '1px solid #334155',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div style={{ display: 'flex', gap: '16px' }}>
            <span style={{ color: '#64748b', fontSize: '11px' }}>
              <kbd
                style={{
                  background: '#334155',
                  padding: '2px 6px',
                  borderRadius: '3px',
                  fontFamily: 'monospace',
                }}
              >
                Esc
              </kbd>{' '}
              to close
            </span>
            {!isEditing && (
              <span style={{ color: '#64748b', fontSize: '11px' }}>
                <kbd
                  style={{
                    background: '#334155',
                    padding: '2px 6px',
                    borderRadius: '3px',
                    fontFamily: 'monospace',
                  }}
                >
                  Ctrl+E
                </kbd>{' '}
                to edit
              </span>
            )}
            {isEditing && (
              <span style={{ color: '#64748b', fontSize: '11px' }}>
                <kbd
                  style={{
                    background: '#334155',
                    padding: '2px 6px',
                    borderRadius: '3px',
                    fontFamily: 'monospace',
                  }}
                >
                  Ctrl+S
                </kbd>{' '}
                to save
              </span>
            )}
          </div>
          <span style={{ color: '#64748b', fontSize: '11px' }}>
            ID: {project.id}
          </span>
        </div>
      </div>
    </div>
  );
};
