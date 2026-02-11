import React, { useState, useEffect, useMemo } from 'react';
import { api, SyncState } from '../lib/api';
import { Spinner, ErrorState } from '../components/LoadingStates';

interface ManualSection {
  id: string;
  title: string;
  icon: string;
  content: string;
  lastSync: string | null;
  isExpanded: boolean;
}

interface OperationsManualProps {
  compact?: boolean;
}

// Status Eye Component - Command Center Style
const StatusEye: React.FC<{ status: 'fresh' | 'stale' | 'error' | 'unknown' }> = ({ status }) => {
  const getStatusColor = () => {
    switch (status) {
      case 'fresh':
        return { bg: '#10b981', glow: '0 0 12px rgba(16, 185, 129, 0.6)' };
      case 'stale':
        return { bg: '#f59e0b', glow: '0 0 12px rgba(245, 158, 11, 0.6)' };
      case 'error':
        return { bg: '#dc2626', glow: '0 0 12px rgba(220, 38, 38, 0.6)' };
      default:
        return { bg: '#6b7280', glow: 'none' };
    }
  };

  const colors = getStatusColor();

  return (
    <div
      style={{
        width: '12px',
        height: '12px',
        borderRadius: '50%',
        background: colors.bg,
        border: '2px solid #0a0f1a',
        boxShadow: colors.glow,
        position: 'relative',
        flexShrink: 0,
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: '2px',
          left: '2px',
          width: '3px',
          height: '3px',
          borderRadius: '50%',
          background: 'rgba(255, 255, 255, 0.8)',
        }}
      />
    </div>
  );
};

