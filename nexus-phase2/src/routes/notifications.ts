// Notifications API Routes

import type { Env, Notification, CreateNotificationRequest } from '../types';
import {
  getAllNotifications,
  getUnreadNotifications,
  createNotification,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
  getNotificationCount,
} from '../lib/db';
import {
  successResponse,
  errors,
  generateNotificationId,
  sanitizeString,
} from '../lib/utils';

// ============================================
// GET /api/notifications - List all notifications
// ============================================
export async function listNotifications(env: Env, request: Request): Promise<Response> {
  const url = new URL(request.url);
  const unreadOnly = url.searchParams.get('unread') === 'true';
  const limit = parseInt(url.searchParams.get('limit') || '50', 10);
  
  const notifications = unreadOnly 
    ? await getUnreadNotifications(env.DB, limit)
    : await getAllNotifications(env.DB, limit);
  
  return successResponse({ notifications });
}

// ============================================
// GET /api/notifications/count - Get unread count
// ============================================
export async function getNotificationCountEndpoint(env: Env): Promise<Response> {
  const count = await getNotificationCount(env.DB);
  return successResponse({ count });
}

// ============================================
// POST /api/notify - Create a new notification (Trigger Baymax)
// ============================================
export async function createNotificationEndpoint(env: Env, request: Request): Promise<Response> {
  let body: CreateNotificationRequest;
  
  try {
    body = await request.json() as CreateNotificationRequest;
  } catch {
    return errors.badRequest('Invalid JSON in request body');
  }
  
  // Validate required fields
  if (!body.title || !body.title.trim()) {
    return errors.validationError({ field: 'title', message: 'Title is required' });
  }
  
  // Create the notification
  const notificationData: Omit<Notification, 'id' | 'created_at' | 'read_at'> = {
    type: body.type || 'baymax_alert',
    title: sanitizeString(body.title)!,
    message: sanitizeString(body.message),
    source_id: body.source_id,
    source_type: body.source_type,
    status: 'unread',
    metadata: body.metadata,
  };
  
  try {
    const notification = await createNotification(env.DB, notificationData);
    
    // Log to console as well (so Baymax sees it)
    console.log(`[BAYMAX ALERT] ${notification.title}: ${notification.message || 'No message'}`);
    
    return successResponse({ 
      success: true, 
      notification,
      message: 'Notification sent to Baymax',
    });
  } catch (error) {
    console.error('Failed to create notification:', error);
    return errors.internalError('Failed to create notification');
  }
}

// ============================================
// POST /api/notify/project/:id - Quick project alert
// ============================================
export async function createProjectNotification(
  env: Env, 
  projectId: string, 
  request: Request
): Promise<Response> {
  let body: { message?: string };
  
  try {
    body = await request.json() as { message?: string };
  } catch {
    body = {};
  }
  
  const notificationData: Omit<Notification, 'id' | 'created_at' | 'read_at'> = {
    type: 'baymax_alert',
    title: 'Project Alert',
    message: body.message || `Attention needed for project ${projectId}`,
    source_id: projectId,
    source_type: 'project',
    status: 'unread',
    metadata: { triggered_from: 'kanban_board' },
  };
  
  try {
    const notification = await createNotification(env.DB, notificationData);
    
    console.log(`[BAYMAX ALERT] Project ${projectId}: ${notification.message}`);
    
    return successResponse({ 
      success: true, 
      notification,
      message: 'Project alert sent to Baymax',
    });
  } catch (error) {
    console.error('Failed to create project notification:', error);
    return errors.internalError('Failed to send project alert');
  }
}

// ============================================
// PATCH /api/notifications/:id/read - Mark as read
// ============================================
export async function markNotificationRead(env: Env, id: string): Promise<Response> {
  const notification = await markNotificationAsRead(env.DB, id);
  
  if (!notification) {
    return errors.notFound('Notification');
  }
  
  return successResponse(notification);
}

// ============================================
// POST /api/notifications/read-all - Mark all as read
// ============================================
export async function markAllNotificationsRead(env: Env): Promise<Response> {
  await markAllNotificationsAsRead(env.DB);
  return successResponse({ success: true, message: 'All notifications marked as read' });
}

// ============================================
// DELETE /api/notifications/:id - Delete a notification
// ============================================
export async function deleteNotificationEndpoint(env: Env, id: string): Promise<Response> {
  const deleted = await deleteNotification(env.DB, id);
  
  if (!deleted) {
    return errors.notFound('Notification');
  }
  
  return successResponse({ deleted: true, id });
}
