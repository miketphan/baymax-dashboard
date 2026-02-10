import React, { useState, useEffect } from 'react';
import { UsageData, api } from '../lib/api';

interface UsageBarProps {
  usage: UsageData;
}

const UsageBar: React.FC<UsageBarProps> = ({ usage }) => {
  const percentage = Math.min((usage.used / usage.limit) * 100, 100);
  
  let barColor = '#10b981'; // green
  if (percentage > 75) barColor = '#f59e0b'; // yellow
  if (percentage > 90) barColor = '#ef4444'; // red

  return (
    <div
      style={{
        background: '#1e293b',
        borderRadius: '12px',
        padding: '20px',
        border: '1px solid #334155',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '12px',
        }}
      >
        <div>
          <h3
            style={{
              margin: '0 0 4px 0',
              color: '#f8fafc',
              fontSize: '14px',
              fontWeight: 600,
              textTransform: 'capitalize',
            }}
          >
            {usage.resource.replace(/-/g, ' ')}
          </h3>
          <span
            style={{
              color: '#64748b',
              fontSize: '12px',
            }}
          >
            {usage.period}
          </span>
        </div>
        <div style={{ textAlign: 'right' }}>
          <span
            style={{
              color: '#f8fafc',
              fontSize: '18px',
              fontWeight: 700,
            }}
          >
            {Math.round(percentage)}%
          </span>
          <span
            style={{
              display: 'block',
              color: '#64748b',
              fontSize: '11px',
            }}
          >
            {usage.used.toLocaleString()} / {usage.limit.toLocaleString()} {usage.unit}
          </span>
        </div>
      </div>

      <div
        style={{
          height: '8px',
          background: '#0f172a',
          borderRadius: '4px',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            width: `${percentage}%`,
            height: '100%',
            background: barColor,
            borderRadius: '4px',
            transition: 'width 0.3s ease',
          }}
        />
      </div>

      {percentage > 90 && (
        <div
          style={{
            marginTop: '12px',
            padding: '8px 12px',
            background: 'rgba(239, 68, 68, 0.1)',
            borderRadius: '6px',
            color: '#ef4444',
            fontSize: '12px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <span>⚠️</span>
          Approaching limit
        </div>
      )}
    </div>
  );
};

export const UsageLimits: React.FC = () => {
  const [usageData, setUsageData] = useState<UsageData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadUsage = async () => {
      try {
        const data = await api.getUsage();
        setUsageData(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load usage data');
      } finally {
        setLoading(false);
      }
    };

    loadUsage();
  }, []);

  const totalUsed = usageData.reduce((sum, u) => sum + u.used, 0);
  const totalLimit = usageData.reduce((sum, u) => sum + u.limit, 0);
  const overallPercentage = totalLimit > 0 ? (totalUsed / totalLimit) * 100 : 0;

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
        Loading usage data...
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
          Usage & Limits
        </h1>
        <p
          style={{
            margin: 0,
            color: '#94a3b8',
            fontSize: '14px',
          }}
        >
          Monitor your resource consumption
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

      {/* Overview Card */}
      <div
        style={{
          background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
          borderRadius: '16px',
          padding: '24px',
          marginBottom: '24px',
          border: '1px solid #334155',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            marginBottom: '16px',
          }}
        >
          <div>
            <h2
              style={{
                margin: '0 0 4px 0',
                color: '#f8fafc',
                fontSize: '16px',
                fontWeight: 600,
              }}
            >
              Overall Usage
            </h2>
            <p
              style={{
                margin: 0,
                color: '#64748b',
                fontSize: '13px',
              }}
            >
              Across all resources
            </p>
          </div>
          <div
            style={{
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              background: `conic-gradient(#3b82f6 ${overallPercentage * 3.6}deg, #334155 0deg)`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <div
              style={{
                width: '44px',
                height: '44px',
                borderRadius: '50%',
                background: '#0f172a',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <span
                style={{
                  color: '#f8fafc',
                  fontWeight: 700,
                  fontSize: '14px',
                }}
              >
                {Math.round(overallPercentage)}%
              </span>
            </div>
          </div>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '16px',
            paddingTop: '16px',
            borderTop: '1px solid #334155',
          }}
        >
          <div>
            <span
              style={{
                display: 'block',
                color: '#64748b',
                fontSize: '11px',
                marginBottom: '4px',
              }}
            >
              Active Resources
            </span>
            <span
              style={{
                color: '#f8fafc',
                fontSize: '20px',
                fontWeight: 700,
              }}
            >
              {usageData.length}
            </span>
          </div>
          <div>
            <span
              style={{
                display: 'block',
                color: '#64748b',
                fontSize: '11px',
                marginBottom: '4px',
              }}
            >
              Near Limit
            </span>
            <span
              style={{
                color: usageData.filter((u) => u.used / u.limit > 0.9).length > 0
                  ? '#ef4444'
                  : '#10b981',
                fontSize: '20px',
                fontWeight: 700,
              }}
            >
              {usageData.filter((u) => u.used / u.limit > 0.9).length}
            </span>
          </div>
          <div>
            <span
              style={{
                display: 'block',
                color: '#64748b',
                fontSize: '11px',
                marginBottom: '4px',
              }}
            >
              Plan
            </span>
            <span
              style={{
                color: '#f8fafc',
                fontSize: '14px',
                fontWeight: 600,
              }}
            >
              Pro
            </span>
          </div>
        </div>
      </div>

      {/* Usage Bars */}
      <div
        style={{
          display: 'grid',
          gap: '16px',
        }}
      >
        {usageData.map((usage) => (
          <UsageBar key={usage.resource} usage={usage} />
        ))}
      </div>

      {usageData.length === 0 && !error && (
        <div
          style={{
            padding: '48px',
            textAlign: 'center',
            color: '#64748b',
            background: '#0f172a',
            borderRadius: '12px',
            border: '1px dashed #334155',
          }}
        >
          No usage data available
        </div>
      )}
    </div>
  );
};
