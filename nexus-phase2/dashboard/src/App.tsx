import React, { useState, useEffect, useCallback, useRef } from 'react';
import { ProjectsKanban } from './sections/ProjectsKanban';
import { ConnectedServices } from './sections/ConnectedServices';
import { UsageLimits } from './sections/UsageLimits';
import { OperationsManual } from './sections/OperationsManual';
import { api } from './lib/api';

// ============================================
// Types
// ============================================

interface SectionState {
  lastRefresh: Date | null;
  isLoading: boolean;
  error: string | null;
  status: 'fresh' | 'stale' | 'error' | 'idle';
}

interface DashboardState {
  projects: SectionState;
  services: SectionState;
  usage: SectionState;
  manual: SectionState;
}

// ============================================
// Constants
// ============================================

const STALE_AFTER_MS = 5 * 60 * 1000; // 5 minutes

// ============================================
// Helper Functions
// ============================================

const getStatusColor = (status: SectionState['status']): string => {
  switch (status) {
    case 'fresh': return '#10b981';
    case 'stale': return '#f59e0b';
    case 'error': return '#ef4444';
    default: return '#64748b';
  }
};

const getStatusDot = (status: SectionState['status']): string => {
  switch (status) {
    case 'fresh': return '🟢';
    case 'stale': return '🟡';
    case 'error': return '🔴';
    default: return '⚪';
  }
};

// ============================================
// Section Header Component
// ============================================

interface SectionHeaderProps {
  icon: string;
  title: string;
  state: SectionState;
  onRefresh?: () => void;
}

const SectionHeader: React.FC<SectionHeaderProps> = ({ icon, title, state, onRefresh }) => (
  <div
    style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: '16px',
      paddingBottom: '12px',
      borderBottom: '1px solid #1e293b',
    }}
  >
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
      <span style={{ fontSize: '18px' }}>{icon}</span>
      <h2
        style={{
          margin: 0,
          fontSize: '16px',
          fontWeight: 600,
          color: '#f8fafc',
        }}
      >
        {title}
      </h2>
      <div
        style={{
          width: '8px',
          height: '8px',
          borderRadius: '50%',
          background: getStatusColor(state.status),
          boxShadow: `0 0 8px ${getStatusColor(state.status)}`,
          transition: 'all 0.3s ease',
        }}
        title={`Status: ${state.status}`}
      />
    </div>
    {onRefresh && (
      <button
        onClick={onRefresh}
        disabled={state.isLoading}
        style={{
          padding: '6px 12px',
          background: 'transparent',
          border: '1px solid #334155',
          borderRadius: '6px',
          color: '#94a3b8',
          fontSize: '12px',
          cursor: state.isLoading ? 'not-allowed' : 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          opacity: state.isLoading ? 0.5 : 1,
          transition: 'all 0.2s',
        }}
        onMouseEnter={(e) => {
          if (!state.isLoading) {
            e.currentTarget.style.borderColor = '#3b82f6';
            e.currentTarget.style.color = '#f8fafc';
          }
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = '#334155';
          e.currentTarget.style.color = '#94a3b8';
        }}
      >
        {state.isLoading ? (
          <>
            <span style={{ animation: 'spin 1s linear infinite' }}>↻</span>
            <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
          </>
        ) : (
          <span>↻</span>
        )}
      </button>
    )}
  </div>
);

// ============================================
// Main App Component
// ============================================

