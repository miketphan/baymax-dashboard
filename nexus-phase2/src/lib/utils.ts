// Utility functions for Nexus API

import type { ApiErrorResponse, ApiSuccessResponse, Project, Service, UsageMetric } from '../types';

// ============================================
// ID Generation
// ============================================

/**
 * Generate a unique ID with optional prefix
 */
export function generateId(prefix: string = ''): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  return prefix ? `${prefix}_${timestamp}${random}` : `${timestamp}${random}`;
}

/**
 * Generate a project ID
 */
export function generateProjectId(): string {
  return generateId('proj');
}

/**
 * Generate a usage metric ID
 */
export function generateUsageId(category: string, period: string): string {
  return `${category}_${period}`;
}

// ============================================
// Validation
// ============================================

const VALID_PROJECT_STATUSES = ['backlog', 'in_progress', 'done', 'archived'] as const;
const VALID_PRIORITIES = ['low', 'medium', 'high'] as const;
const VALID_SERVICE_STATUSES = ['online', 'attention', 'offline'] as const;

export function isValidProjectStatus(status: string): boolean {
  return VALID_PROJECT_STATUSES.includes(status as typeof VALID_PROJECT_STATUSES[number]);
}

export function isValidPriority(priority: string): boolean {
  return VALID_PRIORITIES.includes(priority as typeof VALID_PRIORITIES[number]);
}

export function isValidServiceStatus(status: string): boolean {
  return VALID_SERVICE_STATUSES.includes(status as typeof VALID_SERVICE_STATUSES[number]);
}

export function validateProjectTitle(title: unknown): string | null {
  if (typeof title !== 'string') return 'Title must be a string';
  if (title.trim().length === 0) return 'Title cannot be empty';
  if (title.length > 200) return 'Title must be less than 200 characters';
  return null;
}

export function sanitizeString(input: string | undefined | null): string | undefined {
  if (input === undefined || input === null) return undefined;
  return input.trim();
}

// ============================================
// JSON Response Helpers
// ============================================

export function jsonResponse<T>(data: T, status = 200, headers?: Record<string, string>): Response {
  const responseHeaders = {
    'Content-Type': 'application/json',
    ...headers,
  };
  
  return new Response(JSON.stringify(data), {
    status,
    headers: responseHeaders,
  });
}

export function successResponse<T>(data: T, requestId?: string): Response {
  const response: ApiSuccessResponse<T> = {
    success: true,
    data,
    meta: {
      timestamp: new Date().toISOString(),
      requestId,
    },
  };
  
  return jsonResponse(response);
}

export function errorResponse(
  code: string,
  message: string,
  status = 400,
  details?: unknown,
  requestId?: string
): Response {
  const response: ApiErrorResponse = {
    success: false,
    error: {
      code,
      message,
      details,
    },
    meta: {
      timestamp: new Date().toISOString(),
      requestId,
    },
  };
  
  return jsonResponse(response, status);
}

// Common error responses
export const errors = {
  notFound: (resource: string, requestId?: string) => 
    errorResponse('NOT_FOUND', `${resource} not found`, 404, undefined, requestId),
  
  badRequest: (message: string, details?: unknown, requestId?: string) => 
    errorResponse('BAD_REQUEST', message, 400, details, requestId),
  
  validationError: (details: unknown, requestId?: string) => 
    errorResponse('VALIDATION_ERROR', 'Validation failed', 422, details, requestId),
  
  internalError: (message = 'Internal server error', requestId?: string) => 
    errorResponse('INTERNAL_ERROR', message, 500, undefined, requestId),
  
  methodNotAllowed: (requestId?: string) => 
    errorResponse('METHOD_NOT_ALLOWED', 'Method not allowed', 405, undefined, requestId),
};

// ============================================
// CORS Helpers
// ============================================

export function getCorsHeaders(origin: string): Record<string, string> {
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Request-ID',
    'Access-Control-Max-Age': '86400',
  };
}

export function handleCors(request: Request, corsOrigin: string): Response | null {
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: getCorsHeaders(corsOrigin),
    });
  }
  return null;
}

// ============================================
// URL Parsing
// ============================================

export function getPathParams(url: string, pattern: RegExp): Record<string, string> {
  const match = url.match(pattern);
  if (!match || !match.groups) return {};
  return match.groups;
}

// ============================================
// Usage Calculations
// ============================================

export function calculateProgressPercent(current: number, limit: number): number {
  if (limit <= 0) return 0;
  return Math.min(100, Math.round((current / limit) * 100));
}

export function getUsageStatus(
  progressPercent: number,
  thresholds: { warning: number; danger: number }
): 'normal' | 'warning' | 'danger' {
  if (progressPercent >= thresholds.danger) return 'danger';
  if (progressPercent >= thresholds.warning) return 'warning';
  return 'normal';
}

export function parseMetadata(metadata: string | null | undefined): Record<string, unknown> | undefined {
  if (!metadata) return undefined;
  try {
    return JSON.parse(metadata);
  } catch {
    return undefined;
  }
}

export function stringifyMetadata(metadata: Record<string, unknown> | undefined): string | undefined {
  if (!metadata) return undefined;
  try {
    return JSON.stringify(metadata);
  } catch {
    return undefined;
  }
}
