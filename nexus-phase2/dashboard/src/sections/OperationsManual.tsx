import React, { useState, useEffect, useMemo } from 'react';
import { api, SyncState, SyncResult } from '../lib/api';

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
  className?: string;
}

// ============================================
// Styles
// ============================================

const styles: Record<string, React.CSSProperties> = {
  container: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '24px',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '24px',
    paddingBottom: '16px',
    borderBottom: '1px solid #1e293b',
  },
  title: {
    fontSize: '24px',
    fontWeight: 700,
    color: '#f8fafc',
    margin: 0,
  },
  subtitle: {
    fontSize: '14px',
    color: '#64748b',
    marginTop: '4px',
  },
  actions: {
    display: 'flex',
    gap: '12px',
    alignItems: 'center',
  },
  searchBox: {
    position: 'relative',
  },
  searchInput: {
    background: '#1e293b',
    border: '1px solid #334155',
    borderRadius: '8px',
    padding: '10px 16px 10px 40px',
    color: '#f8fafc',
    fontSize: '14px',
    width: '280px',
    outline: 'none',
    transition: 'border-color 0.2s',
  },
  searchIcon: {
    position: 'absolute',
    left: '12px',
    top: '50%',
    transform: 'translateY(-50%)',
    color: '#64748b',
    fontSize: '16px',
  },
  updateButton: {
    background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
    border: 'none',
    borderRadius: '8px',
    padding: '10px 20px',
    color: '#fff',
    fontSize: '14px',
    fontWeight: 600,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    transition: 'opacity 0.2s, transform 0.1s',
  },
  updateButtonDisabled: {
    opacity: 0.6,
    cursor: 'not-allowed',
  },
  tocCard: {
    background: '#0f172a',
    border: '1px solid #1e293b',
    borderRadius: '12px',
    padding: '20px',
    marginBottom: '24px',
  },
  tocTitle: {
    fontSize: '16px',
    fontWeight: 600,
    color: '#f8fafc',
    marginBottom: '16px',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  tocList: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
    gap: '8px',
  },
  tocItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '8px 12px',
    borderRadius: '6px',
    cursor: 'pointer',
    transition: 'background 0.2s',
    fontSize: '14px',
    color: '#94a3b8',
  },
  tocItemActive: {
    background: '#1e293b',
    color: '#f8fafc',
  },
  sectionCard: {
    background: '#0f172a',
    border: '1px solid #1e293b',
    borderRadius: '12px',
    marginBottom: '16px',
    overflow: 'hidden',
  },
  sectionHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '16px 20px',
    cursor: 'pointer',
    transition: 'background 0.2s',
    borderBottom: '1px solid transparent',
  },
  sectionHeaderExpanded: {
    borderBottom: '1px solid #1e293b',
  },
  sectionTitle: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  sectionIcon: {
    fontSize: '20px',
  },
  sectionName: {
    fontSize: '16px',
    fontWeight: 600,
    color: '#f8fafc',
  },
  sectionMeta: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  syncBadge: {
    fontSize: '12px',
    padding: '4px 10px',
    borderRadius: '12px',
    fontWeight: 500,
  },
  syncBadgeFresh: {
    background: '#064e3b',
    color: '#34d399',
  },
  syncBadgeStale: {
    background: '#451a03',
    color: '#fbbf24',
  },
  syncBadgeError: {
    background: '#450a0a',
    color: '#f87171',
  },
  expandIcon: {
    fontSize: '12px',
    color: '#64748b',
    transition: 'transform 0.2s',
  },
  sectionContent: {
    padding: '20px',
    maxHeight: '600px',
    overflow: 'auto',
  },
  markdownContent: {
    color: '#cbd5e1',
    fontSize: '14px',
    lineHeight: 1.7,
  },
  statusOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(2, 6, 23, 0.8)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  statusCard: {
    background: '#0f172a',
    border: '1px solid #1e293b',
    borderRadius: '12px',
    padding: '24px',
    maxWidth: '500px',
    width: '90%',
  },
  statusTitle: {
    fontSize: '18px',
    fontWeight: 600,
    color: '#f8fafc',
    marginBottom: '16px',
  },
  statusMessage: {
    fontSize: '14px',
    color: '#94a3b8',
    marginBottom: '16px',
  },
  statusDetails: {
    background: '#1e293b',
    borderRadius: '8px',
    padding: '16px',
    marginBottom: '16px',
    fontSize: '13px',
    color: '#cbd5e1',
    fontFamily: 'monospace',
    whiteSpace: 'pre-wrap' as const,
  },
  statusActions: {
    display: 'flex',
    justifyContent: 'flex-end',
  },
  statusButton: {
    background: '#334155',
    border: 'none',
    borderRadius: '6px',
    padding: '8px 16px',
    color: '#f8fafc',
    fontSize: '14px',
    cursor: 'pointer',
  },
};

