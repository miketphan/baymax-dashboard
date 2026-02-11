import React, { useState, useEffect } from 'react';
import { Service, api } from '../lib/api';
import { Spinner, ErrorState } from '../components/LoadingStates';

// Status Eye Component - Command Center Style
const StatusEye: React.FC<{ status: 'online' | 'attention' | 'offline' }> = ({ status }) => {
  const getStatusColor = () => {
    switch (status) {
      case 'online':
        return { bg: '#10b981', glow: '0 0 10px rgba(16, 185, 129, 0.5)' };
      case 'attention':
        return { bg: '#f59e0b', glow: '0 0 10px rgba(245, 158, 11, 0.5)' };
      case 'offline':
        return { bg: '#dc2626', glow: '0 0 10px rgba(220, 38, 38, 0.5)' };
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
      {/* Eye highlight */}
      <div
        style={{
          position: 'absolute',
          top: '1.5px',
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

export const ConnectedServices: React.FC = () => {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadServices = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.getServices();
      setServices(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load services');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadServices();
  }, []);

  if (loading) return <Spinner size="small" />;
  if (error) return <ErrorState message={error} onRetry={loadServices} />;

  const onlineCount = services.filter(s => s.status === 'online').length;
  const attentionCount = services.filter(s => s.status === 'attention').length;
  const offlineCount = services.filter(s => s.status === 'offline').length;

  const serviceIcons: Record<string, string> = {
    google_calendar: '📅',
    auto_backups: '💾',
    health_monitor: '🩺',
    system_updates: '🔄',
    security_audit: '🔒',
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      {/* Status Summary - Sidebar Optimized */}
      <div
        style={{
          display: 'flex',
          gap: '6px',
        }}
      >
        <div
          style={{
            flex: 1,
            padding: '10px 4px',
            background: 'linear-gradient(145deg, rgba(16, 185, 129, 0.1) 0%, rgba(5, 150, 105, 0.05) 100%)',
            borderRadius: '10px',
            border: '1px solid rgba(16, 185, 129, 0.25)',
            textAlign: 'center',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
          }}
        >
          <div style={{ fontSize: '14px', marginBottom: '2px' }}>✓</div>
          <div style={{ color: '#10b981', fontSize: '16px', fontWeight: 700, textShadow: '0 0 10px rgba(16, 185, 129, 0.3)' }}>{onlineCount}</div>
          <div style={{ color: '#64748b', fontSize: '9px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.3px' }}>Online</div>
        </div>
        
        <div
          style={{
            flex: 1,
            padding: '10px 4px',
            background: 'linear-gradient(145deg, rgba(245, 158, 11, 0.1) 0%, rgba(217, 119, 6, 0.05) 100%)',
            borderRadius: '10px',
            border: `1px solid ${attentionCount > 0 ? 'rgba(245, 158, 11, 0.4)' : 'rgba(255, 255, 255, 0.08)'}`,
            textAlign: 'center',
            boxShadow: attentionCount > 0 ? '0 4px 12px rgba(245, 158, 11, 0.15)' : '0 4px 12px rgba(0, 0, 0, 0.2)',
          }}
        >
          <div style={{ fontSize: '14px', marginBottom: '2px' }}>⚠</div>
          <div style={{ color: attentionCount > 0 ? '#f59e0b' : '#64748b', fontSize: '16px', fontWeight: 700 }}>{attentionCount}</div>
          <div style={{ color: '#64748b', fontSize: '9px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.3px' }}>Alert</div>
        </div>
        
        <div
          style={{
            flex: 1,
            padding: '10px 4px',
            background: 'linear-gradient(145deg, rgba(220, 38, 38, 0.1) 0%, rgba(185, 28, 28, 0.05) 100%)',
            borderRadius: '10px',
            border: `1px solid ${offlineCount > 0 ? 'rgba(220, 38, 38, 0.4)' : 'rgba(255, 255, 255, 0.08)'}`,
            textAlign: 'center',
            boxShadow: offlineCount > 0 ? '0 4px 12px rgba(220, 38, 38, 0.15)' : '0 4px 12px rgba(0, 0, 0, 0.2)',
          }}
        >
          <div style={{ fontSize: '14px', marginBottom: '2px' }}>✕</div>
          <div style={{ color: offlineCount > 0 ? '#dc2626' : '#64748b', fontSize: '16px', fontWeight: 700 }}>{offlineCount}</div>
          <div style={{ color: '#64748b', fontSize: '9px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.3px' }}>Offline</div>
        </div>
      </div>

      {/* Compact Service List - Dark Tech Cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {services.map((service) => (
          <div
            key={service.id}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '12px 14px',
              background: 'linear-gradient(145deg, rgba(26, 35, 50, 0.6) 0%, rgba(15, 23, 42, 0.4) 100%)',
              borderRadius: '12px',
              border: '1px solid rgba(255, 255, 255, 0.06)',
              transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
              cursor: 'pointer',
              backdropFilter: 'blur(8px)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = 'rgba(59, 130, 246, 0.3)';
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 8px 24px rgba(0, 0, 0, 0.3)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.06)';
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            <span style={{ fontSize: '18px' }}>{serviceIcons[service.id] || '🔌'}</span>
            
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ 
                color: '#f8fafc', 
                fontSize: '13px', 
                fontWeight: 600,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}>
                {service.display_name || service.name}
              </div>
              {service.last_check && (
                <div style={{ color: '#64748b', fontSize: '10px', fontWeight: 500 }}>
                  {new Date(service.last_check).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              )}
            </div>
            
            <StatusEye status={service.status} />
          </div>
        ))}
      </div>
    </div>
  );
};
