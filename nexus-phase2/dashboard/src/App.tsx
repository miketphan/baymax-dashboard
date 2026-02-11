import React, { useState, useEffect, useCallback, useRef } from 'react';
import { ProjectsKanban } from './sections/ProjectsKanban';
import { ConnectedServices } from './sections/ConnectedServices';
import { UsageLimits } from './sections/UsageLimits';
import { OperationsManual } from './sections/OperationsManual';
import { api } from './lib/api';
import './styles/premium.css';

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
// Baymax Armored Head - Based on Reference Image
// ============================================

const BaymaxArmoredHead: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    viewBox="0 0 120 120"
    className={className}
    style={{ width: '100%', height: '100%' }}
    xmlns="http://www.w3.org/2000/svg"
  >
    <defs>
      <linearGradient id="armorRed" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#dc2626" />
        <stop offset="50%" stopColor="#991b1b" />
        <stop offset="100%" stopColor="#7f1d1d" />
      </linearGradient>
      <linearGradient id="armorDark" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#991b1b" />
        <stop offset="100%" stopColor="#450a0a" />
      </linearGradient>
      <filter id="visorGlow" x="-50%" y="-50%" width="200%" height="200%">
        <feGaussianBlur stdDeviation="4" result="blur" />
        <feMerge>
          <feMergeNode in="blur" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>
    </defs>
    
    {/* Main Helmet */}
    <path
      d="M 60 8 C 30 8, 12 28, 12 55 C 12 82, 32 102, 60 105 C 88 102, 108 82, 108 55 C 108 28, 90 8, 60 8 Z"
      fill="url(#armorRed)"
      stroke="#0a0a0a"
      strokeWidth="2"
    />
    
    {/* Top Shine */}
    <ellipse cx="60" cy="22" rx="30" ry="14" fill="rgba(255,255,255,0.25)" />
    
    {/* Center Ridge */}
    <path d="M 60 8 L 62 25 L 58 25 Z" fill="#7f1d1d" />
    
    {/* Side Ear Pieces */}
    <path d="M 12 40 L 4 35 L 4 65 L 12 60 Z" fill="url(#armorDark)" stroke="#0a0a0a" strokeWidth="1.5" />
    <path d="M 108 40 L 116 35 L 116 65 L 108 60 Z" fill="url(#armorDark)" stroke="#0a0a0a" strokeWidth="1.5" />
    
    {/* VISOR */}
    <path
      d="M 20 48 C 20 36, 38 28, 60 28 C 82 28, 100 36, 100 48 C 100 68, 82 78, 60 78 C 38 78, 20 68, 20 48 Z"
      fill="#f8fafc"
      stroke="#0a0a0a"
      strokeWidth="2"
      filter="url(#visorGlow)"
    />
    
    {/* EYES */}
    <ellipse cx="44" cy="52" rx="7" ry="8" fill="#0a0a0a" />
    <ellipse cx="76" cy="52" rx="7" ry="8" fill="#0a0a0a" />
    
    {/* Eye Highlights */}
    <circle cx="46" cy="49" r="2.5" fill="white" opacity="0.9" />
    <circle cx="78" cy="49" r="2.5" fill="white" opacity="0.9" />
    
    {/* Cheek Guards */}
    <path d="M 18 72 L 26 82 L 26 95 L 16 90 Z" fill="url(#armorDark)" stroke="#0a0a0a" strokeWidth="1" />
    <path d="M 102 72 L 94 82 L 94 95 L 104 90 Z" fill="url(#armorDark)" stroke="#0a0a0a" strokeWidth="1" />
    
    {/* Chin */}
    <path d="M 42 98 Q 60 108 78 98 L 78 106 Q 60 114 42 106 Z" fill="#7f1d1d" stroke="#0a0a0a" strokeWidth="1" />
    
    {/* Status Light */}
    <circle cx="60" cy="16" r="3" fill="#3b82f6">
      <animate attributeName="opacity" values="1;0.3;1" dur="2s" repeatCount="indefinite" />
    </circle>
  </svg>
);

// ============================================
// GlassCard Component - Command Center Style
// ============================================

const GlassCard: React.FC<{ children: React.ReactNode; style?: React.CSSProperties }> = ({ 
  children, 
  style = {} 
}) => (
  <div
    className="glass-card"
    style={{
      padding: '20px',
      ...style,
    }}
  >
    {children}
  </div>
);

// ============================================
// Main App Component
// ============================================

