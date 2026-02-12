// Temp Type Definitions (until types.ts is found)
import type { KVNamespace, D1Database } from '@cloudflare/workers-types';

export interface Env {
	DB: D1Database;
	NEXUS_USAGE_STORE: KVNamespace;
    CORS_ORIGIN: string;
    API_VERSION: string;
    ENVIRONMENT: string;
}

// Usage & Limits API Routes
import { successResponse, errors } from '../lib/utils';

// ============================================
// GET /api/usage - Get all usage metrics from KV
// ============================================
export async function listUsageMetrics(env: Env): Promise<Response> {
  try {
    const kvData = await env.NEXUS_USAGE_STORE.get('LATEST_USAGE_DATA');

    if (!kvData) {
      return successResponse({ metrics: [], refreshed_at: new Date().toISOString() });
    }

    const tokenData = JSON.parse(kvData);
    
    let totalMonthlyTokens = 0;
    let totalMonthlyCost = 0;
    for (const modelKey in tokenData.models) {
      const model = tokenData.models[modelKey as keyof typeof tokenData.models];
      totalMonthlyTokens += (model.totalTokensIn || 0) + (model.totalTokensOut || 0);
      totalMonthlyCost += (model.estimatedCost || 0);
    }
    
    const lastSession = tokenData.sessions[tokenData.sessions.length - 1];
    const lastSessionTokens = (lastSession.tokensIn || 0) + (lastSession.tokensOut || 0);

    const metrics = [
      {
        id: 'llm_tokens_monthly',
        display_name: 'LLM Tokens (Monthly)',
        current_value: totalMonthlyTokens,
        limit_value: 5000000,
        cost_estimate: { current_cost: totalMonthlyCost },
      },
      {
        id: 'llm_tokens_session',
        display_name: 'LLM Tokens (Last Session)',
        current_value: lastSessionTokens,
        limit_value: 100000,
      }
    ];

    return successResponse({ metrics, refreshed_at: new Date().toISOString() });
  } catch (e) {
    console.error("Error fetching or parsing from KV:", e);
    return errors.internalError("Could not retrieve usage data.");
  }
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
