// Database query helpers for D1

import type { D1Database, Project, Service, UsageMetric, SyncState, Notification, ProjectActivityLog } from '../types';
import { parseMetadata, stringifyMetadata, calculateProgressPercent, getUsageStatus } from './utils';

// ============================================
// Projects Queries
// ============================================

export async function getAllProjects(db: D1Database): Promise<Project[]> {
  const result = await db
    .prepare(`
      SELECT * FROM projects 
      ORDER BY 
        CASE status 
          WHEN 'backlog' THEN 1 
          WHEN 'in_progress' THEN 2 
          WHEN 'done' THEN 3 
          WHEN 'archived' THEN 4 
        END,
        sort_order ASC,
        created_at DESC
    `)
    .all<{
      id: string;
      title: string;
      description: string | null;
      status: string;
      priority: string;
      sort_order: number;
      created_at: string;
      updated_at: string;
      metadata: string | null;
    }>();
  
  if (!result.success) return [];
  
  return result.results.map(row => ({
    id: row.id,
    title: row.title,
    description: row.description ?? undefined,
    status: row.status as Project['status'],
    priority: row.priority as Project['priority'],
    sort_order: row.sort_order,
    created_at: row.created_at,
    updated_at: row.updated_at,
    metadata: parseMetadata(row.metadata),
  }));
}

export async function getProjectById(db: D1Database, id: string): Promise<Project | null> {
  const result = await db
    .prepare('SELECT * FROM projects WHERE id = ?')
    .bind(id)
    .first<{
      id: string;
      title: string;
      description: string | null;
      status: string;
      priority: string;
      sort_order: number;
      created_at: string;
      updated_at: string;
      metadata: string | null;
    }>();
  
  if (!result) return null;
  
  return {
    id: result.id,
    title: result.title,
    description: result.description ?? undefined,
    status: result.status as Project['status'],
    priority: result.priority as Project['priority'],
    sort_order: result.sort_order,
    created_at: result.created_at,
    updated_at: result.updated_at,
    metadata: parseMetadata(result.metadata),
  };
}

export async function createProject(
  db: D1Database,
  project: Omit<Project, 'created_at' | 'updated_at'>
): Promise<Project> {
  const metadata = stringifyMetadata(project.metadata);
  
  await db
    .prepare(`
      INSERT INTO projects (id, title, description, status, priority, sort_order, metadata)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `)
    .bind(
      project.id,
      project.title,
      project.description ?? null,
      project.status,
      project.priority,
      project.sort_order,
      metadata ?? null
    )
    .run();
  
  // Fetch the created project to get timestamps
  const created = await getProjectById(db, project.id);
  if (!created) throw new Error('Failed to create project');
  
  return created;
}

export async function updateProject(
  db: D1Database,
  id: string,
  updates: Partial<Pick<Project, 'title' | 'description' | 'status' | 'priority' | 'sort_order' | 'metadata'>>
): Promise<Project | null> {
  const existing = await getProjectById(db, id);
  if (!existing) return null;
  
  const fields: string[] = [];
  const values: (string | number | null)[] = [];
  
  if (updates.title !== undefined) {
    fields.push('title = ?');
    values.push(updates.title);
  }
  if (updates.description !== undefined) {
    fields.push('description = ?');
    values.push(updates.description ?? null);
  }
  if (updates.status !== undefined) {
    fields.push('status = ?');
    values.push(updates.status);
  }
  if (updates.priority !== undefined) {
    fields.push('priority = ?');
    values.push(updates.priority);
  }
  if (updates.sort_order !== undefined) {
    fields.push('sort_order = ?');
    values.push(updates.sort_order);
  }
  if (updates.metadata !== undefined) {
    fields.push('metadata = ?');
    values.push(stringifyMetadata(updates.metadata) ?? null);
  }
  
  if (fields.length === 0) return existing;
  
  values.push(id);
  
  await db
    .prepare(`UPDATE projects SET ${fields.join(', ')} WHERE id = ?`)
    .bind(...values)
    .run();
  
  return getProjectById(db, id);
}

export async function deleteProject(db: D1Database, id: string): Promise<boolean> {
  try {
    const result = await db
      .prepare('DELETE FROM projects WHERE id = ?')
      .bind(id)
      .run();
    
    console.log('Delete result:', JSON.stringify({
      success: result.success,
      count: result.count,
      meta: result.meta,
    }));
    
    // D1 returns count in result.meta?.changes or result.count depending on version
    const changes = result.count ?? result.meta?.changes ?? 0;
    return result.success && changes > 0;
  } catch (error) {
    console.error('Delete error:', error);
    throw error;
  }
}

// ============================================
// Services Queries
// ============================================

