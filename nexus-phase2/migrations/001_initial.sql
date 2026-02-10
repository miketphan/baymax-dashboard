-- Migration: 001_initial
-- Description: Initial schema creation for Nexus Phase 2
-- Created: 2026-02-10

-- Drop existing tables if they exist (for clean migration)
DROP TABLE IF EXISTS projects;
DROP TABLE IF EXISTS services;
DROP TABLE IF EXISTS usage_limits;
DROP TABLE IF EXISTS sync_state;

-- ============================================
-- Table: projects
-- ============================================
CREATE TABLE projects (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    status TEXT CHECK(status IN ('backlog', 'in_progress', 'done', 'archived')) DEFAULT 'backlog',
    priority TEXT CHECK(priority IN ('low', 'medium', 'high')) DEFAULT 'medium',
    sort_order INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    metadata TEXT
);

CREATE INDEX idx_projects_status ON projects(status);
CREATE INDEX idx_projects_priority ON projects(priority);
CREATE INDEX idx_projects_sort_order ON projects(sort_order);
CREATE INDEX idx_projects_updated_at ON projects(updated_at);

-- ============================================
-- Table: services
-- ============================================
CREATE TABLE services (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    display_name TEXT,
    status TEXT CHECK(status IN ('online', 'attention', 'offline')) DEFAULT 'offline',
    last_check DATETIME,
    next_check DATETIME,
    check_interval_minutes INTEGER DEFAULT 5,
    details TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_services_status ON services(status);
CREATE INDEX idx_services_last_check ON services(last_check);

-- ============================================
-- Table: usage_limits
-- ============================================
CREATE TABLE usage_limits (
    id TEXT PRIMARY KEY,
    category TEXT NOT NULL UNIQUE,
    display_name TEXT,
    current_value INTEGER DEFAULT 0,
    limit_value INTEGER,
    period TEXT CHECK(period IN ('session', 'daily', 'weekly', 'monthly')) DEFAULT 'monthly',
    unit TEXT,
    cost_estimate TEXT,
    last_updated DATETIME,
    metadata TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_usage_category ON usage_limits(category);
CREATE INDEX idx_usage_period ON usage_limits(period);

-- ============================================
-- Table: sync_state
-- ============================================
CREATE TABLE sync_state (
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

CREATE INDEX idx_sync_state_last_sync ON sync_state(last_sync);

-- ============================================
-- Triggers for auto-updating updated_at
-- ============================================
CREATE TRIGGER trigger_projects_updated_at 
AFTER UPDATE ON projects
BEGIN
    UPDATE projects SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

CREATE TRIGGER trigger_services_updated_at 
AFTER UPDATE ON services
BEGIN
    UPDATE services SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

CREATE TRIGGER trigger_usage_limits_updated_at 
AFTER UPDATE ON usage_limits
BEGIN
    UPDATE usage_limits SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

CREATE TRIGGER trigger_sync_state_updated_at 
AFTER UPDATE ON sync_state
BEGIN
    UPDATE sync_state SET updated_at = CURRENT_TIMESTAMP WHERE section = NEW.section;
END;

-- ============================================
-- Seed Data: Default Services
-- ============================================
INSERT INTO services (id, name, display_name, status, check_interval_minutes, details) VALUES
('google_calendar', 'google_calendar', '📅 Google Calendar', 'offline', 5, '{"next_event": null, "events_today": 0, "oauth_status": "disconnected"}'),
('auto_backups', 'auto_backups', '💾 Auto Backups', 'offline', 5, '{"last_backup": null, "storage_used_gb": 0, "backup_count": 0}'),
('health_monitor', 'health_monitor', '🩺 Health Monitor', 'offline', 5, '{"last_heartbeat": null, "auto_heal_events": 0, "uptime_percent": 100}'),
('system_updates', 'system_updates', '🔄 System Updates', 'offline', 60, '{"current_version": "unknown", "available_version": null, "update_available": false}'),
('security_audit', 'security_audit', '🔒 Security Audit', 'offline', 1440, '{"last_scan": null, "warnings": 0, "critical_issues": 0}');

-- ============================================
-- Seed Data: Default Usage Categories
-- ============================================
INSERT INTO usage_limits (id, category, display_name, current_value, limit_value, period, unit, cost_estimate, metadata) VALUES
('llm_tokens_monthly', 'llm_tokens', 'LLM Tokens (Monthly)', 0, 100000, 'monthly', 'tokens', '{"currency": "USD", "current_cost": 0, "projected_cost": 0}', '{"threshold_warning": 70, "threshold_danger": 90}'),
('brave_search_monthly', 'brave_search', 'Brave Search (Monthly)', 0, 2000, 'monthly', 'queries', null, '{"threshold_warning": 80, "threshold_danger": 95}'),
('api_calls_daily', 'api_calls', 'API Calls (Daily)', 0, 10000, 'daily', 'calls', null, '{"threshold_warning": 85, "threshold_danger": 98}'),
('llm_tokens_session', 'llm_tokens_session', 'LLM Tokens (Session)', 0, 5000, 'session', 'tokens', '{"currency": "USD", "current_cost": 0}', '{"threshold_warning": 80, "threshold_danger": 100}');

-- ============================================
-- Seed Data: Default Sync State
-- ============================================
INSERT INTO sync_state (section, stale_after_minutes, sync_direction) VALUES
('projects', 10, 'bidirectional'),
('services', 5, 'to_d1'),
('usage_limits', 5, 'to_d1'),
('operations_manual', 60, 'to_file'),
('system_config', 30, 'bidirectional');
