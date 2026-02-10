-- Nexus Phase 2 - D1 Database Schema
-- Created: 2026-02-10
-- Description: Core tables for Projects, Services, Usage Tracking, and Sync State

-- ============================================
-- Table: projects
-- Description: Core project management table for Kanban board
-- ============================================
CREATE TABLE IF NOT EXISTS projects (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    status TEXT CHECK(status IN ('backlog', 'in_progress', 'done', 'archived')) DEFAULT 'backlog',
    priority TEXT CHECK(priority IN ('low', 'medium', 'high')) DEFAULT 'medium',
    sort_order INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    metadata TEXT -- JSON for extensibility (tags, links, etc.)
);

-- Indexes for projects table
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
CREATE INDEX IF NOT EXISTS idx_projects_priority ON projects(priority);
CREATE INDEX IF NOT EXISTS idx_projects_sort_order ON projects(sort_order);
CREATE INDEX IF NOT EXISTS idx_projects_updated_at ON projects(updated_at);

-- ============================================
-- Table: services
-- Description: Connected services status monitoring
-- ============================================
CREATE TABLE IF NOT EXISTS services (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    display_name TEXT,
    status TEXT CHECK(status IN ('online', 'attention', 'offline')) DEFAULT 'offline',
    last_check DATETIME,
    next_check DATETIME,
    check_interval_minutes INTEGER DEFAULT 5,
    details TEXT, -- JSON for service-specific data
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for services table
CREATE INDEX IF NOT EXISTS idx_services_status ON services(status);
CREATE INDEX IF NOT EXISTS idx_services_last_check ON services(last_check);

-- ============================================
-- Table: usage_limits
-- Description: Usage tracking and limits for various resources
-- ============================================
CREATE TABLE IF NOT EXISTS usage_limits (
    id TEXT PRIMARY KEY,
    category TEXT NOT NULL UNIQUE, -- 'llm_tokens', 'brave_search', 'api_calls'
    display_name TEXT,
    current_value INTEGER DEFAULT 0,
    limit_value INTEGER,
    period TEXT CHECK(period IN ('session', 'daily', 'weekly', 'monthly')) DEFAULT 'monthly',
    unit TEXT, -- 'tokens', 'queries', 'calls', etc.
    cost_estimate TEXT, -- JSON for cost breakdown
    last_updated DATETIME,
    metadata TEXT, -- JSON for thresholds, alerts, etc.
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for usage_limits table
CREATE INDEX IF NOT EXISTS idx_usage_category ON usage_limits(category);
CREATE INDEX IF NOT EXISTS idx_usage_period ON usage_limits(period);

-- ============================================
-- Table: sync_state
-- Description: Tracks sync state for Smart Cascade and bidirectional sync
-- ============================================
CREATE TABLE IF NOT EXISTS sync_state (
    section TEXT PRIMARY KEY,
    last_sync DATETIME,
    etag TEXT,
    stale_after_minutes INTEGER DEFAULT 10,
    sync_direction TEXT CHECK(sync_direction IN ('to_d1', 'to_file', 'bidirectional')) DEFAULT 'bidirectional',
    last_error TEXT,
    retry_count INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Index for sync_state
CREATE INDEX IF NOT EXISTS idx_sync_state_last_sync ON sync_state(last_sync);

-- ============================================
-- Seed Data: Default Services
-- ============================================
INSERT OR IGNORE INTO services (id, name, display_name, status, check_interval_minutes, details) VALUES
('google_calendar', 'google_calendar', '📅 Google Calendar', 'offline', 5, '{"next_event": null, "events_today": 0, "oauth_status": "disconnected"}'),
('auto_backups', 'auto_backups', '💾 Auto Backups', 'offline', 5, '{"last_backup": null, "storage_used_gb": 0, "backup_count": 0}'),
('health_monitor', 'health_monitor', '🩺 Health Monitor', 'offline', 5, '{"last_heartbeat": null, "auto_heal_events": 0, "uptime_percent": 100}'),
('system_updates', 'system_updates', '🔄 System Updates', 'offline', 60, '{"current_version": "unknown", "available_version": null, "update_available": false}'),
('security_audit', 'security_audit', '🔒 Security Audit', 'offline', 1440, '{"last_scan": null, "warnings": 0, "critical_issues": 0}');

-- ============================================
-- Seed Data: Default Usage Categories
-- ============================================
INSERT OR IGNORE INTO usage_limits (id, category, display_name, current_value, limit_value, period, unit, cost_estimate, metadata) VALUES
('llm_tokens_monthly', 'llm_tokens', 'LLM Tokens (Monthly)', 0, 100000, 'monthly', 'tokens', '{"currency": "USD", "current_cost": 0, "projected_cost": 0}', '{"threshold_warning": 70, "threshold_danger": 90}'),
('brave_search_monthly', 'brave_search', 'Brave Search (Monthly)', 0, 2000, 'monthly', 'queries', null, '{"threshold_warning": 80, "threshold_danger": 95}'),
('api_calls_daily', 'api_calls', 'API Calls (Daily)', 0, 10000, 'daily', 'calls', null, '{"threshold_warning": 85, "threshold_danger": 98}'),
('llm_tokens_session', 'llm_tokens_session', 'LLM Tokens (Session)', 0, 5000, 'session', 'tokens', '{"currency": "USD", "current_cost": 0}', '{"threshold_warning": 80, "threshold_danger": 100}');

-- ============================================
-- Seed Data: Default Sync State
-- ============================================
INSERT OR IGNORE INTO sync_state (section, stale_after_minutes, sync_direction) VALUES
('projects', 10, 'bidirectional'),
('services', 5, 'to_d1'),
('usage_limits', 5, 'to_d1'),
('operations_manual', 60, 'to_file'),
('system_config', 30, 'bidirectional');

-- ============================================
-- Table: notifications
-- Description: Stores notifications for Baymax/alert system
-- ============================================
CREATE TABLE IF NOT EXISTS notifications (
    id TEXT PRIMARY KEY,
    type TEXT NOT NULL CHECK(type IN ('baymax_alert', 'system', 'project_update')),
    title TEXT NOT NULL,
    message TEXT,
    source_id TEXT, -- e.g., project_id, service_id, etc.
    source_type TEXT, -- e.g., 'project', 'service'
    status TEXT CHECK(status IN ('unread', 'read', 'acknowledged')) DEFAULT 'unread',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    read_at DATETIME,
    metadata TEXT -- JSON for extensibility
);

-- Index for notifications
CREATE INDEX IF NOT EXISTS idx_notifications_status ON notifications(status);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at);
CREATE INDEX IF NOT EXISTS idx_notifications_source ON notifications(source_id, source_type);

-- ============================================
-- Table: project_activity_log
-- Description: Tracks changes to projects for history/audit
-- ============================================
CREATE TABLE IF NOT EXISTS project_activity_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    project_id TEXT NOT NULL,
    action TEXT NOT NULL CHECK(action IN ('created', 'updated', 'deleted', 'status_changed', 'priority_changed')),
    field TEXT, -- which field changed (for updates)
    old_value TEXT,
    new_value TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    metadata TEXT -- JSON for additional context
);

-- Index for activity log
CREATE INDEX IF NOT EXISTS idx_activity_project_id ON project_activity_log(project_id);
CREATE INDEX IF NOT EXISTS idx_activity_created_at ON project_activity_log(created_at);

-- ============================================
-- Trigger: Auto-update updated_at timestamp
-- ============================================
CREATE TRIGGER IF NOT EXISTS trigger_projects_updated_at 
AFTER UPDATE ON projects
BEGIN
    UPDATE projects SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

CREATE TRIGGER IF NOT EXISTS trigger_services_updated_at 
AFTER UPDATE ON services
BEGIN
    UPDATE services SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

CREATE TRIGGER IF NOT EXISTS trigger_usage_limits_updated_at 
AFTER UPDATE ON usage_limits
BEGIN
    UPDATE usage_limits SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

CREATE TRIGGER IF NOT EXISTS trigger_sync_state_updated_at 
AFTER UPDATE ON sync_state
BEGIN
    UPDATE sync_state SET updated_at = CURRENT_TIMESTAMP WHERE section = NEW.section;
END;