export async function getAllServices(db: D1Database): Promise<Service[]> {
  const result = await db
    .prepare('SELECT * FROM services ORDER BY display_name ASC')
    .all<{
      id: string;
      name: string;
      display_name: string;
      status: string;
      last_check: string | null;
      next_check: string | null;
      check_interval_minutes: number;
      details: string | null;
      created_at: string;
      updated_at: string;
    }>();
  
  if (!result.success) return [];
  
  return result.results.map(row => ({
    id: row.id,
    name: row.name,
    display_name: row.display_name,
    status: row.status as Service['status'],
    last_check: row.last_check,
    next_check: row.next_check,
    check_interval_minutes: row.check_interval_minutes,
    details: parseMetadata(row.details) ?? {},
    created_at: row.created_at,
    updated_at: row.updated_at,
  }));
}

export async function getServiceById(db: D1Database, id: string): Promise<Service | null> {
  const result = await db
    .prepare('SELECT * FROM services WHERE id = ?')
    .bind(id)
    .first<{
      id: string;
      name: string;
      display_name: string;
      status: string;
      last_check: string | null;
      next_check: string | null;
      check_interval_minutes: number;
      details: string | null;
      created_at: string;
      updated_at: string;
    }>();
  
  if (!result) return null;
  
  return {
    id: result.id,
    name: result.name,
    display_name: result.display_name,
    status: result.status as Service['status'],
    last_check: result.last_check,
    next_check: result.next_check,
    check_interval_minutes: result.check_interval_minutes,
    details: parseMetadata(result.details) ?? {},
    created_at: result.created_at,
    updated_at: result.updated_at,
  };
}

export async function updateService(
  db: D1Database,
  id: string,
  updates: Partial<Pick<Service, 'status' | 'last_check' | 'next_check' | 'details'>>
): Promise<Service | null> {
  const existing = await getServiceById(db, id);
  if (!existing) return null;
  
  const fields: string[] = [];
  const values: (string | null)[] = [];
  
  if (updates.status !== undefined) {
    fields.push('status = ?');
    values.push(updates.status);
  }
  if (updates.last_check !== undefined) {
    fields.push('last_check = ?');
    values.push(updates.last_check);
  }
  if (updates.next_check !== undefined) {
    fields.push('next_check = ?');
    values.push(updates.next_check);
  }
  if (updates.details !== undefined) {
    fields.push('details = ?');
    values.push(stringifyMetadata(updates.details) ?? null);
  }
  
  if (fields.length === 0) return existing;
  
  values.push(id);
  
  await db
    .prepare(`UPDATE services SET ${fields.join(', ')} WHERE id = ?`)
    .bind(...values)
    .run();
  
  return getServiceById(db, id);
}

// ============================================
// Usage & Limits Queries
// ============================================

export async function getAllUsageMetrics(db: D1Database): Promise<UsageMetric[]> {
  const result = await db
    .prepare('SELECT * FROM usage_limits ORDER BY display_name ASC')
    .all<{
      id: string;
      category: string;
      display_name: string;
      current_value: number;
      limit_value: number;
      period: string;
      unit: string;
      cost_estimate: string | null;
      last_updated: string | null;
      metadata: string | null;
    }>();
  
  if (!result.success) return [];
  
  return result.results.map(row => {
    const metadata = parseMetadata(row.metadata) as { threshold_warning?: number; threshold_danger?: number } | undefined;
    const progressPercent = calculateProgressPercent(row.current_value, row.limit_value);
    
    return {
      id: row.id,
      category: row.category as UsageMetric['category'],
      display_name: row.display_name,
      current_value: row.current_value,
      limit_value: row.limit_value,
      period: row.period as UsageMetric['period'],
      unit: row.unit,
      cost_estimate: parseMetadata(row.cost_estimate) as UsageMetric['cost_estimate'],
      progress_percent: progressPercent,
      status: getUsageStatus(progressPercent, {
        warning: metadata?.threshold_warning ?? 70,
        danger: metadata?.threshold_danger ?? 90,
      }),
      last_updated: row.last_updated,
      metadata,
    };
  });
}

export async function getUsageMetricByCategory(
  db: D1Database,
  category: string
): Promise<UsageMetric | null> {
  const result = await db
    .prepare('SELECT * FROM usage_limits WHERE category = ?')
    .bind(category)
    .first<{
      id: string;
      category: string;
      display_name: string;
      current_value: number;
      limit_value: number;
      period: string;
      unit: string;
      cost_estimate: string | null;
      last_updated: string | null;
      metadata: string | null;
    }>();
  
  if (!result) return null;
  
  const metadata = parseMetadata(result.metadata) as { threshold_warning?: number; threshold_danger?: number } | undefined;
  const progressPercent = calculateProgressPercent(result.current_value, result.limit_value);
  
  return {
    id: result.id,
    category: result.category as UsageMetric['category'],
    display_name: result.display_name,
    current_value: result.current_value,
    limit_value: result.limit_value,
    period: result.period as UsageMetric['period'],
    unit: result.unit,
    cost_estimate: parseMetadata(result.cost_estimate) as UsageMetric['cost_estimate'],
    progress_percent: progressPercent,
    status: getUsageStatus(progressPercent, {
      warning: metadata?.threshold_warning ?? 70,
      danger: metadata?.threshold_danger ?? 90,
    }),
    last_updated: result.last_updated,
    metadata,
  };
}

