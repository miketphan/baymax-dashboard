import React, { useState, useEffect, useCallback } from 'react';
import { api } from '../lib/api';

interface StalenessCheck {
  section: string;
  isStale: boolean;
  lastSync: string | null;
  staleAfterMinutes: number;
  minutesSinceSync: number | null;
  display: {
    text: string;
    color: string;
    icon: string;
    shouldRefresh: boolean;
  };
}

interface SyncStatusProps {
  onRefreshRequest?: () => void;
}

export const SyncStatus: React.FC<SyncStatusProps> = ({ onRefreshRequest }) => {
  const [checks, setChecks] = useState<StalenessCheck[]>([]);
  const [overallStatus, setOverallStatus] = useState<'fresh' | 'stale' | 'error'>('fresh');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isVisible, setIsVisible] = useState(true);
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());

  const fetchStaleness = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.getSyncHealth();
      setChecks(response.sections);
      setOverallStatus(response.overall_status);
      setLastRefreshed(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to check sync status');
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchStaleness();
  }, [fetchStaleness]);

  // Auto-refresh when tab becomes visible
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        // Check if we need to refresh (been away for more than 30 seconds)
        const timeSinceLastRefresh = Date.now() - lastRefreshed.getTime();
        if (timeSinceLastRefresh > 30000) {
          fetchStaleness();
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [fetchStaleness, lastRefreshed]);

  // Periodic refresh every 60 seconds
  useEffect(() => {
    const interval = setInterval(fetchStaleness, 60000);
    return () => clearInterval(interval);
  }, [fetchStaleness]);

  const handleRefresh = () => {
    onRefreshRequest?.();
    fetchStaleness();
  };

  const staleSections = checks.filter(c => c.isStale);
  const hasErrors = checks.some(c => c.minutesSinceSync && c.minutesSinceSync > c.staleAfterMinutes * 2);

  if (!isVisible) {
    return (
      <button
        onClick={() => setIsVisible(true)}
        style={{
          position: 'fixed',
          bottom: '16px',
          right: '16px',
          width: '40px',
          height: '40px',
          borderRadius: '50%',
          background: hasErrors ? '#ef4444' : staleSections.length > 0 ? '#f59e0b' : '#10b981',
          border: 'none',
          color: 'white',
          fontSize: '18px',
          cursor: 'pointer',
          boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
          zIndex: 100,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {hasErrors ? '⚠️' : staleSections.length > 0 ? '⏱️' : '✓'}
      </button>
    );
  }

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '16px',
        right: '16px',
        background: '#1e293b',
        borderRadius: '12px',
        border: '1px solid #334155',
        padding: '16px',
        minWidth: '280px',
        maxWidth: '320px',
        boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
        zIndex: 100,
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '12px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span
            style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: overallStatus === 'fresh' ? '#10b981' : 
                        overallStatus === 'error' ? '#ef4444' : '#f59e0b',
              animation: overallStatus !== 'fresh' ? 'pulse 2s infinite' : 'none',
            }}
          />
          <span
            style={{
              color: '#f8fafc',
              fontSize: '14px',
              fontWeight: 600,
            }}
          >
            Sync Status
          </span>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={handleRefresh}
            disabled={loading}
            style={{
              background: 'transparent',
              border: 'none',
              color: loading ? '#475569' : '#94a3b8',
              cursor: loading ? 'not-allowed' : 'pointer',
              fontSize: '14px',
              padding: '4px',
              transform: loading ? 'rotate(360deg)' : 'none',
              transition: 'transform 0.5s',
            }}
          >
            ↻
          </button>
          <button
            onClick={() => setIsVisible(false)}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#94a3b8',
              cursor: 'pointer',
              fontSize: '14px',
              padding: '4px',
            }}
          >
            ✕
          </button>
        </div>
      </div>

      {/* Overall status */}
      {overallStatus !== 'fresh' && (
        <div
          style={{
            background: overallStatus === 'error' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(245, 158, 11, 0.1)',
            border: `1px solid ${overallStatus === 'error' ? 'rgba(239, 68, 68, 0.3)' : 'rgba(245, 158, 11, 0.3)'}`,
            borderRadius: '6px',
            padding: '10px 12px',
            marginBottom: '12px',
          }}
        >
          <p
            style={{
              margin: 0,
              color: overallStatus === 'error' ? '#ef4444' : '#f59e0b',
              fontSize: '13px',
            }}
          >
            {hasErrors 
              ? '⚠️ Some data is significantly out of date' 
              : '⏱️ Some data is stale and may need refreshing'}
          </p>
          {onRefreshRequest && (
            <button
              onClick={handleRefresh}
              style={{
                marginTop: '8px',
                padding: '6px 12px',
                background: overallStatus === 'error' ? '#ef4444' : '#f59e0b',
                border: 'none',
                borderRadius: '4px',
                color: 'white',
                fontSize: '12px',
                cursor: 'pointer',
                fontWeight: 500,
              }}
            >
              Refresh Data
            </button>
          )}
        </div>
      )}

      {/* Section list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {checks.map((check) => (
          <div
            key={check.section}
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '8px',
              background: check.isStale ? 'rgba(245, 158, 11, 0.05)' : 'transparent',
              borderRadius: '4px',
            }}
          >
            <span
              style={{
                color: '#94a3b8',
                fontSize: '13px',
                textTransform: 'capitalize',
              }}
            >
              {check.section.replace('_', ' ')}
            </span>
            <span
              style={{
                color: check.display.color,
                fontSize: '12px',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              {check.display.icon} {check.display.text}
            </span>
          </div>
        ))}
      </div>

      {error && (
        <p style={{ margin: '12px 0 0 0', color: '#ef4444', fontSize: '12px' }}>
          {error}
        </p>
      )}

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </div>
  );
};

// Compact indicator for inline use
export const StalenessIndicator: React.FC<{
  lastSync: string | null;
  staleAfterMinutes: number;
}> = ({ lastSync, staleAfterMinutes }) => {
  const [display, setDisplay] = useState({
    text: 'Checking...',
    color: '#64748b',
    isStale: false,
  });

  useEffect(() => {
    if (!lastSync) {
      setDisplay({ text: 'Never synced', color: '#ef4444', isStale: true });
      return;
    }

    const lastSyncDate = new Date(lastSync);
    const now = new Date();
    const minutesSinceSync = Math.floor((now.getTime() - lastSyncDate.getTime()) / 60000);
    const isStale = minutesSinceSync >= staleAfterMinutes;

    let text: string;
    if (minutesSinceSync < 1) {
      text = 'Just now';
    } else if (minutesSinceSync < 60) {
      text = `${minutesSinceSync}m ago`;
    } else {
      const hours = Math.floor(minutesSinceSync / 60);
      text = `${hours}h ago`;
    }

    let color: string;
    if (!isStale) {
      color = '#10b981';
    } else if (minutesSinceSync > staleAfterMinutes * 2) {
      color = '#ef4444';
    } else {
      color = '#f59e0b';
    }

    setDisplay({ text, color, isStale });
  }, [lastSync, staleAfterMinutes]);

  return (
    <span
      style={{
        color: display.color,
        fontSize: '12px',
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
          background: display.color,
        }}
      />
      {display.text}
      {display.isStale && ' (refresh recommended)'}
    </span>
  );
};
