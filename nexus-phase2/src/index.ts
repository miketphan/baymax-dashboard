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
} from './routes/usage';

import {
  triggerUniversalSync,
  syncProjectsEndpoint,
  getSyncStatus,
  syncSpecificSection,
  getSectionContent,
} from './routes/sync';

import {
  listNotifications,
  getNotificationCountEndpoint,
  createNotificationEndpoint,
  createProjectNotification,
  markNotificationRead,
  markAllNotificationsRead,
  deleteNotificationEndpoint,
} from './routes/notifications';

import {
  getSyncHealth,
  getSectionHealth,
} from './routes/sync-health';

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
      PATCH: async (env: Env, request: Request, params: Record<string, string>) => 
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
    },
  },
  
  // Sync API
  {
    pattern: /^\/api\/sync$/,
    methods: {
      GET: async (env: Env) => getSyncStatus(env),
      POST: async (env: Env, request: Request) => triggerUniversalSync(env, request),
    },
  },
  {
    pattern: /^\/api\/sync\/projects$/,
    methods: {
      GET: async (env: Env) => syncProjectsEndpoint(env, new Request('http://localhost')),
      POST: async (env: Env, request: Request) => syncProjectsEndpoint(env, request),
    },
  },
  {
    pattern: /^\/api\/sync\/(?<section>[^/]+)$/,
    methods: {
      GET: async (env: Env, _request: Request, params: Record<string, string>) => 
        getSectionContent(env, params.section),
      POST: async (env: Env, request: Request, params: Record<string, string>) => 
        syncSpecificSection(env, params.section, request),
    },
  },
  
  // Notifications API
  {
    pattern: /^\/api\/notifications$/,
    methods: {
      GET: async (env: Env, request: Request) => listNotifications(env, request),
    },
  },
  {
    pattern: /^\/api\/notifications\/count$/,
    methods: {
      GET: async (env: Env) => getNotificationCountEndpoint(env),
    },
  },
  {
    pattern: /^\/api\/notifications\/read-all$/,
    methods: {
      POST: async (env: Env) => markAllNotificationsRead(env),
    },
  },
  {
    pattern: /^\/api\/notifications\/(?<id>[^/]+)$/,
    methods: {
      DELETE: async (env: Env, _request: Request, params: Record<string, string>) => 
        deleteNotificationEndpoint(env, params.id),
    },
  },
  {
    pattern: /^\/api\/notifications\/(?<id>[^/]+)\/read$/,
    methods: {
      PATCH: async (env: Env, _request: Request, params: Record<string, string>) => 
        markNotificationRead(env, params.id),
    },
  },
  {
    pattern: /^\/api\/notify$/,
    methods: {
      POST: async (env: Env, request: Request) => createNotificationEndpoint(env, request),
    },
  },
  {
    pattern: /^\/api\/notify\/project\/(?<id>[^/]+)$/,
    methods: {
      POST: async (env: Env, request: Request, params: Record<string, string>) => 
        createProjectNotification(env, params.id, request),
    },
  },
  
  // Sync Health / Staleness API
  {
    pattern: /^\/api\/sync\/health$/,
    methods: {
      GET: async (env: Env) => getSyncHealth(env),
    },
  },
  {
    pattern: /^\/api\/sync\/health\/(?<section>[^/]+)$/,
    methods: {
      GET: async (env: Env, _request: Request, params: Record<string, string>) => 
        getSectionHealth(env, params.section),
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
