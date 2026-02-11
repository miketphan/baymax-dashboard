import React from 'react';

// Skeleton Card Component
export const SkeletonCard: React.FC = () => (
  <div className="bg-slate-800 rounded-lg p-3 mb-2 border border-slate-700 animate-pulse">
    <div className="h-4 bg-slate-700 rounded mb-2 w-[70%]" />
    <div className="h-3 bg-slate-700 rounded mb-2 w-full" />
    <div className="h-3 bg-slate-700 rounded w-1/2" />
  </div>
);

// Skeleton Column Component
export const SkeletonColumn: React.FC<{ title: string }> = ({ title: _title }) => (
  <div className="flex-1 min-w-[250px] bg-slate-900 rounded-xl p-4 flex flex-col border border-slate-800">
    <div className="flex justify-between items-center mb-4 pb-3 border-b-2 border-slate-700">
      <div className="flex items-center gap-2">
        <div className="h-4 bg-slate-700 rounded w-20" />
        <div className="h-4.5 bg-slate-700 rounded-full w-6" />
      </div>
    </div>
    <div className="flex-1">
      <SkeletonCard />
      <SkeletonCard />
      <SkeletonCard />
    </div>
  </div>
);

// Skeleton Loader Component
export const SkeletonLoader: React.FC = () => (
  <div className="flex gap-4 h-full overflow-x-auto pb-2">
    <SkeletonColumn title="Backlog" />
    <SkeletonColumn title="In Progress" />
    <SkeletonColumn title="Done" />
  </div>
);

// Spinner Component
interface SpinnerProps {
  size?: 'small' | 'medium' | 'large';
  color?: string;
}

export const Spinner: React.FC<SpinnerProps> = ({ 
  size = 'medium',
  color = '#3b82f6'
}) => {
  const sizes = {
    small: 'w-4 h-4 border-2',
    medium: 'w-8 h-8 border-[3px]',
    large: 'w-12 h-12 border-4',
  };

  return (
    <div
      className={`${sizes[size]} rounded-full animate-spin`}
      style={{
        borderColor: '#334155',
        borderTopColor: color,
      }}
    />
  );
};

// Error State Component
interface ErrorStateProps {
  message: string;
  onRetry?: () => void;
}

export const ErrorState: React.FC<ErrorStateProps> = ({ message, onRetry }) => (
  <div className="flex flex-col items-center justify-center h-96 text-red-500 text-center p-5">
    <div className="text-5xl mb-4">⚠️</div>
    <h3 className="m-0 mb-2 text-slate-100 text-lg">Something went wrong</h3>
    <p className="m-0 mb-5 text-slate-400 text-sm max-w-md">{message}</p>
    {onRetry && (
      <button
        onClick={onRetry}
        className="px-5 py-2.5 bg-blue-500 hover:bg-blue-600 border-0 rounded-md text-white text-sm font-medium cursor-pointer flex items-center gap-2 transition-colors"
      >
        <span>↻</span> Try Again
      </button>
    )}
  </div>
);

// Empty State Component
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
  <div className="flex flex-col items-center justify-center p-10 text-slate-500 text-center">
    <div className="text-3xl mb-3">📭</div>
    <p className="m-0 mb-4 text-sm">{message}</p>
    {actionLabel && onAction && (
      <button
        onClick={onAction}
        className="px-4 py-2 bg-slate-700 hover:bg-slate-600 border-0 rounded-md text-slate-100 text-xs cursor-pointer transition-colors"
      >
        {actionLabel}
      </button>
    )}
  </div>
);

// Loading Overlay Component
interface LoadingOverlayProps {
  message?: string;
}

export const LoadingOverlay: React.FC<LoadingOverlayProps> = ({ 
  message = 'Loading...' 
}) => (
  <div className="fixed inset-0 bg-slate-900/80 flex flex-col items-center justify-center z-[9999]">
    <Spinner size="large" />
    <p className="mt-4 text-slate-400 text-sm">{message}</p>
  </div>
);