const App: React.FC = () => {
  // Section states for smart cascade
  const [sectionStates, setSectionStates] = useState<DashboardState>({
    projects: { lastRefresh: null, isLoading: false, error: null, status: 'idle' },
    services: { lastRefresh: null, isLoading: false, error: null, status: 'idle' },
    usage: { lastRefresh: null, isLoading: false, error: null, status: 'idle' },
    manual: { lastRefresh: null, isLoading: false, error: null, status: 'idle' },
  });

  const [isGlobalRefreshing, setIsGlobalRefreshing] = useState(false);
  const [projectsRefreshKey, setProjectsRefreshKey] = useState(0);
  const refreshInProgress = useRef(false);

  // Update section state helper
  const updateSectionState = useCallback((
    section: keyof DashboardState,
    updates: Partial<SectionState>
  ) => {
    setSectionStates(prev => ({
      ...prev,
      [section]: { ...prev[section], ...updates },
    }));
  }, []);

  // Check if section is stale
  const isSectionStale = useCallback((section: keyof DashboardState): boolean => {
    const state = sectionStates[section];
    if (!state.lastRefresh) return true;
    return new Date().getTime() - state.lastRefresh.getTime() > STALE_AFTER_MS;
  }, [sectionStates]);

  // Determine section status based on last refresh and errors
  const determineStatus = useCallback((
    lastRefresh: Date | null,
    error: string | null
  ): SectionState['status'] => {
    if (error) return 'error';
    if (!lastRefresh) return 'idle';
    const isStale = new Date().getTime() - lastRefresh.getTime() > STALE_AFTER_MS;
    return isStale ? 'stale' : 'fresh';
  }, []);

  // Smart cascade refresh - only refresh stale sections
  const refreshSection = useCallback(async (section: keyof DashboardState, force = false) => {
    if (!force && !isSectionStale(section) && sectionStates[section].lastRefresh) {
      return; // Skip if fresh and not forced
    }

    updateSectionState(section, { isLoading: true, error: null });

    try {
      switch (section) {
        case 'projects':
          // ProjectsKanban handles its own data loading via props
          break;
        case 'services':
          await api.getServices();
          break;
        case 'usage':
          await api.getUsage();
          break;
        case 'manual':
          await api.getSyncStatus();
          break;
      }
      
      const now = new Date();
      updateSectionState(section, {
        lastRefresh: now,
        isLoading: false,
        error: null,
        status: 'fresh',
      });
    } catch (err) {
      updateSectionState(section, {
        isLoading: false,
        error: err instanceof Error ? err.message : 'Failed to refresh',
        status: 'error',
      });
    }
  }, [isSectionStale, sectionStates, updateSectionState]);

  // Universal refresh - refresh all stale sections
  const handleUniversalRefresh = useCallback(async () => {
    if (refreshInProgress.current) return;
    refreshInProgress.current = true;
    setIsGlobalRefreshing(true);

    const sections: (keyof DashboardState)[] = ['usage', 'services', 'projects', 'manual'];
    
    // Refresh all stale sections in parallel
    await Promise.all(
      sections.map(section => refreshSection(section, true))
    );

    // Trigger projects refresh
    setProjectsRefreshKey(prev => prev + 1);

    setIsGlobalRefreshing(false);
    refreshInProgress.current = false;
  }, [refreshSection]);

  // Smart cascade on mount and visibility change
  useEffect(() => {
    // Initial load - mark all as needing refresh
    const now = new Date();
    setSectionStates({
      projects: { lastRefresh: now, isLoading: false, error: null, status: 'fresh' },
      services: { lastRefresh: now, isLoading: false, error: null, status: 'fresh' },
      usage: { lastRefresh: now, isLoading: false, error: null, status: 'fresh' },
      manual: { lastRefresh: now, isLoading: false, error: null, status: 'fresh' },
    });
    // Handle visibility change (tab focus)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        // Check for stale sections when user returns to tab
        const sections: (keyof DashboardState)[] = ['usage', 'services', 'projects', 'manual'];
        sections.forEach(section => {
          if (isSectionStale(section)) {
            refreshSection(section);
          }
        });
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // Periodic staleness check
    const interval = setInterval(() => {
      setSectionStates(prev => {
        const updated = { ...prev };
        (Object.keys(updated) as (keyof DashboardState)[]).forEach(key => {
          if (updated[key].lastRefresh && !updated[key].isLoading) {
            updated[key] = {
              ...updated[key],
              status: determineStatus(updated[key].lastRefresh, updated[key].error),
            };
          }
        });
        return updated;
      });
    }, 30000); // Check every 30 seconds

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      clearInterval(interval);
    };
  }, [isSectionStale, refreshSection, determineStatus]);

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#020617',
        color: '#f8fafc',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        overflow: 'auto',
      }}
    >
      {/* Header */}
      <header
        style={{
          background: '#0f172a',
          borderBottom: '1px solid #1e293b',
          padding: '16px 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          position: 'sticky',
          top: 0,
          zIndex: 100,
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flex: 1,
            gap: '12px',
          }}
        >
          <div
            style={{
              width: '44px',
              height: '44px',
              background: 'linear-gradient(135deg, #dc2626 0%, #991b1b 100%)',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '24px',
              boxShadow: '0 0 20px rgba(220, 38, 38, 0.4)',
              border: '2px solid rgba(255, 255, 255, 0.1)',
            }}
          >
            🤖
          </div>
          <div style={{ textAlign: 'center' }}>
            <h1
              style={{
                margin: 0,
                fontSize: '24px',
                fontWeight: 800,
                color: '#f8fafc',
                letterSpacing: '-0.5px',
              }}
            >
              Baymax Nexus
            </h1>
          </div>
        </div>

        {/* Universal Refresh Button */}
        <button
          onClick={handleUniversalRefresh}
          disabled={isGlobalRefreshing}
          style={{
            padding: '10px 20px',
            background: isGlobalRefreshing 
              ? '#1e293b' 
              : 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
            border: 'none',
            borderRadius: '8px',
            color: '#fff',
            fontSize: '14px',
            fontWeight: 600,
            cursor: isGlobalRefreshing ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            transition: 'all 0.2s',
            boxShadow: isGlobalRefreshing ? 'none' : '0 4px 14px rgba(59, 130, 246, 0.3)',
          }}
        >
          {isGlobalRefreshing ? (
            <>
              <span style={{ animation: 'spin 1s linear infinite', display: 'inline-block' }}>↻</span>
              <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
              Refreshing...
            </>
          ) : (
            <>
              <span>🔄</span>
              Refresh All
            </>
          )}
        </button>
      </header>

      {/* Main Content Grid */}
      <main
        style={{
          padding: '24px',
          maxWidth: '1800px',
          margin: '0 auto',
        }}
      >
        {/* Top Row: Usage & Limits + Connected Services */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
            gap: '24px',
            marginBottom: '24px',
          }}
        >
          {/* Usage & Limits - Compact */}
          <section
            style={{
              background: '#0f172a',
              borderRadius: '16px',
              padding: '20px',
              border: '1px solid #1e293b',
            }}
          >
            <SectionHeader
              icon="📊"
              title="Usage & Limits"
              state={sectionStates.usage}
              onRefresh={() => refreshSection('usage', true)}
            />
            <UsageLimits compact />
          </section>

          {/* Connected Services - Grid of cards */}
          <section
            style={{
              background: '#0f172a',
              borderRadius: '16px',
              padding: '20px',
              border: '1px solid #1e293b',
            }}
          >
            <SectionHeader
              icon="📡"
              title="Connected Services"
              state={sectionStates.services}
              onRefresh={() => refreshSection('services', true)}
            />
            <ConnectedServices compact />
          </section>
        </div>

        {/* Middle Row: Projects Kanban - Full Width */}
        <section
          style={{
            background: '#0f172a',
            borderRadius: '16px',
            padding: '20px',
            border: '1px solid #1e293b',
            minHeight: '500px',
            marginBottom: '24px',
          }}
        >
          <SectionHeader
            icon="📋"
            title="Projects Kanban"
            state={sectionStates.projects}
            onRefresh={() => refreshSection('projects', true)}
          />
          <ProjectsKanban refreshKey={projectsRefreshKey} />
        </section>

        {/* Bottom Row: Operations Manual - Collapsible */}
        <section
          style={{
            background: '#0f172a',
            borderRadius: '16px',
            padding: '20px',
            border: '1px solid #1e293b',
          }}
        >
          <SectionHeader
            icon="📖"
            title="Operations Manual"
            state={sectionStates.manual}
            onRefresh={() => refreshSection('manual', true)}
          />
          <OperationsManual compact />
        </section>
      </main>

      {/* Footer */}
      <footer
        style={{
          padding: '16px 24px',
          borderTop: '1px solid #1e293b',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          color: '#64748b',
          fontSize: '12px',
        }}
      >
        <div style={{ display: 'flex', gap: '16px' }}>
          <span>
            {getStatusDot(sectionStates.projects.status)} Projects
          </span>
          <span>
            {getStatusDot(sectionStates.services.status)} Services
          </span>
          <span>
            {getStatusDot(sectionStates.usage.status)} Usage
          </span>
          <span>
            {getStatusDot(sectionStates.manual.status)} Manual
          </span>
        </div>
        <span>Nexus Dashboard v2.0</span>
      </footer>
    </div>
  );
};

export default App;
