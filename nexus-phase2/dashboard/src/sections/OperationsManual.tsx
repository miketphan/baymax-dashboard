import React, { useState, useEffect, useMemo } from 'react';
import { api, SyncState } from '../lib/api';
import { Spinner, ErrorState } from '../components/LoadingStates';

// ============================================
// Types
// ============================================

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

// ============================================
// Simple Markdown Renderer
// ============================================

function renderMarkdown(content: string): string {
  if (!content) return '';
  
  let html = content
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/^### (.*$)/gim, '<h3 style="color:#f8fafc;font-size:16px;margin:16px 0 8px 0;">$1</h3>')
    .replace(/^## (.*$)/gim, '<h2 style="color:#f8fafc;font-size:18px;margin:20px 0 12px 0;border-bottom:1px solid #1e293b;padding-bottom:6px;">$1</h2>')
    .replace(/^# (.*$)/gim, '<h1 style="color:#f8fafc;font-size:20px;margin:20px 0 12px 0;">$1</h1>')
    .replace(/\*\*(.*?)\*\*/g, '<strong style="color:#f8fafc;">$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/`([^`]+)`/g, '<code style="background:#1e293b;padding:2px 6px;border-radius:4px;font-family:monospace;font-size:12px;">$1</code>')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" style="color:#60a5fa;text-decoration:none;">$1</a>')
    .replace(/^\s*- (.*$)/gim, '<li style="margin:4px 0;margin-left:16px;">$1</li>')
    .replace(/^---$/gim, '<hr style="border:none;border-top:1px solid #1e293b;margin:16px 0;">')
    .replace(/^\> (.*$)/gim, '<blockquote style="border-left:3px solid #3b82f6;padding-left:12px;margin:12px 0;color:#94a3b8;">$1</blockquote>');
  
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
        result.push('<p style="margin:8px 0;color:#cbd5e1;font-size:13px;line-height:1.6;">');
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

// ============================================
// Component
// ============================================

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
      
      // Load sync status
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
    
    // Set up polling for auto-refresh (every 30 seconds)
    const pollInterval = setInterval(() => {
      checkForUpdates();
    }, 30000);
    
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
      case 'error': return '#ef4444';
      default: return '#64748b';
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
      {/* Compact Controls */}
      <div
        style={{
          display: 'flex',
          gap: '12px',
          marginBottom: '16px',
          flexWrap: 'wrap',
        }}
      >
        <div style={{ position: 'relative', flex: 1, minWidth: '200px' }}>
          <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }}>
            🔍
          </span>
          <input
            type="text"
            placeholder="Search manual..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              background: '#1e293b',
              border: '1px solid #334155',
              borderRadius: '8px',
              padding: '8px 12px 8px 40px',
              color: '#f8fafc',
              fontSize: '13px',
              width: '100%',
              outline: 'none',
            }}
          />
        </div>
        <button
          onClick={handleUniversalUpdate}
          disabled={isSyncing}
          style={{
            padding: '8px 16px',
            background: isSyncing ? '#1e293b' : 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
            border: 'none',
            borderRadius: '8px',
            color: '#fff',
            fontSize: '13px',
            fontWeight: 500,
            cursor: isSyncing ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            opacity: isSyncing ? 0.6 : 1,
          }}
        >
          {isSyncing ? '🔄' : '⚡'} {isSyncing ? 'Syncing...' : 'Sync'}
        </button>
      </div>

      {/* Section Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: compact ? 'repeat(auto-fit, minmax(250px, 1fr))' : '1fr',
          gap: '12px',
        }}
      >
        {filteredSections.map(section => {
          const sync = getSectionSyncStatus(section.id);
          const readOnly = isReadOnly(section.id);
          
          return (
            <div
              key={section.id}
              style={{
                background: '#1e293b',
                borderRadius: '12px',
                border: '1px solid #334155',
                overflow: 'hidden',
                transition: 'all 0.2s',
              }}
            >
              {/* Section Header */}
              <div
                onClick={() => toggleSection(section.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px 16px',
                  cursor: 'pointer',
                  background: section.isExpanded ? '#252f47' : 'transparent',
                  borderBottom: section.isExpanded ? '1px solid #334155' : 'none',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ fontSize: '16px' }}>{section.icon}</span>
                  <span
                    style={{
                      color: '#f8fafc',
                      fontWeight: 600,
                      fontSize: '14px',
                    }}
                  >
                    {section.title}
                  </span>
                  {readOnly && (
                    <span
                      style={{
                        fontSize: '10px',
                        padding: '2px 6px',
                        borderRadius: '4px',
                        background: '#0f172a',
                        color: '#64748b',
                      }}
                    >
                      📖
                    </span>
                  )}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span
                    style={{
                      fontSize: '10px',
                      padding: '2px 8px',
                      borderRadius: '10px',
                      background: `${getStatusColor(sync.status)}20`,
                      color: getStatusColor(sync.status),
                      fontWeight: 500,
                    }}
                  >
                    {sync.label}
                  </span>
                  <span
                    style={{
                      fontSize: '12px',
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
                    padding: '16px',
                    maxHeight: '400px',
                    overflow: 'auto',
                  }}
                >
                  {section.content ? (
                    <div
                      dangerouslySetInnerHTML={{ __html: renderMarkdown(section.content) }}
                    />
                  ) : (
                    <p style={{ color: '#64748b', fontStyle: 'italic', fontSize: '13px' }}>
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
            padding: '12px',
            color: '#64748b',
            fontSize: '12px',
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
            fontSize: '13px',
          }}
        >
          No sections match your search
        </div>
      )}
    </div>
  );
};

export default OperationsManual;
