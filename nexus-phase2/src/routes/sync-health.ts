// Sync Health & Staleness API Routes

import type { Env } from '../types';
import { 
  checkStaleness, 
  checkAllStaleness,
  getStalenessMessage,
  formatStalenessIndicator,
} from '../lib/staleness';
import { successResponse, errors } from '../lib/utils';

// ============================================
// GET /api/sync/health - Get detailed staleness info
// ============================================
export async function getSyncHealth(env: Env): Promise<Response> {
  const checks = await checkAllStaleness(env.DB);
  
  const overallStatus = checks.every(c => !c.isStale) ? 'fresh' : 
                       checks.some(c => c.minutesSinceSync && c.minutesSinceSync > c.staleAfterMinutes * 2) ? 'error' : 'stale';
  
  const sectionsWithIndicators = checks.map(check => ({
    ...check,
    display: formatStalenessIndicator(check),
    message: getStalenessMessage(check),
  }));
  
  return successResponse({
    sections: sectionsWithIndicators,
    overall_status: overallStatus,
    timestamp: new Date().toISOString(),
  });
}

// ============================================
// GET /api/sync/health/:section - Get staleness for specific section
// ============================================
export async function getSectionHealth(env: Env, section: string): Promise<Response> {
  const check = await checkStaleness(env.DB, section);
  
  return successResponse({
    section,
    ...check,
    display: formatStalenessIndicator(check),
    message: getStalenessMessage(check),
    timestamp: new Date().toISOString(),
  });
}
