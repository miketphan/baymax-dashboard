import React, { useState, useEffect } from 'react';
import { UsageData, api } from '../lib/api';
import { Spinner, ErrorState } from '../components/LoadingStates';

// Status Eye Component - Command Center Style
const StatusEye: React.FC<{ status: 'healthy' | 'attention' | 'critical' }> = ({ status }) => {
  const getStatusColor = () => {
    switch (status) {
      case 'healthy':
        return { bg: '#10b981', glow: '0 0 10px rgba(16, 185, 129, 0.5)' };
      case 'attention':
        return { bg: '#f59e0b', glow: '0 0 10px rgba(245, 158, 11, 0.5)' };
      case 'critical':
        return { bg: '#dc2626', glow: '0 0 12px rgba(220, 38, 38, 0.6)', pulse: true };
      default:
        return { bg: '#6b7280', glow: 'none' };
    }
  };

  const colors = getStatusColor();

  return (
    <div
      style={{
        width: '14px',
        height: '14px',
        borderRadius: '50%',
        background: colors.bg,
        border: '2px solid #0a0f1a',
        boxShadow: colors.glow,
        position: 'relative',
        flexShrink: 0,
        animation: colors.pulse ? 'pulse 2s ease-in-out infinite' : 'none',
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
          background: 'rgba(255, 255, 255, 0.9)',
        }}
      />
    </div>
  );
};

export const UsageLimits: React.FC = () => {
  const [usageData, setUsageData] = useState<UsageData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadUsage = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.getUsage();
      setUsageData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load usage');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsage();
  }, []);

  if (loading) return <Spinner size="small" />;
  if (error) return <ErrorState message={error} onRetry={loadUsage} />;

  // Calculate overall health
  const warningCount = usageData.filter(u => (u.current_value / u.limit_value) > 0.9).length;
  const criticalCount = usageData.filter(u => (u.current_value / u.limit_value) > 0.95).length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Compact Gauges Row - Sidebar Optimized */}
      <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
        {usageData.map((usage) => {
          const percent = usage.limit_value > 0 
            ? Math.min((usage.current_value / usage.limit_value) * 100, 100)
            : 0;
          
          const isCritical = percent > 95;
          const isWarning = percent > 90;
          
          const color = isCritical ? '#dc2626' : isWarning ? '#f59e0b' : '#10b981';
          const glowColor = isCritical ? 'rgba(220, 38, 38, 0.4)' : isWarning ? 'rgba(245, 158, 11, 0.3)' : 'rgba(16, 185, 129, 0.3)';
          const borderColor = isCritical ? 'rgba(220, 38, 38, 0.4)' : isWarning ? 'rgba(245, 158, 11, 0.4)' : 'rgba(16, 185, 129, 0.4)';
          
          const icon = usage.category === 'llm_tokens' ? '🤖' : 
                      usage.category === 'brave_search' ? '🔍' : '⚡';
          
          const shortName = usage.category === 'llm_tokens' ? 'Tokens' : 
                           usage.category === 'brave_search' ? 'Search' : 'API';
          
          return (
            <div
              key={usage.category}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '4px',
                padding: '10px 6px',
                background: 'linear-gradient(145deg, rgba(26, 35, 50, 0.7) 0%, rgba(15, 23, 42, 0.5) 100%)',
                borderRadius: '12px',
                border: `1px solid ${borderColor}`,
                boxShadow: `0 4px 16px rgba(0, 0, 0, 0.3), 0 0 20px ${glowColor}`,
                flex: 1,
                minWidth: 0,
              }}
            >
              {/* Mini Gauge - Smaller */}
              <div style={{ position: 'relative', width: '36px', height: '36px' }}>
                <svg width="36" height="36" viewBox="0 0 50 50">
                  <path
                    d="M 10 42 A 20 20 0 1 1 40 42"
                    fill="none"
                    stroke="rgba(255,255,255,0.08)"
                    strokeWidth="6"
                    strokeLinecap="round"
                  />
                  <path
                    d="M 10 42 A 20 20 0 1 1 40 42"
                    fill="none"
                    stroke={color}
                    strokeWidth="6"
                    strokeLinecap="round"
                    strokeDasharray={`${percent * 0.94} 126`}
                    strokeDashoffset="0"
                    style={{ 
                      transition: 'stroke-dasharray 0.5s ease',
                      filter: `drop-shadow(0 0 4px ${color})`,
                    }}
                    transform="rotate(-180 25 25)"
                  />
                </svg>
                <div
                  style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    fontSize: '12px',
                  }}
                >
                  {icon}
                </div>
              </div>
              
              {/* Label */}
              <span style={{ 
                color: '#94a3b8', 
                fontSize: '9px', 
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '0.3px',
              }}>
                {shortName}
              </span>
              
              {/* Percentage */}
              <span style={{ 
                color: color,
                fontSize: '12px',
                fontWeight: 700,
                textShadow: `0 0 10px ${glowColor}`,
              }}>
                {Math.round(percent)}%
              </span>
            </div>
          );
        })}
      </div>

      {/* Health Indicator - Dark Tech Card Style */}
      {criticalCount > 0 && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '10px',
            padding: '14px 18px',
            background: 'linear-gradient(145deg, rgba(220, 38, 38, 0.1) 0%, rgba(185, 28, 28, 0.05) 100%)',
            borderRadius: '14px',
            border: '1px solid rgba(220, 38, 38, 0.3)',
            boxShadow: '0 4px 16px rgba(220, 38, 38, 0.15)',
          }}
        >
          <StatusEye status="critical" />
          <span style={{ color: '#fca5a5', fontSize: '13px', fontWeight: 600 }}>
            {criticalCount} critical limit reached
          </span>
        </div>
      )}
      
      {criticalCount === 0 && warningCount > 0 && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '10px',
            padding: '14px 18px',
            background: 'linear-gradient(145deg, rgba(245, 158, 11, 0.1) 0%, rgba(217, 119, 6, 0.05) 100%)',
            borderRadius: '14px',
            border: '1px solid rgba(245, 158, 11, 0.3)',
            boxShadow: '0 4px 16px rgba(245, 158, 11, 0.15)',
          }}
        >
          <StatusEye status="attention" />
          <span style={{ color: '#fcd34d', fontSize: '13px', fontWeight: 600 }}>
            {warningCount} near limit
          </span>
        </div>
      )}
      
      {criticalCount === 0 && warningCount === 0 && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '10px',
            padding: '14px 18px',
            background: 'linear-gradient(145deg, rgba(16, 185, 129, 0.1) 0%, rgba(5, 150, 105, 0.05) 100%)',
            borderRadius: '14px',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            boxShadow: '0 4px 16px rgba(16, 185, 129, 0.15)',
          }}
        >
          <StatusEye status="healthy" />
          <span style={{ color: '#6ee7b7', fontSize: '13px', fontWeight: 600 }}>
            All systems healthy
          </span>
        </div>
      )}
    </div>
  );
};
