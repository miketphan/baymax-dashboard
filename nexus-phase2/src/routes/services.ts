// Services API Routes

import type { Env } from '../types';
import { getAllServices, getServiceById, updateService } from '../lib/db';
import { successResponse, errors, isValidServiceStatus } from '../lib/utils';

// ============================================
// GET /api/services - List all services
// ============================================
export async function listServices(env: Env): Promise<Response> {
  const services = await getAllServices(env.DB);
  
  // Calculate summary
  const summary = {
    online: services.filter(s => s.status === 'online').length,
    attention: services.filter(s => s.status === 'attention').length,
    offline: services.filter(s => s.status === 'offline').length,
  };
  
  return successResponse({ services, summary });
}

// ============================================
// GET /api/services/:id - Get a single service
// ============================================
export async function getService(env: Env, id: string): Promise<Response> {
  const service = await getServiceById(env.DB, id);
  
  if (!service) {
    return errors.notFound('Service');
  }
  
  return successResponse(service);
}

// ============================================
// POST /api/services/:id/refresh - Trigger service check
// ============================================
export async function refreshService(env: Env, id: string): Promise<Response> {
  const service = await getServiceById(env.DB, id);
  
  if (!service) {
    return errors.notFound('Service');
  }
  
  // In a real implementation, this would trigger an actual health check
  // For now, we'll simulate by updating the last_check timestamp
  const now = new Date().toISOString();
  const nextCheck = new Date(Date.now() + service.check_interval_minutes * 60 * 1000).toISOString();
  
  // Simulate status determination (in reality, this would check the actual service)
  let newStatus: 'online' | 'attention' | 'offline' = 'online';
  
  // Example logic for demo purposes
  switch (service.id) {
    case 'google_calendar':
      newStatus = 'online';
      break;
    case 'auto_backups':
      newStatus = 'online';
      break;
    case 'health_monitor':
      newStatus = 'online';
      break;
    case 'system_updates':
      // Simulate an available update for demo
      newStatus = 'attention';
      break;
    case 'security_audit':
      newStatus = 'online';
      break;
  }
  
  const updatedService = await updateService(env.DB, id, {
    status: newStatus,
    last_check: now,
    next_check: nextCheck,
    details: {
      ...service.details,
      // Add simulated details based on service
      ...(service.id === 'google_calendar' && {
        next_event: 'Team Sync at 4:00 PM',
        events_today: 3,
        oauth_status: 'connected',
      }),
      ...(service.id === 'auto_backups' && {
        last_backup: now,
        storage_used_gb: 12.5,
        backup_count: 45,
      }),
      ...(service.id === 'health_monitor' && {
        last_heartbeat: now,
        auto_heal_events: 2,
        uptime_percent: 99.8,
      }),
      ...(service.id === 'system_updates' && {
        current_version: '2.0.0',
        available_version: '2.1.0',
        update_available: true,
      }),
      ...(service.id === 'security_audit' && {
        last_scan: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        warnings: 0,
        critical_issues: 0,
      }),
    },
  });
  
  if (!updatedService) {
    return errors.internalError('Failed to refresh service');
  }
  
  return successResponse({
    service: updatedService,
    refreshed_at: now,
  });
}

// ============================================
// POST /api/services/refresh-all - Refresh all services
// ============================================
export async function refreshAllServices(env: Env): Promise<Response> {
  const services = await getAllServices(env.DB);
  const now = new Date().toISOString();
  const results = [];
  
  for (const service of services) {
    const nextCheck = new Date(Date.now() + service.check_interval_minutes * 60 * 1000).toISOString();
    
    const updated = await updateService(env.DB, service.id, {
      status: 'online',
      last_check: now,
      next_check: nextCheck,
    });
    
    if (updated) {
      results.push(updated);
    }
  }
  
  const summary = {
    online: results.filter(s => s.status === 'online').length,
    attention: results.filter(s => s.status === 'attention').length,
    offline: results.filter(s => s.status === 'offline').length,
  };
  
  return successResponse({
    services: results,
    summary,
    refreshed_at: now,
  });
}
