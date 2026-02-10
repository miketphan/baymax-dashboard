// Nexus Phase 2 - TypeScript Type Definitions

// ============================================
// Project Types
// ============================================
export type ProjectStatus = 'backlog' | 'in_progress' | 'done' | 'archived';
export type ProjectPriority = 'low' | 'medium' | 'high';

export interface Project {
  id: string;
  title: string;
  description?: string;
  status: ProjectStatus;
  priority: ProjectPriority;
  sort_order: number;
  created_at: string;
  updated_at: string;
  metadata?: ProjectMetadata;
}

export interface ProjectMetadata {
  tags?: string[];
  linkedTasks?: string[];
  externalLinks?: string[];
  [key: string]: unknown;
}

export interface CreateProjectRequest {
  title: string;
  description?: string;
  status?: ProjectStatus;
  priority?: ProjectPriority;
  sort_order?: number;
  metadata?: ProjectMetadata;
}

export interface UpdateProjectRequest {
  title?: string;
  description?: string;
  status?: ProjectStatus;
  priority?: ProjectPriority;
  sort_order?: number;
  metadata?: ProjectMetadata;
}

export interface UpdateProjectStatusRequest {
  status: ProjectStatus;
}

// ============================================
// Service Types
// ============================================
export type ServiceStatus = 'online' | 'attention' | 'offline';

export interface Service {
  id: string;
  name: string;
  display_name: string;
  status: ServiceStatus;
  last_check: string | null;
  next_check: string | null;
  check_interval_minutes: number;
  details: ServiceDetails;
  created_at: string;
  updated_at: string;
}

export interface ServiceDetails {
  // Google Calendar specific
  next_event?: string | null;
  events_today?: number;
  oauth_status?: string;
  
  // Auto Backups specific
  last_backup?: string | null;
  storage_used_gb?: number;
  backup_count?: number;
  
  // Health Monitor specific
  last_heartbeat?: string | null;
  auto_heal_events?: number;
  uptime_percent?: number;
  
  // System Updates specific
  current_version?: string;
  available_version?: string | null;
  update_available?: boolean;
  
  // Security Audit specific
  last_scan?: string | null;
  warnings?: number;
  critical_issues?: number;
  
  [key: string]: unknown;
}

export interface ServicesSummary {
  online: number;
  attention: number;
  offline: number;
}

export interface ServicesResponse {
  services: Service[];
  summary: ServicesSummary;
}

// ============================================
// Usage & Limits Types
// ============================================
export type UsageCategory = 'llm_tokens' | 'brave_search' | 'api_calls' | 'llm_tokens_session';
export type UsagePeriod = 'session' | 'daily' | 'weekly' | 'monthly';

export interface UsageMetric {
  id: string;
  category: UsageCategory;
  display_name: string;
  current_value: number;
  limit_value: number;
  period: UsagePeriod;
  unit: string;
  cost_estimate?: CostEstimate;
  progress_percent: number;
  status: 'normal' | 'warning' | 'danger';
  last_updated: string | null;
  metadata?: UsageMetadata;
}

export interface CostEstimate {
  currency: string;
  current_cost: number;
  projected_cost?: number;
}

export interface UsageMetadata {
  threshold_warning?: number;
  threshold_danger?: number;
  [key: string]: unknown;
}

export interface UsageResponse {
  metrics: UsageMetric[];
  refreshed_at: string;
}

// ============================================
// Sync State Types
// ============================================
export type SyncDirection = 'to_d1' | 'to_file' | 'bidirectional';

// ============================================
// Notification Types
// ============================================
export type NotificationType = 'baymax_alert' | 'system' | 'project_update';
export type NotificationStatus = 'unread' | 'read' | 'acknowledged';

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message?: string;
  source_id?: string;
  source_type?: string;
  status: NotificationStatus;
  created_at: string;
  read_at?: string;
  metadata?: Record<string, unknown>;
}

export interface CreateNotificationRequest {
  type?: NotificationType;
  title: string;
  message?: string;
  source_id?: string;
  source_type?: string;
  metadata?: Record<string, unknown>;
}

export interface NotificationCount {
  total: number;
  unread: number;
}

// ============================================
// Project Activity Log Types
// ============================================
export type ProjectActivityAction = 'created' | 'updated' | 'deleted' | 'status_changed' | 'priority_changed';

export interface ProjectActivityLog {
  id: number;
  project_id: string;
  action: ProjectActivityAction;
  field?: string;
  old_value?: string;
  new_value?: string;
  created_at: string;
  metadata?: Record<string, unknown>;
}

export interface SyncState {
  section: string;
  last_sync: string | null;
  etag: string | null;
  stale_after_minutes: number;
  sync_direction: SyncDirection;
  last_error: string | null;
  retry_count: number;
  created_at: string;
  updated_at: string;
}

// ============================================
// API Response Types
// ============================================
export interface ApiSuccessResponse<T> {
  success: true;
  data: T;
  meta?: {
    timestamp: string;
    requestId?: string;
  };
}

export interface ApiErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
  meta?: {
    timestamp: string;
    requestId?: string;
  };
}

export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;

// ============================================
// Health Check Types
// ============================================
export interface HealthCheckResponse {
  status: 'healthy' | 'degraded' | 'unhealthy';
  version: string;
  environment: string;
  timestamp: string;
  checks: {
    database: boolean;
    [key: string]: boolean;
  };
}

// ============================================
// D1 Database Types
// ============================================
export interface D1Database {
  prepare(query: string): D1PreparedStatement;
  exec(query: string): Promise<D1ExecResult>;
  batch<T>(statements: D1PreparedStatement[]): Promise<D1Result<T>[]>;
  dump(): Promise<ArrayBuffer>;
}

export interface D1PreparedStatement {
  bind(...values: unknown[]): D1PreparedStatement;
  first<T>(): Promise<T | null>;
  run(): Promise<D1ExecResult>;
  all<T>(): Promise<D1Result<T>>;
  raw<T>(): Promise<T[]>;
}

export interface D1ExecResult {
  count: number;
  duration: number;
  success: boolean;
}

export interface D1Result<T> {
  results: T[];
  success: boolean;
  error?: string;
  meta?: {
    duration: number;
    changes?: number;
    last_row_id?: number;
    size_after?: number;
  };
}

// ============================================
// Environment Types
// ============================================
export interface Env {
  DB: D1Database;
  ENVIRONMENT: string;
  API_VERSION: string;
  CORS_ORIGIN: string;
}

// ============================================
// Route Handler Types
// ============================================
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'OPTIONS';

export interface RouteContext {
  request: Request;
  env: Env;
  params: Record<string, string>;
}

export type RouteHandler = (ctx: RouteContext) => Promise<Response> | Response;