const App: React.FC = () => {
  const [sectionStates, setSectionStates] = useState<DashboardState>({
    projects: { lastRefresh: null, isLoading: false, error: null, status: 'idle' },
    services: { lastRefresh: null, isLoading: false, error: null, status: 'idle' },
    usage: { lastRefresh: null, isLoading: false, error: null, status: 'idle' },
    manual: { lastRefresh: null, isLoading: false, error: null, status: 'idle' },
  });

  const [isGlobalRefreshing, setIsGlobalRefreshing] = useState(false);
  const [projectsRefreshKey, setProjectsRefreshKey] = useState(0);
  const refreshInProgress = useRef(false);

  const updateSectionState = useCallback((
    section: keyof DashboardState,
    updates: Partial<SectionState>
  ) => {
    setSectionStates(prev => ({
      ...prev,
      [section]: { ...prev[section], ...updates },
    }));
  }, []);

  const isSectionStale = useCallback((section: keyof DashboardState): boolean => {
    const state = sectionStates[section];
    if (!state.lastRefresh) return true;
    return new Date().getTime() - state.lastRefresh.getTime() > 5 * 60 * 1000;
  }, [sectionStates]);

  const determineStatus = useCallback((
    lastRefresh: Date | null,
    error: string | null
  ): SectionState['status'] => {
    if (error) return 'error';
    if (!lastRefresh) return 'idle';
    const isStale = new Date().getTime() - lastRefresh.getTime() > 5 * 60 * 1000;
    return isStale ? 'stale' : 'fresh';
  }, []);

  const refreshSection = useCallback(async (section: keyof DashboardState, force = false) => {
    if (!force && !isSectionStale(section) && sectionStates[section].lastRefresh) {
      return;
    }

    updateSectionState(section, { isLoading: true, error: null });

    try {
      switch (section) {
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

  const handleUniversalRefresh = useCallback(async () => {
    if (refreshInProgress.current) return;
    refreshInProgress.current = true;
    setIsGlobalRefreshing(true);

    const sections: (keyof DashboardState)[] = ['usage', 'services', 'projects', 'manual'];
    
    await Promise.all(
      sections.map(section => refreshSection(section, true))
    );

    setProjectsRefreshKey(prev => prev + 1);

    setIsGlobalRefreshing(false);
    refreshInProgress.current = false;
  }, [refreshSection]);

  useEffect(() => {
    const now = new Date();
    setSectionStates({
      projects: { lastRefresh: now, isLoading: false, error: null, status: 'fresh' },
      services: { lastRefresh: now, isLoading: false, error: null, status: 'fresh' },
      usage: { lastRefresh: now, isLoading: false, error: null, status: 'fresh' },
      manual: { lastRefresh: now, isLoading: false, error: null, status: 'fresh' },
    });

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        const sections: (keyof DashboardState)[] = ['usage', 'services', 'projects', 'manual'];
        sections.forEach(section => {
          if (isSectionStale(section)) {
            refreshSection(section);
          }
        });
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    const interval = setInterval(() => {
      setSectionStates(prev => {
        const updated = { ...prev };
        Object.keys(updated).forEach(key => {
          const sectionKey = key as keyof DashboardState;
          if (updated[sectionKey].lastRefresh) {
            updated[sectionKey] = {
              ...updated[sectionKey],
              status: determineStatus(updated[sectionKey].lastRefresh, updated[sectionKey].error),
            };
          }
        });
        return updated;
      });
    }, 30000);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      clearInterval(interval);
    };
  }, [isSectionStale, refreshSection, determineStatus]);

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(180deg, #0a0f1a 0%, #0f172a 50%, #0a0f1a 100%)',
        color: '#f8fafc',
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        overflow: 'auto',
        position: 'relative',
      }}
    >
      {/* Ambient Background - Tech Grid & Holographic Glows */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: `
            radial-gradient(ellipse at 20% 20%, rgba(153, 27, 27, 0.15) 0%, transparent 50%),
            radial-gradient(ellipse at 80% 80%, rgba(59, 130, 246, 0.1) 0%, transparent 40%),
            radial-gradient(ellipse at 50% 50%, rgba(6, 182, 212, 0.05) 0%, transparent 70%)
          `,
          pointerEvents: 'none',
          zIndex: 0,
        }}
      />
      
      {/* Tech Grid Overlay - Behind everything */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundImage: `
            linear-gradient(rgba(59, 130, 246, 0.04) 1px, transparent 1px),
            linear-gradient(90deg, rgba(59, 130, 246, 0.04) 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px',
          pointerEvents: 'none',
          zIndex: 0,
        }}
      />
      
      {/* Scan Lines Effect - Behind cards */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0, 0, 0, 0.15) 2px, rgba(0, 0, 0, 0.15) 4px)',
          pointerEvents: 'none',
          zIndex: 0,
          opacity: 0.4,
        }}
      />
      
      {/* Moving Scan Line - Behind cards */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          height: '2px',
          background: 'linear-gradient(90deg, transparent, rgba(59, 130, 246, 0.4), transparent)',
          boxShadow: '0 0 10px rgba(59, 130, 246, 0.6)',
          animation: 'scanline 8s linear infinite',
          pointerEvents: 'none',
          zIndex: 0,
        }}
      />

      {/* Command Center Header */}
      <header
        style={{
          background: 'linear-gradient(180deg, rgba(10, 15, 26, 0.95) 0%, rgba(15, 23, 42, 0.9) 100%)',
          backdropFilter: 'blur(20px) saturate(180%)',
          borderBottom: '1px solid rgba(153, 27, 27, 0.3)',
          padding: '16px 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          position: 'sticky',
          top: 0,
          zIndex: 100,
          boxShadow: '0 4px 30px rgba(0, 0, 0, 0.5), 0 0 40px rgba(153, 27, 27, 0.1)',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flex: 1,
            gap: '16px',
          }}
        >
          {/* Baymax Command Icon with Breathing Animation */}
          <div
            className="baymax-icon animate-visor-glow"
            style={{
              width: '48px',
              height: '48px',
              filter: 'drop-shadow(0 0 20px rgba(224, 242, 254, 0.5))',
              cursor: 'pointer',
            }}
          >
            <BaymaxArmoredHead />
          </div>
          
          <div style={{ textAlign: 'center' }}>
            <h1
              style={{
                margin: 0,
                fontSize: '24px',
                fontWeight: 700,
                color: '#f8fafc',
                letterSpacing: '-0.5px',
                textShadow: '0 0 30px rgba(248, 250, 252, 0.2)',
              }}
            >
              Baymax Nexus
            </h1>
            <span 
              style={{ 
                color: '#991b1b', 
                fontSize: '11px', 
                fontWeight: 600, 
                letterSpacing: '3px',
                textTransform: 'uppercase',
                textShadow: '0 0 10px rgba(153, 27, 27, 0.5)',
              }}
            >
              Command Center
            </span>
          </div>
        </div>

        {/* Refresh Button - Tech Style */}
        <button
          onClick={handleUniversalRefresh}
          disabled={isGlobalRefreshing}
          style={{
            padding: '12px 20px',
            background: isGlobalRefreshing 
              ? 'rgba(255, 255, 255, 0.05)' 
              : 'linear-gradient(135deg, #991b1b 0%, #7f1d1d 100%)',
            border: '1px solid rgba(153, 27, 27, 0.5)',
            borderRadius: '10px',
            color: '#f8fafc',
            fontSize: '13px',
            fontWeight: 600,
            cursor: isGlobalRefreshing ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
            boxShadow: isGlobalRefreshing 
              ? 'none' 
              : '0 4px 20px rgba(153, 27, 27, 0.35)',
            fontFamily: "'Inter', sans-serif",
          }}
          onMouseEnter={(e) => {
            if (!isGlobalRefreshing) {
              e.currentTarget.style.transform = 'scale(1.05)';
              e.currentTarget.style.boxShadow = '0 6px 30px rgba(153, 27, 27, 0.5)';
              e.currentTarget.style.borderColor = 'rgba(153, 27, 27, 0.8)';
            }
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'scale(1)';
            e.currentTarget.style.boxShadow = isGlobalRefreshing 
              ? 'none' 
              : '0 4px 20px rgba(153, 27, 27, 0.35)';
            e.currentTarget.style.borderColor = 'rgba(153, 27, 27, 0.5)';
          }}
        >
          {isGlobalRefreshing ? (
            <>
              <span style={{ 
                animation: 'spin 1s linear infinite', 
                display: 'inline-block',
                fontSize: '14px'
              }}>↻</span>
              <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
              <span>Syncing...</span>
            </>
          ) : (
            <>
              <span style={{ fontSize: '14px' }}>⟳</span>
              <span>Sync</span>
            </>
          )}
        </button>
      </header>

      {/* Main Content */}
      <main
        style={{
          padding: '24px',
          maxWidth: '1800px',
          margin: '0 auto',
          position: 'relative',
          zIndex: 1,
        }}
      >
        {/* Main Layout - Usage Sidebar */}
        <div style={{ display: 'flex', gap: '20px' }}>
          {/* Sidebar - Usage & Services */}
          <div style={{ width: '280px', flexShrink: 0, display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <GlassCard style={{ padding: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                <span style={{ fontSize: '14px' }}>📊</span>
                <span style={{ fontSize: '12px', fontWeight: 600, color: '#f8fafc' }}>Usage</span>
              </div>
              <UsageLimits />
            </GlassCard>

            <GlassCard style={{ padding: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                <span style={{ fontSize: '14px' }}>🔌</span>
                <span style={{ fontSize: '12px', fontWeight: 600, color: '#f8fafc' }}>Services</span>
              </div>
              <ConnectedServices />
            </GlassCard>
          </div>

          {/* Main Content */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Projects Section */}
            <GlassCard style={{ flex: 1, padding: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                <span style={{ fontSize: '14px' }}>📋</span>
                <span style={{ fontSize: '12px', fontWeight: 600, color: '#f8fafc' }}>Projects</span>
              </div>
              <ProjectsKanban refreshKey={projectsRefreshKey} />
            </GlassCard>

            {/* Operations Manual */}
            <GlassCard style={{ padding: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                <span style={{ fontSize: '14px' }}>📖</span>
                <span style={{ fontSize: '12px', fontWeight: 600, color: '#f8fafc' }}>Operations Manual</span>
              </div>
              <OperationsManual />
            </GlassCard>
          </div>
        </div>
      </main>
    </div>
  );
};

export default App;
