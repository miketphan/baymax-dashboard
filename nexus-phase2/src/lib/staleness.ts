// Smart Cascade - Staleness checking and middleware

import type { Env, SyncState } from '../types';
import { getSyncState } from '../lib/db';

export interface StalenessCheck {
  section: string;
  isStale: boolean;
  lastSync: string | null;
  staleAfterMinutes: number;
  minutesSinceSync: number | null;
}

/**
 * Check if a specific section's data is stale
 */
export async function checkStaleness(
  db: D1Database,
  section: string
): Promise<StalenessCheck> {
  const syncState = await getSyncState(db, section);
  
  if (!syncState) {
    return {
      section,
      isStale: true,
      lastSync: null,
      staleAfterMinutes: 10,
      minutesSinceSync: null,
    };
  }
  
  const now = new Date();
  const lastSync = syncState.last_sync ? new Date(syncState.last_sync) : null;
  const minutesSinceSync = lastSync 
    ? Math.floor((now.getTime() - lastSync.getTime()) / 60000)
    : null;
  
  const isStale = !lastSync || (minutesSinceSync !== null && minutesSinceSync >= syncState.stale_after_minutes);
  
  return {
    section,
    isStale,
    lastSync: syncState.last_sync,
    staleAfterMinutes: syncState.stale_after_minutes,
    minutesSinceSync,
  };
}

/**
 * Check staleness for all tracked sections
 */
export async function checkAllStaleness(db: D1Database): Promise<StalenessCheck[]> {
  const sections = ['projects', 'services', 'usage_limits', 'operations_manual', 'system_config'];
  const checks = await Promise.all(sections.map(section => checkStaleness(db, section)));
  return checks;
}

/**
 * Middleware to check staleness before processing a request
 * Returns null if data is fresh, or a Response if data is stale (based on strict mode)
 */
export async function stalenessMiddleware(
  db: D1Database,
  section: string,
  options: {
    strict?: boolean;
    maxStalenessMinutes?: number;
  } = {}
): Promise<{ isStale: boolean; check: StalenessCheck } | null> {
  const check = await checkStaleness(db, section);
  
  if (!check.isStale) {
    return { isStale: false, check };
  }
  
  // In strict mode with maxStalenessMinutes, reject if too stale
  if (options.strict && options.maxStalenessMinutes && check.minutesSinceSync) {
    if (check.minutesSinceSync > options.maxStalenessMinutes) {
      return null; // Signal that request should be rejected
    }
  }
  
  return { isStale: true, check };
}

/**
 * Get a human-readable staleness message
 */
export function getStalenessMessage(check: StalenessCheck): string {
  if (!check.lastSync) {
    return 'Never synced';
  }
  
  if (check.minutesSinceSync === null) {
    return 'Unknown';
  }
  
  if (check.minutesSinceSync < 1) {
    return 'Just now';
  }
  
  if (check.minutesSinceSync < 60) {
    return `${check.minutesSinceSync} minute${check.minutesSinceSync === 1 ? '' : 's'} ago`;
  }
  
  const hours = Math.floor(check.minutesSinceSync / 60);
  if (hours < 24) {
    return `${hours} hour${hours === 1 ? '' : 's'} ago`;
  }
  
  const days = Math.floor(hours / 24);
  return `${days} day${days === 1 ? '' : 's'} ago`;
}

/**
 * Format staleness for display with warning indicator
 */
export function formatStalenessIndicator(check: StalenessCheck): {
  text: string;
  color: string;
  icon: string;
  shouldRefresh: boolean;
} {
  if (!check.lastSync) {
    return {
      text: 'Never synced',
      color: '#ef4444',
      icon: '⚠️',
      shouldRefresh: true,
    };
  }
  
  if (!check.isStale) {
    return {
      text: getStalenessMessage(check),
      color: '#10b981',
      icon: '✓',
      shouldRefresh: false,
    };
  }
  
  if (check.minutesSinceSync && check.minutesSinceSync > check.staleAfterMinutes * 2) {
    return {
      text: getStalenessMessage(check),
      color: '#ef4444',
      icon: '⚠️',
      shouldRefresh: true,
    };
  }
  
  return {
    text: getStalenessMessage(check),
    color: '#f59e0b',
    icon: '⏱️',
    shouldRefresh: true,
  };
}

/**
 * API Route handler for checking sync staleness
 */
export async function getStalenessStatus(env: Env): Promise<Response> {
  const checks = await checkAllStaleness(env.DB);
  const overallStatus = checks.every(c => !c.isStale) ? 'fresh' : 
                       checks.some(c => c.minutesSinceSync && c.minutesSinceSync > c.staleAfterMinutes * 2) ? 'error' : 'stale';
  
  return new Response(
    JSON.stringify({
      success: true,
      data: {
        checks,
        overall_status: overallStatus,
        timestamp: new Date().toISOString(),
      },
    }),
    {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    }
  );
}
