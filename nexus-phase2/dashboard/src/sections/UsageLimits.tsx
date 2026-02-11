import React, { useState, useEffect } from 'react';
import { UsageData, api } from '../lib/api';
import { Spinner, ErrorState } from '../components/LoadingStates';

interface UsageLimitsProps {
  compact?: boolean;
}

interface UsageBarProps {
  usage: UsageData;
  compact?: boolean;
}

const UsageBar: React.FC<UsageBarProps> = ({ usage, compact = false }) => {
  const percentage = usage.limit_value > 0 
    ? Math.min((usage.current_value / usage.limit_value) * 100, 100)
    : 0;
  
  let barColor = '#10b981'; // green
  if (percentage > 75) barColor = '#f59e0b'; // yellow
  if (percentage > 90) barColor = '#ef4444'; // red

  if (compact) {
    return (
      <div style={{ marginBottom: '12px' }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '6px',
          }}
        >
          <span
            style={{
              color: '#f8fafc',
              fontSize: '13px',
              fontWeight: 500,
              textTransform: 'capitalize',
            }}
          >
            {usage.category.replace(/-/g, ' ')}
          </span>
          <span
            style={{
              color: percentage > 90 ? '#ef4444' : '#94a3b8',
              fontSize: '12px',
              fontWeight: 600,
            }}
          >
            {Math.round(percentage)}%
          </span>
        </div>
        <div
          style={{
            height: '6px',
            background: '#1e293b',
            borderRadius: '3px',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              width: `${percentage}%`,
              height: '100%',
              background: barColor,
              borderRadius: '3px',
              transition: 'width 0.3s ease',
              boxShadow: percentage > 90 ? '0 0 10px rgba(239, 68, 68, 0.5)' : 'none',
            }}
          />
        </div>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginTop: '4px',
          }}
        >
          <span style={{ color: '#64748b', fontSize: '10px' }}>
            {usage.current_value.toLocaleString()} {usage.unit}
          </span>
          <span style={{ color: '#64748b', fontSize: '10px' }}>
            {usage.limit_value.toLocaleString()} {usage.unit}
          </span>
        </div>
      </div>
    );
  }

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
            {usage.category.replace(/-/g, ' ')}
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
            {usage.current_value.toLocaleString()} / {usage.limit_value.toLocaleString()} {usage.unit}
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

export const UsageLimits: React.FC<UsageLimitsProps> = ({ compact = false }) => {
  const [usageData, setUsageData] = useState<UsageData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadUsage = async () => {
      try {
        setLoading(true);
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

  const totalUsed = usageData.reduce((sum, u) => sum + u.current_value, 0);
  const totalLimit = usageData.reduce((sum, u) => sum + u.limit_value, 0);
  const overallPercentage = totalLimit > 0 ? (totalUsed / totalLimit) * 100 : 0;

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
        <Spinner size="medium" />
      </div>
    );
  }

  if (error) {
    return <ErrorState message={error} />;
  }

  if (compact) {
    return (
      <div>
        {/* Compact Header with Overall Stats */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            marginBottom: '16px',
            padding: '12px',
            background: '#1e293b',
            borderRadius: '10px',
          }}
        >
          <div
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '50%',
              background: `conic-gradient(#3b82f6 ${overallPercentage * 3.6}deg, #334155 0deg)`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <div
              style={{
                width: '38px',
                height: '38px',
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
                  fontSize: '12px',
                }}
              >
                {Math.round(overallPercentage)}%
              </span>
            </div>
          </div>
          <div style={{ flex: 1 }}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <span style={{ color: '#f8fafc', fontWeight: 600, fontSize: '14px' }}>
                Overall Usage
              </span>
              <span
                style={{
                  color: usageData.filter((u) => u.current_value / u.limit_value > 0.9).length > 0
                    ? '#ef4444'
                    : '#10b981',
                  fontSize: '12px',
                  fontWeight: 500,
                }}
              >
                {usageData.filter((u) => u.current_value / u.limit_value > 0.9).length > 0 ? '⚠️ ' : '✅ '}
                {usageData.filter((u) => u.current_value / u.limit_value > 0.9).length} near limit
              </span>
            </div>
            <div
              style={{
                height: '4px',
                background: '#334155',
                borderRadius: '2px',
                marginTop: '8px',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  width: `${overallPercentage}%`,
                  height: '100%',
                  background: overallPercentage > 90 ? '#ef4444' : '#3b82f6',
                  borderRadius: '2px',
                }}
              />
            </div>
          </div>
        </div>

        {/* Compact Progress Bars */}
        <div>
          {usageData.slice(0, 4).map((usage) => (
            <UsageBar key={usage.category} usage={usage} compact />
          ))}
        </div>

        {usageData.length === 0 && (
          <div
            style={{
              padding: '24px',
              textAlign: 'center',
              color: '#64748b',
              fontSize: '13px',
            }}
          >
            No usage data available
          </div>
        )}
      </div>
    );
  }

  // Full mode
  return (
    <div>
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
                color: usageData.filter((u) => u.current_value / u.limit_value > 0.9).length > 0
                  ? '#ef4444'
                  : '#10b981',
                fontSize: '20px',
                fontWeight: 700,
              }}
            >
              {usageData.filter((u) => u.current_value / u.limit_value > 0.9).length}
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
          <UsageBar key={usage.category} usage={usage} />
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

export default UsageLimits;