// ============================================
// Simple Markdown Renderer
// ============================================

function renderMarkdown(content: string): string {
  if (!content) return '';
  
  let html = content
    // Escape HTML
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    // Headers
    .replace(/^### (.*$)/gim, '<h3 style="color:#f8fafc;font-size:18px;margin:20px 0 12px 0;">$1</h3>')
    .replace(/^## (.*$)/gim, '<h2 style="color:#f8fafc;font-size:20px;margin:24px 0 16px 0;border-bottom:1px solid #1e293b;padding-bottom:8px;">$1</h2>')
    .replace(/^# (.*$)/gim, '<h1 style="color:#f8fafc;font-size:24px;margin:24px 0 16px 0;">$1</h1>')
    // Bold
    .replace(/\*\*(.*?)\*\*/g, '<strong style="color:#f8fafc;">$1</strong>')
    // Italic
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    // Code
    .replace(/`([^`]+)`/g, '<code style="background:#1e293b;padding:2px 6px;border-radius:4px;font-family:monospace;font-size:13px;">$1</code>')
    // Links
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" style="color:#60a5fa;text-decoration:none;">$1</a>')
    // Lists
    .replace(/^\s*- (.*$)/gim, '<li style="margin:6px 0;margin-left:20px;">$1</li>')
    // Horizontal rule
    .replace(/^---$/gim, '<hr style="border:none;border-top:1px solid #1e293b;margin:24px 0;">')
    // Blockquotes
    .replace(/^\> (.*$)/gim, '<blockquote style="border-left:3px solid #3b82f6;padding-left:16px;margin:16px 0;color:#94a3b8;">$1</blockquote>')
    // Tables (basic support)
    .replace(/\|(.+)\|/g, (match) => {
      const cells = match.split('|').filter(c => c.trim()).map(c => `<td style="padding:8px 12px;border:1px solid #1e293b;">${c.trim()}</td>`).join('');
      return `<tr>${cells}</tr>`;
    });
  
  // Wrap consecutive list items in ul
  html = html.replace(/(<li[^>]*>.*?<\/li>\n?)+/g, '<ul style="margin:12px 0;padding-left:0;list-style:none;">$&</ul>');
  
  // Convert newlines to paragraphs (but not inside lists, headers, etc.)
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
    
    // Skip if it's a block element
    if (trimmed.startsWith('<h') || trimmed.startsWith('<ul') || trimmed.startsWith('<li') || 
        trimmed.startsWith('<blockquote') || trimmed.startsWith('<hr') || trimmed.startsWith('<tr')) {
      if (inParagraph) {
        result.push('</p>');
        inParagraph = false;
      }
      result.push(line);
    } else {
      if (!inParagraph) {
        result.push('<p style="margin:12px 0;">');
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

export const OperationsManual: React.FC<OperationsManualProps> = ({ className }) => {
  const [sections, setSections] = useState<ManualSection[]>([
    { id: 'protocols', title: 'Protocols', icon: '⚡', content: '', lastSync: null, isExpanded: false },
    { id: 'processes', title: 'Processes', icon: '🔄', content: '', lastSync: null, isExpanded: false },
    { id: 'features', title: 'Features', icon: '🔧', content: '', lastSync: null, isExpanded: false },
    { id: 'projects', title: 'Project SOPs', icon: '📋', content: '', lastSync: null, isExpanded: true },
  ]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState<SyncState | null>(null);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [syncResult, setSyncResult] = useState<SyncResult | null>(null);

  // Load initial content
  useEffect(() => {
    loadAllSections();
    loadSyncStatus();
  }, []);

  const loadSyncStatus = async () => {
    try {
      const status = await api.getSyncStatus();
      setSyncStatus(status);
    } catch (error) {
      console.error('Failed to load sync status:', error);
    }
  };

  const loadAllSections = async () => {
    // Load projects content from API
    try {
      const projectsData = await api.getSyncSectionContent('projects');
      if (projectsData?.content) {
        updateSectionContent('projects', projectsData.content, projectsData.last_sync);
      }
    } catch (error) {
      console.error('Failed to load projects content:', error);
    }
  };

  const updateSectionContent = (id: string, content: string, lastSync: string | null) => {
    setSections(prev => prev.map(s => 
      s.id === id ? { ...s, content, lastSync } : s
    ));
  };

  const handleUniversalUpdate = async () => {
    setIsSyncing(true);
    setShowStatusModal(true);
    setSyncResult(null);

    try {
      const result = await api.triggerUniversalSync();
      setSyncResult(result);
      
      // Reload content
      await loadAllSections();
      await loadSyncStatus();
    } catch (error) {
      setSyncResult({
        success: false,
        error: error instanceof Error ? error.message : 'Sync failed',
        timestamp: new Date().toISOString(),
      });
    } finally {
      setIsSyncing(false);
    }
  };

  const toggleSection = (id: string) => {
    setSections(prev => prev.map(s => 
      s.id === id ? { ...s, isExpanded: !s.isExpanded } : s
    ));
  };

  const expandAll = () => {
    setSections(prev => prev.map(s => ({ ...s, isExpanded: true })));
  };

  const collapseAll = () => {
    setSections(prev => prev.map(s => ({ ...s, isExpanded: false })));
  };

  // Filter sections based on search
  const filteredSections = useMemo(() => {
    if (!searchQuery.trim()) return sections;
    
    const query = searchQuery.toLowerCase();
    return sections.filter(s => 
      s.title.toLowerCase().includes(query) ||
      s.content.toLowerCase().includes(query)
    );
  }, [sections, searchQuery]);

  // Get sync status for a section
  const getSectionSyncStatus = (id: string): { status: 'fresh' | 'stale' | 'error' | 'unknown'; label: string } => {
    if (!syncStatus?.sections) return { status: 'unknown', label: 'Unknown' };
    
    const section = syncStatus.sections.find((s: { section: string }) => s.section === id);
    if (!section) return { status: 'unknown', label: 'Unknown' };
    
    if (section.status === 'error') return { status: 'error', label: 'Error' };
    if (section.status === 'stale') return { status: 'stale', label: 'Stale' };
    return { status: 'fresh', label: 'Fresh' };
  };

  const syncBadgeStyle = (status: string): React.CSSProperties => {
    switch (status) {
      case 'fresh': return { ...styles.syncBadge, ...styles.syncBadgeFresh };
      case 'stale': return { ...styles.syncBadge, ...styles.syncBadgeStale };
      case 'error': return { ...styles.syncBadge, ...styles.syncBadgeError };
      default: return styles.syncBadge;
    }
  };

  return (
    <div style={styles.container} className={className}>
      {/* Header */}
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Operations Manual</h1>
          <p style={styles.subtitle}>Source of truth for protocols, processes, and features</p>
        </div>
        <div style={styles.actions}>
          <div style={styles.searchBox}>
            <span style={styles.searchIcon}>🔍</span>
            <input
              type="text"
              placeholder="Search manual..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={styles.searchInput}
            />
          </div>
          <button
            onClick={handleUniversalUpdate}
            disabled={isSyncing}
            style={{
              ...styles.updateButton,
              ...(isSyncing ? styles.updateButtonDisabled : {}),
            }}
          >
            {isSyncing ? '🔄' : '⚡'} 
            {isSyncing ? 'Syncing...' : 'Universal Update'}
          </button>
        </div>
      </div>

      {/* Table of Contents */}
      <div style={styles.tocCard}>
        <div style={styles.tocTitle}>
          📑 Table of Contents
          <span style={{ marginLeft: 'auto', display: 'flex', gap: '8px' }}>
            <button onClick={expandAll} style={{ ...styles.statusButton, fontSize: '12px' }}>
              Expand All
            </button>
            <button onClick={collapseAll} style={{ ...styles.statusButton, fontSize: '12px' }}>
              Collapse All
            </button>
          </span>
        </div>
        <div style={styles.tocList}>
          {sections.map(section => {
            const sync = getSectionSyncStatus(section.id);
            return (
              <div
                key={section.id}
                onClick={() => toggleSection(section.id)}
                style={{
                  ...styles.tocItem,
                  ...(section.isExpanded ? styles.tocItemActive : {}),
                }}
              >
                <span>{section.icon}</span>
                <span>{section.title}</span>
                <span style={{ 
                  ...syncBadgeStyle(sync.status), 
                  marginLeft: 'auto',
                  fontSize: '10px',
                  padding: '2px 6px',
                }}>
                  {sync.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Sections */}
      {filteredSections.map(section => {
        const sync = getSectionSyncStatus(section.id);
        return (
          <div key={section.id} style={styles.sectionCard}>
            <div
              onClick={() => toggleSection(section.id)}
              style={{
                ...styles.sectionHeader,
                ...(section.isExpanded ? styles.sectionHeaderExpanded : {}),
              }}
            >
              <div style={styles.sectionTitle}>
                <span style={styles.sectionIcon}>{section.icon}</span>
                <span style={styles.sectionName}>{section.title}</span>
              </div>
              <div style={styles.sectionMeta}>
                <span style={syncBadgeStyle(sync.status)}>
                  {sync.label}
                </span>
                <span style={{ 
                  ...styles.expandIcon, 
                  transform: section.isExpanded ? 'rotate(180deg)' : 'none',
                }}>
                  ▼
                </span>
              </div>
            </div>
            {section.isExpanded && (
              <div style={styles.sectionContent}>
                {section.content ? (
                  <div
                    style={styles.markdownContent}
                    dangerouslySetInnerHTML={{ __html: renderMarkdown(section.content) }}
                  />
                ) : (
                  <p style={{ color: '#64748b', fontStyle: 'italic' }}>
                    No content loaded. Click "Universal Update" to sync.
                  </p>
                )}
              </div>
            )}
          </div>
        );
      })}

      {/* Status Modal */}
      {showStatusModal && (
        <div style={styles.statusOverlay} onClick={() => setShowStatusModal(false)}>
          <div style={styles.statusCard} onClick={(e) => e.stopPropagation()}>
            <h3 style={styles.statusTitle}>
              {isSyncing ? '🔄 Sync in Progress' : syncResult?.success ? '✅ Sync Complete' : '❌ Sync Failed'}
            </h3>
            
            {isSyncing ? (
              <p style={styles.statusMessage}>Synchronizing all Operations Manual sections...</p>
            ) : syncResult ? (
              <>
                <p style={styles.statusMessage}>
                  {syncResult.success 
                    ? 'All sections have been synchronized successfully.'
                    : `Error: ${syncResult.error || 'Unknown error'}`}
                </p>
                {syncResult.results && (
                  <div style={styles.statusDetails}>
                    {JSON.stringify(syncResult.results, null, 2)}
                  </div>
                )}
              </>
            ) : null}
            
            <div style={styles.statusActions}>
              <button 
                onClick={() => setShowStatusModal(false)}
                style={{
                  ...styles.statusButton,
                  background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
                }}
              >
                {isSyncing ? 'Running...' : 'Close'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