export async function updateUsageMetric(
  db: D1Database,
  category: string,
  updates: Partial<Pick<UsageMetric, 'current_value' | 'cost_estimate'>>
): Promise<UsageMetric | null> {
  const existing = await getUsageMetricByCategory(db, category);
  if (!existing) return null;
  
  const fields: string[] = [];
  const values: (string | number | null)[] = [];
  
  if (updates.current_value !== undefined) {
    fields.push('current_value = ?');
    values.push(updates.current_value);
  }
  if (updates.cost_estimate !== undefined) {
    fields.push('cost_estimate = ?');
    values.push(stringifyMetadata(updates.cost_estimate) ?? null);
  }
  
  if (fields.length === 0) return existing;
  
  fields.push('last_updated = ?');
  values.push(new Date().toISOString());
  values.push(category);
  
  await db
    .prepare(`UPDATE usage_limits SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE category = ?`)
    .bind(...values)
    .run();
  
  return getUsageMetricByCategory(db, category);
}

// ============================================
// Sync State Queries
// ============================================

export async function getSyncState(db: D1Database, section: string): Promise<SyncState | null> {
  const result = await db
    .prepare('SELECT * FROM sync_state WHERE section = ?')
    .bind(section)
    .first<{
      section: string;
      last_sync: string | null;
      etag: string | null;
      stale_after_minutes: number;
      sync_direction: string;
      last_error: string | null;
      retry_count: number;
      created_at: string;
      updated_at: string;
    }>();
  
  if (!result) return null;
  
  return {
    section: result.section,
    last_sync: result.last_sync,
    etag: result.etag,
    stale_after_minutes: result.stale_after_minutes,
    sync_direction: result.sync_direction as SyncState['sync_direction'],
    last_error: result.last_error,
    retry_count: result.retry_count,
    created_at: result.created_at,
    updated_at: result.updated_at,
  };
}

export async function updateSyncState(
  db: D1Database,
  section: string,
  updates: Partial<Pick<SyncState, 'last_sync' | 'etag' | 'last_error' | 'retry_count'>>
): Promise<SyncState | null> {
  const fields: string[] = [];
  const values: (string | number | null)[] = [];
  
  if (updates.last_sync !== undefined) {
    fields.push('last_sync = ?');
    values.push(updates.last_sync);
  }
  if (updates.etag !== undefined) {
    fields.push('etag = ?');
    values.push(updates.etag);
  }
  if (updates.last_error !== undefined) {
    fields.push('last_error = ?');
    values.push(updates.last_error);
  }
  if (updates.retry_count !== undefined) {
    fields.push('retry_count = ?');
    values.push(updates.retry_count);
  }
  
  if (fields.length === 0) return getSyncState(db, section);
  
  values.push(section);
  
  await db
    .prepare(`UPDATE sync_state SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE section = ?`)
    .bind(...values)
    .run();
  
  return getSyncState(db, section);
}

// ============================================
// Notifications Queries
// ============================================

export async function getAllNotifications(db: D1Database, limit: number = 50): Promise<Notification[]> {
  const result = await db
    .prepare('SELECT * FROM notifications ORDER BY created_at DESC LIMIT ?')
    .bind(limit)
    .all<{
      id: string;
      type: string;
      title: string;
      message: string | null;
      source_id: string | null;
      source_type: string | null;
      status: string;
      created_at: string;
      read_at: string | null;
      metadata: string | null;
    }>();
  
  if (!result.success) return [];
  
  return result.results.map(row => ({
    id: row.id,
    type: row.type as Notification['type'],
    title: row.title,
    message: row.message ?? undefined,
    source_id: row.source_id ?? undefined,
    source_type: row.source_type ?? undefined,
    status: row.status as Notification['status'],
    created_at: row.created_at,
    read_at: row.read_at ?? undefined,
    metadata: parseMetadata(row.metadata),
  }));
}