// Simple Markdown Renderer for Dark Theme
function renderMarkdown(content: string): string {
  if (!content) return '';
  
  let html = content
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/^### (.*$)/gim, '<h3 style="color:#f8fafc;font-size:15px;margin:16px 0 8px 0;font-weight:700;text-shadow:0 0 10px rgba(248,250,252,0.1);">$1</h3>')
    .replace(/^## (.*$)/gim, '<h2 style="color:#f8fafc;font-size:17px;margin:20px 0 12px 0;border-bottom:2px solid #991b1b;padding-bottom:6px;font-weight:700;">$1</h2>')
    .replace(/^# (.*$)/gim, '<h1 style="color:#f8fafc;font-size:19px;margin:20px 0 12px 0;font-weight:700;">$1</h1>')
    .replace(/\*\*(.*?)\*\*/g, '<strong style="color:#f8fafc;font-weight:700;">$1</strong>')
    .replace(/\*(.*?)\*/g, '<em style="color:#94a3b8;">$1</em>')
    .replace(/`([^`]+)`/g, '<code style="background:rgba(153,27,27,0.15);padding:3px 8px;border-radius:6px;font-family:monospace;font-size:12px;border:1px solid rgba(153,27,27,0.3);color:#fca5a5;font-weight:600;">$1</code>')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" style="color:#3b82f6;text-decoration:none;font-weight:600;">$1</a>')
    .replace(/^\s*- (.*$)/gim, '<li style="margin:6px 0;margin-left:20px;color:#94a3b8;">$1</li>')
    .replace(/^---$/gim, '<hr style="border:none;border-top:1px solid rgba(255,255,255,0.1);margin:16px 0;">')
    .replace(/^\> (.*$)/gim, '<blockquote style="border-left:3px solid #991b1b;padding-left:12px;margin:12px 0;color:#94a3b8;font-style:italic;background:rgba(15,23,42,0.5);padding:10px;border-radius:0 8px 8px 0;">$1</blockquote>');
  
  html = html.replace(/(<li[^>]*>.*?<\/li>\n?)+/g, '<ul style="margin:8px 0;padding-left:0;list-style:none;">$&</ul>');
  
  const lines = html.split('\n');
  const result: string[] = [];
  let inParagraph = false;
  
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) {
      if (inParagraph) {
        result.push('</p>');
        inParagraph = false;
      }
      continue;
    }
    
    if (trimmed.startsWith('<h') || trimmed.startsWith('<ul') || trimmed.startsWith('<li') || 
        trimmed.startsWith('<blockquote') || trimmed.startsWith('<hr')) {
      if (inParagraph) {
        result.push('</p>');
        inParagraph = false;
      }
      result.push(line);
    } else {
      if (!inParagraph) {
        result.push('<p style="margin:8px 0;color:#94a3b8;font-size:13px;line-height:1.6;">');
        inParagraph = true;
      }
      result.push(line);
    }
  }
  
  if (inParagraph) {
    result.push('</p>');
  }
  
  return result.join('\n');
}

export const OperationsManual: React.FC<OperationsManualProps> = ({ compact = false }) => {
  const [sections, setSections] = useState<ManualSection[]>([
    { id: 'protocols', title: 'Protocols', icon: '⚡', content: '', lastSync: null, isExpanded: false },
    { id: 'processes', title: 'Processes', icon: '🔄', content: '', lastSync: null, isExpanded: false },
    { id: 'features', title: 'Features', icon: '🔧', content: '', lastSync: null, isExpanded: false },
    { id: 'projects', title: 'Project SOPs', icon: '📋', content: '', lastSync: null, isExpanded: false },
  ]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState<SyncState | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const isReadOnly = (id: string) => ['protocols', 'processes', 'features'].includes(id);

  const loadAllSections = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const sectionsToLoad = ['projects', 'protocols', 'processes', 'features'];
      
      for (const sectionId of sectionsToLoad) {
        try {
          const sectionData = await api.getSyncSectionContent(sectionId);
          if (sectionData?.content) {
            setSections(prev => prev.map(s => 
              s.id === sectionId 
                ? { ...s, content: sectionData.content, lastSync: sectionData.last_sync || null } 
                : s
            ));
          }
        } catch (err) {
          console.error(`Failed to load ${sectionId} content:`, err);
        }
      }
      
      const status = await api.getSyncStatus();
      setSyncStatus(status);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load manual');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllSections();
    const pollInterval = setInterval(() => checkForUpdates(), 30000);
    return () => clearInterval(pollInterval);
  }, []);

  const checkForUpdates = async () => {
    try {
      const status = await api.getSyncStatus();
      setSyncStatus(status);
    } catch (error) {
      console.error('Failed to check for updates:', error);
    }
  };

  const handleUniversalUpdate = async () => {
    setIsSyncing(true);
    try {
      await api.triggerUniversalSync();
      await loadAllSections();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sync failed');
    } finally {
      setIsSyncing(false);
    }
  };

  const toggleSection = (id: string) => {
    setSections(prev => prev.map(s => 
      s.id === id ? { ...s, isExpanded: !s.isExpanded } : { ...s, isExpanded: false }
    ));
  };

  const getSectionSyncStatus = (id: string): { status: 'fresh' | 'stale' | 'error' | 'unknown'; label: string } => {
    if (!syncStatus?.sections) return { status: 'unknown', label: 'Unknown' };
    const section = syncStatus.sections.find((s: { section: string }) => s.section === id);
    if (!section) return { status: 'unknown', label: 'Unknown' };
    if (section.status === 'error') return { status: 'error', label: 'Error' };
    if (section.status === 'stale') return { status: 'stale', label: 'Stale' };
    return { status: 'fresh', label: 'Fresh' };
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'fresh': return '#10b981';
      case 'stale': return '#f59e0b';
      case 'error': return '#dc2626';
      default: return '#6b7280';
    }
  };

  const filteredSections = useMemo(() => {
    if (!searchQuery.trim()) return sections;
    const query = searchQuery.toLowerCase();
    return sections.filter(s => 
      s.title.toLowerCase().includes(query) ||
      s.content.toLowerCase().includes(query)
    );
  }, [sections, searchQuery]);

  const expandedCount = sections.filter(s => s.isExpanded).length;

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
        <Spinner size="medium" />
      </div>
    );
  }

  if (error) {
    return <ErrorState message={error} onRetry={loadAllSections} />;
  }

  return (
    <div>
      {/* Search & Sync Controls - Dark Tech Style */}
      <div
        style={{
          display: 'flex',
          gap: '12px',
          marginBottom: '16px',
          flexWrap: 'wrap',
        }}
      >
        {/* Search Input */}
        <div style={{ position: 'relative', flex: 1, minWidth: '200px' }}>
          <span style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#64748b', fontSize: '16px' }}>
            🔍
          </span>
          <input
            type="text"
            placeholder="Search manual..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              background: 'linear-gradient(145deg, rgba(26, 35, 50, 0.8) 0%, rgba(15, 23, 42, 0.6) 100%)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '12px',
              padding: '12px 14px 12px 44px',
              color: '#f8fafc',
              fontSize: '14px',
              fontWeight: 500,
              width: '100%',
              outline: 'none',
              fontFamily: "'Inter', sans-serif",
              transition: 'all 0.2s ease',
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = 'rgba(59, 130, 246, 0.5)';
              e.currentTarget.style.boxShadow = '0 0 20px rgba(59, 130, 246, 0.2)';
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          />
        </div>
        
        {/* Sync Button - Crimson Command Style */}
        <button
          onClick={handleUniversalUpdate}
          disabled={isSyncing}
          style={{
            padding: '12px 20px',
            background: isSyncing 
              ? 'rgba(100, 116, 139, 0.3)' 
              : 'linear-gradient(135deg, #991b1b 0%, #7f1d1d 100%)',
            border: '1px solid rgba(153, 27, 27, 0.4)',
            borderRadius: '12px',
            color: '#f8fafc',
            fontSize: '14px',
            fontWeight: 600,
            cursor: isSyncing ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
            fontFamily: "'Inter', sans-serif",
            boxShadow: isSyncing ? 'none' : '0 4px 20px rgba(153, 27, 27, 0.35)',
          }}
          onMouseEnter={(e) => {
            if (!isSyncing) {
              e.currentTarget.style.transform = 'scale(1.05)';
              e.currentTarget.style.boxShadow = '0 6px 30px rgba(153, 27, 27, 0.5)';
            }
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'scale(1)';
            e.currentTarget.style.boxShadow = isSyncing ? 'none' : '0 4px 20px rgba(153, 27, 27, 0.35)';
          }}
        >
          <span style={{ fontSize: '16px' }}>{isSyncing ? '⏳' : '⟳'}</span>
          <span>{isSyncing ? 'Syncing...' : 'Sync'}</span>
        </button>
      </div>

      {/* Section Grid - Dark Tech Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: compact ? 'repeat(auto-fit, minmax(250px, 1fr))' : '1fr',
          gap: '14px',
        }}
      >
        {filteredSections.map(section => {
          const sync = getSectionSyncStatus(section.id);
          const readOnly = isReadOnly(section.id);
          
          return (
            <div
              key={section.id}
              style={{
                background: 'linear-gradient(145deg, rgba(26, 35, 50, 0.8) 0%, rgba(15, 23, 42, 0.9) 100%)',
                borderRadius: '16px',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                overflow: 'hidden',
                transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'rgba(153, 27, 27, 0.4)';
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 8px 30px rgba(0, 0, 0, 0.4), 0 0 30px rgba(153, 27, 27, 0.15)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)';
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 20px rgba(0, 0, 0, 0.3)';
              }}
            >
              {/* Section Header */}
              <div
                onClick={() => toggleSection(section.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '16px 18px',
                  cursor: 'pointer',
                  background: section.isExpanded ? 'rgba(15, 23, 42, 0.5)' : 'transparent',
                  borderBottom: section.isExpanded ? '1px solid rgba(255, 255, 255, 0.06)' : 'none',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={{ fontSize: '20px' }}>{section.icon}</span>
                  <span
                    style={{
                      color: '#f8fafc',
                      fontWeight: 600,
                      fontSize: '15px',
                      fontFamily: "'Inter', sans-serif",
                    }}
                  >
                    {section.title}
                  </span>
                  {readOnly && (
                    <span
                      style={{
                        fontSize: '11px',
                        padding: '4px 10px',
                        borderRadius: '20px',
                        background: 'rgba(59, 130, 246, 0.15)',
                        color: '#93c5fd',
                        fontWeight: 600,
                        border: '1px solid rgba(59, 130, 246, 0.3)',
                      }}
                    >
                      READ
                    </span>
                  )}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '4px 10px',
                      borderRadius: '20px',
                      background: `${getStatusColor(sync.status)}15`,
                      border: `1px solid ${getStatusColor(sync.status)}40`,
                    }}
                  >
                    <StatusEye status={sync.status} />
                    <span
                      style={{
                        fontSize: '11px',
                        color: getStatusColor(sync.status),
                        fontWeight: 600,
                      }}
                    >
                      {sync.label}
                    </span>
                  </div>
                  <span
                    style={{
                      fontSize: '14px',
                      color: '#64748b',
                      transform: section.isExpanded ? 'rotate(180deg)' : 'none',
                      transition: 'transform 0.2s',
                    }}
                  >
                    ▼
                  </span>
                </div>
              </div>

              {/* Section Content */}
              {section.isExpanded && (
                <div
                  style={{
                    padding: '18px',
                    maxHeight: '400px',
                    overflow: 'auto',
                    background: 'rgba(10, 15, 26, 0.5)',
                  }}
                >
                  {section.content ? (
                    <div
                      dangerouslySetInnerHTML={{ __html: renderMarkdown(section.content) }}
                    />
                  ) : (
                    <p style={{ color: '#64748b', fontStyle: 'italic', fontSize: '13px', fontWeight: 500 }}>
                      No content loaded. Click "Sync" to refresh.
                    </p>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Collapse All Hint */}
      {expandedCount > 0 && (
        <div
          style={{
            textAlign: 'center',
            padding: '16px',
            color: '#64748b',
            fontSize: '13px',
            fontWeight: 500,
            cursor: 'pointer',
          }}
          onClick={() => setSections(prev => prev.map(s => ({ ...s, isExpanded: false })))}
        >
          Click to collapse all sections
        </div>
      )}

      {filteredSections.length === 0 && (
        <div
          style={{
            padding: '24px',
            textAlign: 'center',
            color: '#64748b',
            fontSize: '14px',
            fontWeight: 500,
          }}
        >
          No sections match your search
        </div>
      )}
    </div>
  );
};

export default OperationsManual;
