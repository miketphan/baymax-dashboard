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
      className="w-3 h-3 rounded-full border-2 border-slate-900 flex-shrink-0"
      style={{
        background: colors.bg,
        boxShadow: colors.glow,
      }}
    >
      {/* Eye highlight */}
      <div className="w-[3px] h-[3px] rounded-full bg-white/90 mt-[1.5px] ml-[2px]" />
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
    <div className="flex flex-col gap-2">
      {/* Status Summary */}
      <div className="flex gap-2">
        <div className="flex-1 py-2 px-1 bg-gradient-to-br from-emerald-500/10 to-emerald-600/5 rounded-lg border border-emerald-500/25 text-center">
          <div className="text-sm mb-0.5">✓</div>
          <div className="text-emerald-500 text-base font-bold">{onlineCount}</div>
          <div className="text-slate-500 text-[9px] font-semibold uppercase tracking-wide">Online</div>
        </div>
        
        <div className={`flex-1 py-2 px-1 rounded-lg border text-center ${attentionCount > 0 ? 'bg-gradient-to-br from-amber-500/10 to-amber-600/5 border-amber-500/40' : 'bg-slate-800/50 border-white/5'}`}>
          <div className="text-sm mb-0.5">⚠</div>
          <div className={`text-base font-bold ${attentionCount > 0 ? 'text-amber-500' : 'text-slate-500'}`}>{attentionCount}</div>
          <div className="text-slate-500 text-[9px] font-semibold uppercase tracking-wide">Alert</div>
        </div>
        
        <div className={`flex-1 py-2 px-1 rounded-lg border text-center ${offlineCount > 0 ? 'bg-gradient-to-br from-red-500/10 to-red-600/5 border-red-500/40' : 'bg-slate-800/50 border-white/5'}`}>
          <div className="text-sm mb-0.5">✕</div>
          <div className={`text-base font-bold ${offlineCount > 0 ? 'text-red-500' : 'text-slate-500'}`}>{offlineCount}</div>
          <div className="text-slate-500 text-[9px] font-semibold uppercase tracking-wide">Offline</div>
        </div>
      </div>

      {/* Service List - Compact */}
      <div className="flex flex-col gap-1.5">
        {services.map((service) => (
          <div
            key={service.id}
            className="flex items-center gap-2 px-2 py-2 bg-slate-800/40 rounded-lg border border-white/5 transition-all hover:border-blue-500/30"
          >
            <span className="text-base">{serviceIcons[service.id] || '🔌'}</span>
            
            <div className="flex-1 min-w-0">
              <div className="text-slate-200 text-xs font-medium truncate">
                {service.display_name || service.name}
              </div>
              {service.last_check && (
                <div className="text-slate-500 text-[9px]">
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