export async function getUnreadNotifications(db: D1Database, limit: number = 50): Promise<Notification[]> {
  const result = await db
    .prepare('SELECT * FROM notifications WHERE status = ? ORDER BY created_at DESC LIMIT ?')
    .bind('unread', limit)
    .all<{
      id: string;
      type: string;
      title: string;
      message: string | null;
      source_id: string | null;
      source_type: string | null;
      status: string;
      created_at: string;
      read_at: string | null;
      metadata: string | null;
    }>();
  
  if (!result.success) return [];
  
  return result.results.map(row => ({
    id: row.id,
    type: row.type as Notification['type'],
    title: row.title,
    message: row.message ?? undefined,
    source_id: row.source_id ?? undefined,
    source_type: row.source_type ?? undefined,
    status: row.status as Notification['status'],
    created_at: row.created_at,
    read_at: row.read_at ?? undefined,
    metadata: parseMetadata(row.metadata),
  }));
}

export async function getNotificationCount(db: D1Database): Promise<{ total: number; unread: number }> {
  const totalResult = await db.prepare('SELECT COUNT(*) as count FROM notifications').first<{ count: number }>();
  const unreadResult = await db.prepare('SELECT COUNT(*) as count FROM notifications WHERE status = ?').bind('unread').first<{ count: number }>();
  
  return {
    total: totalResult?.count ?? 0,
    unread: unreadResult?.count ?? 0,
  };
}

export async function createNotification(
  db: D1Database,
  notification: Omit<Notification, 'id' | 'created_at' | 'read_at'>
): Promise<Notification> {
  const id = `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const metadata = stringifyMetadata(notification.metadata);
  
  await db
    .prepare(`
      INSERT INTO notifications (id, type, title, message, source_id, source_type, status, metadata)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `)
    .bind(
      id,
      notification.type,
      notification.title,
      notification.message ?? null,
      notification.source_id ?? null,
      notification.source_type ?? null,
      notification.status,
      metadata ?? null
    )
    .run();
  
  const created = await db.prepare('SELECT * FROM notifications WHERE id = ?').bind(id).first<Notification>();
  if (!created) throw new Error('Failed to create notification');
  
  return {
    ...created,
    metadata: parseMetadata(created.metadata as unknown as string),
  };
}

export async function markNotificationAsRead(db: D1Database, id: string): Promise<Notification | null> {
  const existing = await db.prepare('SELECT * FROM notifications WHERE id = ?').bind(id).first<Notification>();
  if (!existing) return null;
  
  const readAt = new Date().toISOString();
  
  await db
    .prepare('UPDATE notifications SET status = ?, read_at = ? WHERE id = ?')
    .bind('read', readAt, id)
    .run();
  
  const updated = await db.prepare('SELECT * FROM notifications WHERE id = ?').bind(id).first<Notification>();
  if (!updated) return null;
  
  return {
    ...updated,
    metadata: parseMetadata(updated.metadata as unknown as string),
  };
}

export async function markAllNotificationsAsRead(db: D1Database): Promise<void> {
  const readAt = new Date().toISOString();
  await db
    .prepare('UPDATE notifications SET status = ?, read_at = ? WHERE status = ?')
    .bind('read', readAt, 'unread')
    .run();
}

export async function deleteNotification(db: D1Database, id: string): Promise<boolean> {
  const result = await db.prepare('DELETE FROM notifications WHERE id = ?').bind(id).run();
  return result.success && result.count > 0;
}

// ============================================
// Project Activity Log Queries
// ============================================

export async function logProjectActivity(
  db: D1Database,
  projectId: string,
  action: ProjectActivityLog['action'],
  details?: {
    field?: string;
    old_value?: string;
    new_value?: string;
    metadata?: Record<string, unknown>;
  }
): Promise<void> {
  const metadata = details?.metadata ? stringifyMetadata(details.metadata) : null;
  
  await db
    .prepare(`
      INSERT INTO project_activity_log (project_id, action, field, old_value, new_value, metadata)
      VALUES (?, ?, ?, ?, ?, ?)
    `)
    .bind(
      projectId,
      action,
      details?.field ?? null,
      details?.old_value ?? null,
      details?.new_value ?? null,
      metadata
    )
    .run();
}

export async function getProjectActivityLog(
  db: D1Database,
  projectId: string,
  limit: number = 50
): Promise<ProjectActivityLog[]> {
  const result = await db
    .prepare('SELECT * FROM project_activity_log WHERE project_id = ? ORDER BY created_at DESC LIMIT ?')
    .bind(projectId, limit)
    .all<ProjectActivityLog>();
  
  if (!result.success) return [];
  
  return result.results.map(row => ({
    ...row,
    metadata: parseMetadata(row.metadata as unknown as string),
  }));
}

// ============================================
// Health Check
// ============================================

export async function checkDatabaseHealth(db: D1Database): Promise<boolean> {
  try {
    const result = await db.prepare('SELECT 1 as health').first<{ health: number }>();
    return result?.health === 1;
  } catch {
    return false;
  }
}
