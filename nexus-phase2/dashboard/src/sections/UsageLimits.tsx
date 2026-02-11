import React, { useState, useEffect } from 'react';
import { UsageData, api } from '../lib/api';
import { Spinner, ErrorState } from '../components/LoadingStates';

// Status Eye Component
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
      className="w-3.5 h-3.5 rounded-full border-2 border-slate-900 flex-shrink-0"
      style={{
        background: colors.bg,
        boxShadow: colors.glow,
        animation: colors.pulse ? 'pulse 2s ease-in-out infinite' : 'none',
      }}
    >
      <div className="w-[3px] h-[3px] rounded-full bg-white/90 mt-0.5 ml-0.5" />
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

  return (
    <div className="flex flex-col gap-3">
      {/* Compact Gauges */}
      <div className="flex gap-2">
        {usageData.map((usage) => {
          const percent = usage.limit_value > 0 
            ? Math.min((usage.current_value / usage.limit_value) * 100, 100)
            : 0;
          
          const isCritical = percent > 95;
          const isWarning = percent > 90;
          
          const color = isCritical ? 'text-red-500' : isWarning ? 'text-amber-500' : 'text-emerald-500';
          const borderColor = isCritical ? 'border-red-500/40' : isWarning ? 'border-amber-500/40' : 'border-emerald-500/40';
          
          const icon = usage.category === 'llm_tokens' ? '🤖' : 
                      usage.category === 'brave_search' ? '🔍' : '⚡';
          
          const shortName = usage.category === 'llm_tokens' ? 'Tokens' : 
                           usage.category === 'brave_search' ? 'Search' : 'API';

          return (
            <div 
              key={usage.category}
              className={`flex-1 py-2 px-1 bg-slate-800/50 rounded-lg border ${borderColor} text-center`}
            >
              <div className="text-sm mb-0.5">{icon}</div>
              <div className={`text-base font-bold ${color}`}>{Math.round(percent)}%</div>
              <div className="text-slate-500 text-[9px] font-semibold uppercase tracking-wide truncate">{shortName}</div>
            </div>
          );
        })}
      </div>

      {/* Usage Bars */}
      <div className="flex flex-col gap-2">
        {usageData.map((usage) => {
          const percent = usage.limit_value > 0 
            ? Math.min((usage.current_value / usage.limit_value) * 100, 100)
            : 0;
          
          const status = percent > 95 ? 'critical' : percent > 90 ? 'attention' : 'healthy';
          const colorClass = status === 'critical' ? 'bg-red-500' : status === 'attention' ? 'bg-amber-500' : 'bg-emerald-500';

          return (
            <div key={usage.category} className="flex items-center gap-2">
              <StatusEye status={status} />
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-center mb-0.5">
                  <span className="text-slate-300 text-xs truncate">
                    {usage.category === 'llm_tokens' ? 'LLM Tokens' : 
                     usage.category === 'brave_search' ? 'Brave Search' : 'API Calls'}
                  </span>
                  <span className="text-slate-500 text-[10px]">
                    {usage.current_value.toLocaleString()}
                  </span>
                </div>
                <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
                  <div 
                    className={`h-full rounded-full ${colorClass} transition-all`}
                    style={{ width: `${percent}%` }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
