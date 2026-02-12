// Usage & Limits API Routes

import type { Env, UsageMetric } from '../types';
import { getAllUsageMetrics, getUsageMetricByCategory, updateUsageMetric } from '../lib/db';
import { successResponse, errors } from '../lib/utils';

// ============================================
// GET /api/usage - Get all usage metrics
// ============================================
export async function listUsageMetrics(env: Env): Promise<Response> {
  // Return a hardcoded, static response for debugging
  const staticMetrics = {
    metrics: [
      {
        id: 'llm_tokens_monthly',
        display_name: 'LLM Tokens (Monthly)',
        current_value: 12345,
        limit_value: 5000000,
      },
      {
        id: 'llm_tokens_session',
        display_name: 'LLM Tokens (Last Session)',
        current_value: 678,
        limit_value: 100000,
      },
    ],
    refreshed_at: new Date().toISOString(),
  };

  return successResponse(staticMetrics);
}

/*
// ============================================
// GET /api/usage/:category - Get specific category
// ============================================
export async function getUsageCategory(env: Env, category: string): Promise<Response> {
  const metric = await getUsageMetricByCategory(env.DB, category);
  
  if (!metric) {
    return errors.notFound('Usage category');
  }
  
  return successResponse(metric);
}

// ============================================
// POST /api/usage/:category/sync - Trigger usage refresh
// ============================================
export async function syncUsageCategory(env: Env, category: string): Promise<Response> {
  const existing = await getUsageMetricByCategory(env.DB, category);
  
  if (!existing) {
    return errors.notFound('Usage category');
  }
  
  // In a real implementation, this would query actual usage data
  // For now, we'll simulate with demo data
  const now = new Date().toISOString();
  
  let updates: Partial<Pick<UsageMetric, 'current_value' | 'cost_estimate'>> = {};
  
  switch (category) {
    case 'llm_tokens':
      updates = {
        current_value: 45000,
        cost_estimate: {
          currency: 'USD',
          current_cost: 2.25,
          projected_cost: 5.50,
        },
      };
      break;
      
    case 'brave_search':
      updates = {
        current_value: 1845,
      };
      break;
      
    case 'api_calls':
      updates = {
        current_value: 23,
      };
      break;
      
    case 'llm_tokens_session':
      updates = {
        current_value: 1250,
        cost_estimate: {
          currency: 'USD',
          current_cost: 0.0625,
        },
      };
      break;
      
    default:
      return errors.badRequest(`Unknown usage category: ${category}`);
  }
  
  const updated = await updateUsageMetric(env.DB, category, updates);
  
  if (!updated) {
    return errors.internalError('Failed to sync usage metric');
  }
  
  return successResponse({
    metric: updated,
    synced_at: now,
  });
}

// ============================================
// POST /api/usage/sync-all - Sync all usage metrics
// ============================================
export async function syncAllUsage(env: Env): Promise<Response> {
  const categories = ['llm_tokens', 'brave_search', 'api_calls', 'llm_tokens_session'];
  const now = new Date().toISOString();
  const results: UsageMetric[] = [];
  
  for (const category of categories) {
    const existing = await getUsageMetricByCategory(env.DB, category);
    
    if (!existing) continue;
    
    let updates: Partial<Pick<UsageMetric, 'current_value' | 'cost_estimate'>> = {};
    
    switch (category) {
      case 'llm_tokens':
        updates = {
          current_value: 45000,
          cost_estimate: {
            currency: 'USD',
            current_cost: 2.25,
            projected_cost: 5.50,
          },
        };
        break;
        
      case 'brave_search':
        updates = {
          current_value: 1845,
        };
        break;
        
      case 'api_calls':
        updates = {
          current_value: 23,
        };
        break;
        
      case 'llm_tokens_session':
        updates = {
          current_value: 1250,
          cost_estimate: {
            currency: 'USD',
            current_cost: 0.0625,
          },
        };
        break;
    }
    
    const updated = await updateUsageMetric(env.DB, category, updates);
    if (updated) {
      results.push(updated);
    }
  }
  
  return successResponse({
    metrics: results,
    synced_at: now,
  });
}

// ============================================
// POST /api/usage/:category/increment - Increment usage (internal API)
// ============================================
export async function incrementUsage(
  env: Env,
  category: string,
  request: Request
): Promise<Response> {
  const existing = await getUsageMetricByCategory(env.DB, category);
  
  if (!existing) {
    return errors.notFound('Usage category');
  }
  
  let body: { amount?: number };
  
  try {
    body = await request.json() as { amount?: number };
  } catch {
    body = { amount: 1 };
  }
  
  const amount = body.amount ?? 1;
  const newValue = existing.current_value + amount;
  
  const updated = await updateUsageMetric(env.DB, category, {
    current_value: newValue,
  });
  
  if (!updated) {
    return errors.internalError('Failed to increment usage');
  }
  
  return successResponse({
    metric: updated,
    previous_value: existing.current_value,
    increment: amount,
  });
}
*/
