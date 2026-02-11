import React, { useState, useEffect } from 'react';
import { Service, api } from '../lib/api';
import { Spinner, ErrorState } from '../components/LoadingStates';

const serviceIcons: Record<string, string> = {
  github: '🔗',
  discord: '💬',
  slack: '💼',
  telegram: '✈️',
  email: '📧',
  calendar: '📅',
  drive: '📁',
  default: '🔌',
};

const statusColors = {
  online: '#10b981',
  attention: '#f59e0b',
  offline: '#ef4444',
};

interface ConnectedServicesProps {
  compact?: boolean;
}

export const ConnectedServices: React.FC<ConnectedServicesProps> = ({ compact = false }) => {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionInProgress, setActionInProgress] = useState<string | null>(null);

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

  const handleConnect = async (type: string) => {
    setActionInProgress(type);
    try {
      await api.connectService(type, { oauth: true });
      await loadServices();
    } catch (err) {
      setError(err instanceof Error ? err.message : `Failed to connect ${type}`);
    } finally {
      setActionInProgress(null);
    }
  };

  const handleDisconnect = async (id: string) => {
    if (!window.confirm('Disconnect this service?')) return;
    
    setActionInProgress(id);
    try {
      await api.disconnectService(id);
      await loadServices();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to disconnect service');
    } finally {
      setActionInProgress(null);
    }
  };

  // In compact mode, only show first 5 services
  const displayedServices = compact ? services.slice(0, 5) : services;
  const availableServices = ['github', 'discord', 'slack', 'telegram', 'email'];
  const connectedTypes = new Set(services.map((s) => s.id));

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
        <Spinner size="medium" />
      </div>
    );
  }

  if (error) {
    return <ErrorState message={error} onRetry={loadServices} />;
  }

  return (
    <div>
      {/* Connected Services Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: compact 
            ? 'repeat(auto-fit, minmax(160px, 1fr))' 
            : 'repeat(auto-fill, minmax(280px, 1fr))',
          gap: '12px',
        }}
      >
        {displayedServices.map((service) => (
          <div
            key={service.id}
            style={{
              background: '#1e293b',
              borderRadius: '12px',
              padding: compact ? '12px' : '16px',
              border: '1px solid #334155',
              display: 'flex',
              alignItems: 'center',
              gap: compact ? '8px' : '12px',
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = '#3b82f6';
              e.currentTarget.style.boxShadow = '0 0 20px rgba(59, 130, 246, 0.1)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = '#334155';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            <div
              style={{
                width: compact ? '36px' : '48px',
                height: compact ? '36px' : '48px',
                background: '#0f172a',
                borderRadius: '10px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: compact ? '18px' : '24px',
                flexShrink: 0,
              }}
            >
              {serviceIcons[service.id] || serviceIcons.default}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  marginBottom: '2px',
                }}
              >
                <span
                  style={{
                    color: '#f8fafc',
                    fontWeight: 600,
                    textTransform: 'capitalize',
                    fontSize: compact ? '13px' : '14px',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {service.name}
                </span>
                <span
                  style={{
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    background: statusColors[service.status],
                    boxShadow: `0 0 6px ${statusColors[service.status]}`,
                    flexShrink: 0,
                  }}
                />
              </div>
              {!compact && (
                <span
                  style={{
                    color: '#64748b',
                    fontSize: '11px',
                  }}
                >
                  {service.last_check
                    ? `Last check: ${new Date(service.last_check).toLocaleDateString()}`
                    : 'Never checked'}
                </span>
              )}
            </div>
            {!compact && (
              <button
                onClick={() => handleDisconnect(service.id)}
                disabled={actionInProgress === service.id}
                style={{
                  padding: '6px 12px',
                  background: 'transparent',
                  border: '1px solid #ef4444',
                  borderRadius: '6px',
                  color: '#ef4444',
                  fontSize: '12px',
                  cursor: 'pointer',
                  opacity: actionInProgress === service.id ? 0.5 : 1,
                  flexShrink: 0,
                }}
              >
                {actionInProgress === service.id ? '...' : 'Disconnect'}
              </button>
            )}
          </div>
        ))}

        {/* Empty slots for available services */}
        {displayedServices.length < 5 && availableServices
          .filter((type) => !connectedTypes.has(type))
          .slice(0, 5 - displayedServices.length)
          .map((type) => (
            <button
              key={type}
              onClick={() => handleConnect(type)}
              disabled={actionInProgress === type}
              style={{
                background: 'transparent',
                border: '1px dashed #334155',
                borderRadius: '12px',
                padding: compact ? '12px' : '16px',
                display: 'flex',
                alignItems: 'center',
                gap: compact ? '8px' : '12px',
                cursor: 'pointer',
                transition: 'all 0.2s',
                opacity: actionInProgress === type ? 0.5 : 1,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = '#3b82f6';
                e.currentTarget.style.background = '#1e293b';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = '#334155';
                e.currentTarget.style.background = 'transparent';
              }}
            >
              <div
                style={{
                  width: compact ? '36px' : '48px',
                  height: compact ? '36px' : '48px',
                  background: '#0f172a',
                  borderRadius: '10px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: compact ? '18px' : '24px',
                }}
              >
                {serviceIcons[type] || serviceIcons.default}
              </div>
              <span
                style={{
                  color: '#64748b',
                  fontWeight: 500,
                  textTransform: 'capitalize',
                  fontSize: compact ? '13px' : '14px',
                }}
              >
                {actionInProgress === type ? 'Connecting...' : `Connect ${type}`}
              </span>
            </button>
          ))}
      </div>

      {services.length === 0 && !loading && (
        <div
          style={{
            padding: '32px',
            textAlign: 'center',
            color: '#64748b',
            background: '#0f172a',
            borderRadius: '12px',
            border: '1px dashed #334155',
          }}
        >
          No services connected. Click a service above to connect.
        </div>
      )}

      {compact && services.length > 5 && (
        <div
          style={{
            textAlign: 'center',
            padding: '12px',
            color: '#64748b',
            fontSize: '13px',
          }}
        >
          +{services.length - 5} more services
        </div>
      )}
    </div>
  );
};

export default ConnectedServices;
