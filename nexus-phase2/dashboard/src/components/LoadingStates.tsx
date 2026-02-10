import React from 'react';

// ============================================
// Skeleton Loader Components
// ============================================

export const SkeletonCard: React.FC = () => (
  <div
    style={{
      background: '#1e293b',
      borderRadius: '8px',
      padding: '12px',
      marginBottom: '8px',
      border: '1px solid #334155',
      animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
    }}
  >
    <div
      style={{
        height: '16px',
        background: '#334155',
        borderRadius: '4px',
        marginBottom: '8px',
        width: '70%',
      }}
    />
    <div
      style={{
        height: '12px',
        background: '#334155',
        borderRadius: '4px',
        marginBottom: '8px',
        width: '100%',
      }}
    />
    <div
      style={{
        height: '12px',
        background: '#334155',
        borderRadius: '4px',
        width: '50%',
      }}
    />
    <style>{`
      @keyframes pulse {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.5; }
      }
    `}</style>
  </div>
);

export const SkeletonColumn: React.FC<{ title: string }> = ({ title: _title }) => (
  <div
    style={{
      flex: 1,
      minWidth: '250px',
      background: '#0f172a',
      borderRadius: '12px',
      padding: '16px',
      display: 'flex',
      flexDirection: 'column',
      border: '1px solid #1e293b',
    }}
  >
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '16px',
        paddingBottom: '12px',
        borderBottom: '2px solid #334155',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <div
          style={{
            height: '16px',
            background: '#334155',
            borderRadius: '4px',
            width: '80px',
          }}
        />
        <div
          style={{
            height: '18px',
            background: '#334155',
            borderRadius: '12px',
            width: '24px',
          }}
        />
      </div>
    </div>
    <div style={{ flex: 1 }}>
      <SkeletonCard />
      <SkeletonCard />
      <SkeletonCard />
    </div>
  </div>
);

export const SkeletonLoader: React.FC = () => (
  <div
    style={{
      display: 'flex',
      gap: '16px',
      height: '100%',
      overflowX: 'auto',
      paddingBottom: '8px',
    }}
  >
    <SkeletonColumn title="Backlog" />
    <SkeletonColumn title="In Progress" />
    <SkeletonColumn title="Done" />
    <SkeletonColumn title="Archived" />
  </div>
);

// ============================================
// Spinner Component
// ============================================

interface SpinnerProps {
  size?: 'small' | 'medium' | 'large';
  color?: string;
}

export const Spinner: React.FC<SpinnerProps> = ({ 
  size = 'medium',
  color = '#3b82f6'
}) => {
  const sizes = {
    small: { width: 16, height: 16, border: 2 },
    medium: { width: 32, height: 32, border: 3 },
    large: { width: 48, height: 48, border: 4 },
  };
  
  const s = sizes[size];

  return (
    <div
      style={{
        width: s.width,
        height: s.height,
        border: `${s.border}px solid #334155`,
        borderTop: `${s.border}px solid ${color}`,
        borderRadius: '50%',
        animation: 'spin 1s linear infinite',
      }}
    >
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

// ============================================
// Error State Component
// ============================================

interface ErrorStateProps {
  message: string;
  onRetry?: () => void;
}

export const ErrorState: React.FC<ErrorStateProps> = ({ message, onRetry }) => (
  <div
    style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      height: '400px',
      color: '#ef4444',
      textAlign: 'center',
      padding: '20px',
    }}
  >
    <div
      style={{
        fontSize: '48px',
        marginBottom: '16px',
      }}
    >
      ⚠️
    </div>
    <h3
      style={{
        margin: '0 0 8px 0',
        color: '#f8fafc',
        fontSize: '18px',
      }}
    >
      Something went wrong
    </h3>
    <p
      style={{
        margin: '0 0 20px 0',
        color: '#94a3b8',
        fontSize: '14px',
        maxWidth: '400px',
      }}
    >
      {message}
    </p>
    {onRetry && (
      <button
        onClick={onRetry}
        style={{
          padding: '10px 20px',
          background: '#3b82f6',
          border: 'none',
          borderRadius: '6px',
          color: 'white',
          fontSize: '14px',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          fontWeight: 500,
        }}
      >
        <span>↻</span> Try Again
      </button>
    )}
  </div>
);

// ============================================
// Empty State Component
// ============================================

interface EmptyStateProps {
  message?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({ 
  message = 'No items found',
  actionLabel,
  onAction 
}) => (
  <div
    style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '40px',
      color: '#64748b',
      textAlign: 'center',
    }}
  >
    <div style={{ fontSize: '32px', marginBottom: '12px' }}>📭</div>
    <p style={{ margin: '0 0 16px 0', fontSize: '14px' }}>{message}</p>
    {actionLabel && onAction && (
      <button
        onClick={onAction}
        style={{
          padding: '8px 16px',
          background: '#334155',
          border: 'none',
          borderRadius: '6px',
          color: '#f8fafc',
          fontSize: '13px',
          cursor: 'pointer',
        }}
      >
        {actionLabel}
      </button>
    )}
  </div>
);

// ============================================
// Loading Overlay Component
// ============================================

interface LoadingOverlayProps {
  message?: string;
}

export const LoadingOverlay: React.FC<LoadingOverlayProps> = ({ 
  message = 'Loading...' 
}) => (
  <div
    style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(15, 23, 42, 0.8)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999,
    }}
  >
    <Spinner size="large" />
    <p style={{ marginTop: '16px', color: '#94a3b8', fontSize: '14px' }}>
      {message}
    </p>
  </div>
);
