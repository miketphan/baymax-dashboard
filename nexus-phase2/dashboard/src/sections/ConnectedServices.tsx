import React, { useState, useEffect } from 'react';
import { Service, api } from '../lib/api';

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

export const ConnectedServices: React.FC = () => {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionInProgress, setActionInProgress] = useState<string | null>(null);

  const loadServices = async () => {
    try {
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
      // Mock config - in real app, this would open a config modal
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

  const availableServices = ['github', 'discord', 'slack', 'telegram', 'email', 'calendar', 'drive'];
  const connectedTypes = new Set(services.map((s) => s.id));

  if (loading) {
    return (
      <div style={{ padding: '24px', textAlign: 'center', color: '#94a3b8' }}>
        <div
          style={{
            width: '32px',
            height: '32px',
            border: '3px solid #334155',
            borderTop: '3px solid #3b82f6',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 16px',
          }}
        />
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
        Loading services...
      </div>
    );
  }

  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
        <h1
          style={{
            margin: '0 0 4px 0',
            color: '#f8fafc',
            fontSize: '24px',
            fontWeight: 700,
          }}
        >
          Connected Services
        </h1>
        <p
          style={{
            margin: 0,
            color: '#94a3b8',
            fontSize: '14px',
          }}
        >
          Manage your third-party integrations
        </p>
      </div>

      {error && (
        <div
          style={{
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: '8px',
            padding: '12px 16px',
            marginBottom: '24px',
            color: '#ef4444',
            fontSize: '13px',
          }}
        >
          ⚠️ {error}
        </div>
      )}

      {/* Connected Services */}
      <div style={{ marginBottom: '32px' }}>
        <h2
          style={{
            margin: '0 0 16px 0',
            color: '#f8fafc',
            fontSize: '16px',
            fontWeight: 600,
          }}
        >
          Connected ({services.length})
        </h2>
        
        {services.length === 0 ? (
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
            No services connected yet
          </div>
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
              gap: '16px',
            }}
          >
            {services.map((service) => (
              <div
                key={service.id}
                style={{
                  background: '#1e293b',
                  borderRadius: '12px',
                  padding: '16px',
                  border: '1px solid #334155',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                }}
              >
                <div
                  style={{
                    width: '48px',
                    height: '48px',
                    background: '#0f172a',
                    borderRadius: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '24px',
                  }}
                >
                  {serviceIcons[service.id] || serviceIcons.default}
                </div>
                <div style={{ flex: 1 }}>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      marginBottom: '4px',
                    }}
                  >
                    <span
                      style={{
                        color: '#f8fafc',
                        fontWeight: 600,
                        textTransform: 'capitalize',
                      }}
                    >
                      {service.name}
                    </span>
                    <span
                      style={{
                        width: '8px',
                        height: '8px',
                        borderRadius: '50%',
                        background: statusColors[service.status],
                      }}
                    />
                  </div>
                  <span
                    style={{
                      color: '#64748b',
                      fontSize: '12px',
                    }}
                  >
                    {service.last_check
                      ? `Last check: ${new Date(service.last_check).toLocaleDateString()}`
                      : 'Never checked'}
                  </span>
                </div>
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
                  }}
                >
                  {actionInProgress === service.id ? '...' : 'Disconnect'}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Available Services */}
      <div>
        <h2
          style={{
            margin: '0 0 16px 0',
            color: '#f8fafc',
            fontSize: '16px',
            fontWeight: 600,
          }}
        >
          Available
        </h2>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
            gap: '16px',
          }}
        >
          {availableServices
            .filter((type) => !connectedTypes.has(type))
            .map((type) => (
              <button
                key={type}
                onClick={() => handleConnect(type)}
                disabled={actionInProgress === type}
                style={{
                  background: '#0f172a',
                  border: '1px dashed #334155',
                  borderRadius: '12px',
                  padding: '20px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '8px',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = '#3b82f6';
                  e.currentTarget.style.background = '#1e293b';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = '#334155';
                  e.currentTarget.style.background = '#0f172a';
                }}
              >
                <span style={{ fontSize: '32px' }}>
                  {serviceIcons[type] || serviceIcons.default}
                </span>
                <span
                  style={{
                    color: '#f8fafc',
                    fontWeight: 500,
                    textTransform: 'capitalize',
                  }}
                >
                  {actionInProgress === type ? 'Connecting...' : type}
                </span>
              </button>
            ))}
        </div>
      </div>
    </div>
  );
};
