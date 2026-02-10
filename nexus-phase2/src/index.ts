// Nexus API - Cloudflare Workers Entry Point
// Handles routing and CORS for all API endpoints

import type { Env, HealthCheckResponse } from './types';
import { checkDatabaseHealth } from './lib/db';
import {
  successResponse,
  errors,
  handleCors,
  getCorsHeaders,
  jsonResponse,
} from './lib/utils';

// Import route handlers
import {
  listProjects,
  getProject,
  createNewProject,
  updateExistingProject,
  updateProjectStatus,
  deleteExistingProject,
} from './routes/projects';

import {
  listServices,
  getService,
  refreshService,
  refreshAllServices,
} from './routes/services';

import {
  listUsageMetrics,
  getUsageCategory,
  syncUsageCategory,
  syncAllUsage,
} from './routes/usage';

// ============================================
// Router
// ============================================

interface Route {
  pattern: RegExp;
  methods: Record<string, (env: Env, request: Request, params: Record<string, string>) => Promise<Response>>;
}

const routes: Route[] = [
  // Health check
  {
    pattern: /^\/health$/,
    methods: {
      GET: async (env: Env) => {
        const dbHealthy = await checkDatabaseHealth(env.DB);
        
        const health: HealthCheckResponse = {
          status: dbHealthy ? 'healthy' : 'unhealthy',
          version: env.API_VERSION,
          environment: env.ENVIRONMENT,
          timestamp: new Date().toISOString(),
          checks: {
            database: dbHealthy,
          },
        };
        
        return jsonResponse(health, dbHealthy ? 200 : 503);
      },
    },
  },
  
  // Projects API
  {
    pattern: /^\/api\/projects$/,
    methods: {
      GET: async (env: Env) => listProjects(env),
      POST: async (env: Env, request: Request) => createNewProject(env, request),
    },
  },
  {
    pattern: /^\/api\/projects\/(?<id>[^/]+)$/,
    methods: {
      GET: async (env: Env, _request: Request, params: Record<string, string>) => 
        getProject(env, params.id),
      PUT: async (env: Env, request: Request, params: Record<string, string>) => 
        updateExistingProject(env, params.id, request),
      DELETE: async (env: Env, _request: Request, params: Record<string, string>) => 
        deleteExistingProject(env, params.id),
    },
  },
  {
    pattern: /^\/api\/projects\/(?<id>[^/]+)\/status$/,
    methods: {
      PATCH: async (env: Env, request: Request, params: Record<string, string>) => 
        updateProjectStatus(env, params.id, request),
    },
  },
  
  // Services API
  {
    pattern: /^\/api\/services$/,
    methods: {
      GET: async (env: Env) => listServices(env),
      POST: async (env: Env) => refreshAllServices(env),
    },
  },
  {
    pattern: /^\/api\/services\/(?<id>[^/]+)$/,
    methods: {
      GET: async (env: Env, _request: Request, params: Record<string, string>) => 
        getService(env, params.id),
    },
  },
  {
    pattern: /^\/api\/services\/(?<id>[^/]+)\/refresh$/,
    methods: {
      POST: async (env: Env, _request: Request, params: Record<string, string>) => 
        refreshService(env, params.id),
    },
  },
  
  // Usage & Limits API
  {
    pattern: /^\/api\/usage$/,
    methods: {
      GET: async (env: Env) => listUsageMetrics(env),
      POST: async (env: Env) => syncAllUsage(env),
    },
  },
  {
    pattern: /^\/api\/usage\/(?<category>[^/]+)$/,
    methods: {
      GET: async (env: Env, _request: Request, params: Record<string, string>) => 
        getUsageCategory(env, params.category),
    },
  },
  {
    pattern: /^\/api\/usage\/(?<category>[^/]+)\/sync$/,
    methods: {
      POST: async (env: Env, _request: Request, params: Record<string, string>) => 
        syncUsageCategory(env, params.category),
    },
  },
];

// ============================================
// Main Handler
// ============================================

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const pathname = url.pathname;
    
    // Handle CORS preflight
    const corsResponse = handleCors(request, env.CORS_ORIGIN);
    if (corsResponse) return corsResponse;
    
    // Add CORS headers to all responses
    const corsHeaders = getCorsHeaders(env.CORS_ORIGIN);
    
    try {
      // Find matching route
      for (const route of routes) {
        const match = pathname.match(route.pattern);
        if (match) {
          const method = request.method;
          const handler = route.methods[method];
          
          if (!handler) {
            const response = errors.methodNotAllowed();
            // Add CORS headers
            Object.entries(corsHeaders).forEach(([key, value]) => {
              response.headers.set(key, value);
            });
            return response;
          }
          
          const params = match.groups || {};
          const response = await handler(env, request, params);
          
          // Add CORS headers to response
          Object.entries(corsHeaders).forEach(([key, value]) => {
            response.headers.set(key, value);
          });
          
          return response;
        }
      }
      
      // No route matched - return 404
      const response = errors.notFound('Endpoint');
      Object.entries(corsHeaders).forEach(([key, value]) => {
        response.headers.set(key, value);
      });
      return response;
      
    } catch (error) {
      console.error('Unhandled error:', error);
      const response = errors.internalError();
      Object.entries(corsHeaders).forEach(([key, value]) => {
        response.headers.set(key, value);
      });
      return response;
    }
  },
};
