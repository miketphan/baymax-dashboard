// Sync API Routes
// Handles bidirectional sync between markdown files and D1

import type { Env, SyncState } from '../types';
import { performBidirectionalSync, syncToFile, parseProjectsMarkdown, generateProjectsMarkdown, SyncOptions } from '../lib/sync';
import { getSyncState, updateSyncState, getAllProjects } from '../lib/db';
import { successResponse, errors } from '../lib/utils';

// ============================================
// Configuration
// ============================================

const OPERATIONS_MANUAL_FILES = [
  { section: 'protocols', filename: 'PROTOCOLS.md' },
  { section: 'processes', filename: 'PROCESSES.md' },
  { section: 'features', filename: 'FEATURES.md' },
  { section: 'projects', filename: 'PROJECTS.md' },
];

// Base URL for fetching markdown files (relative to worker)
// In production, this would be configured via env var
// Note: Cloudflare Workers use env.MARKDOWN_BASE_URL, not process.env

// ============================================
// Helper: Fetch markdown content
// ============================================

async function fetchMarkdownContent(filename: string): Promise<string | null> {
  try {
    // Try to read from the local file system or fetch via URL
    // In Cloudflare Workers, we'd typically fetch from a bound static asset
    // or from a configured URL
    
    // For now, return null - the caller will handle this
    // In a real implementation, this might fetch from R2, GitHub, or another source
    return null;
  } catch (error) {
    console.error(`Failed to fetch ${filename}:`, error);
    return null;
  }
}

// ============================================
// POST /api/sync - Universal sync endpoint
// ============================================

export async function triggerUniversalSync(env: Env, request: Request): Promise<Response> {
  const startTime = Date.now();
  const results: Record<string, unknown> = {};
  const errors: string[] = [];
  
  try {
    // Parse request body for options
    let options: SyncOptions = {};
    try {
      const body = await request.json() as { direction?: string; dryRun?: boolean; conflictResolution?: string };
      options = {
        direction: body.direction as SyncOptions['direction'] || 'bidirectional',
        dryRun: body.dryRun || false,
        conflictResolution: body.conflictResolution as SyncOptions['conflictResolution'] || 'prefer_d1',
      };
    } catch {
      // No body or invalid JSON - use defaults
    }
    
    // Sync Projects (bidirectional)
    try {
      const projectsResult = await syncProjects(env, options);
      results.projects = projectsResult;
    } catch (error) {
      errors.push(`Projects sync failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      results.projects = { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
    
    // Sync Operations Manual sections (read-only for now)
    for (const file of OPERATIONS_MANUAL_FILES) {
      try {
        await updateSyncState(env.DB, file.section, {
          last_sync: new Date().toISOString(),
          last_error: null,
          retry_count: 0,
        });
      } catch (error) {
        errors.push(`${file.section} sync state update failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }
    
    const duration = Date.now() - startTime;
    
    return successResponse({
      success: errors.length === 0,
      duration_ms: duration,
      results,
      errors: errors.length > 0 ? errors : undefined,
      timestamp: new Date().toISOString(),
    });
    
  } catch (error) {
    console.error('Universal sync failed:', error);
    return errors.internalError('Universal sync failed');
  }
}

// ============================================
// Sync Projects specifically
// ============================================

async function syncProjects(env: Env, options: SyncOptions): Promise<unknown> {
  // In a real implementation, we would:
  // 1. Fetch PROJECTS.md content from storage (R2, GitHub, etc.)
  // 2. Parse and sync with D1
  // 3. Return results
  
  // For now, return a placeholder that indicates what would happen
  const projects = await getAllProjects(env.DB);
  
  return {
    success: true,
    direction: options.direction,
    d1_project_count: projects.length,
    message: 'Projects sync endpoint ready. Connect markdown storage to enable full sync.',
    options,
  };
}

// ============================================
// POST /api/sync/projects - Projects-specific sync
// ============================================

export async function syncProjectsEndpoint(env: Env, request: Request): Promise<Response> {
  try {
    let body: { content?: string; direction?: 'to_d1' | 'to_file' | 'bidirectional'; dryRun?: boolean } = {};
    
    try {
      body = await request.json() as typeof body;
    } catch {
      // No body - use defaults
    }
    
    // If content is provided, parse and sync it
    if (body.content) {
      const result = await performBidirectionalSync(env.DB, body.content, {
        direction: body.direction || 'bidirectional',
        dryRun: body.dryRun || false,
        conflictResolution: 'prefer_d1',
      });
      
      // Update sync state
      await updateSyncState(env.DB, 'projects', {
        last_sync: new Date().toISOString(),
        etag: generateEtag(body.content),
        last_error: result.success ? null : result.errors.join(', '),
        retry_count: result.success ? 0 : 1,
      });
      
      return successResponse(result);
    }
    
    // No content provided - return current D1 state as markdown
    const { content, projectCount } = await syncToFile(env.DB);
    
    return successResponse({
      success: true,
      direction: 'to_file',
      project_count: projectCount,
      markdown: content,
      message: 'Generated markdown from D1. Provide "content" in body to sync from file to D1.',
    });
    
  } catch (error) {
    console.error('Projects sync failed:', error);
    return errors.internalError('Projects sync failed');
  }
}

// ============================================
// GET /api/sync/status - Get sync status for all sections
// ============================================

export async function getSyncStatus(env: Env): Promise<Response> {
  try {
    const sections: Record<string, SyncState | null> = {};
    
    for (const file of OPERATIONS_MANUAL_FILES) {
      sections[file.section] = await getSyncState(env.DB, file.section);
    }
    
    // Check staleness
    const now = new Date();
    const status = Object.entries(sections).map(([name, state]) => {
      if (!state) {
        return {
          section: name,
          status: 'unknown',
          last_sync: null,
          stale: true,
        };
      }
      
      const lastSync = state.last_sync ? new Date(state.last_sync) : null;
      const staleAfter = state.stale_after_minutes || 10;
      const isStale = !lastSync || 
        (now.getTime() - lastSync.getTime()) > (staleAfter * 60 * 1000);
      
      return {
        section: name,
        status: state.last_error ? 'error' : isStale ? 'stale' : 'fresh',
        last_sync: state.last_sync,
        stale_after_minutes: staleAfter,
        stale: isStale,
        error: state.last_error,
      };
    });
    
    return successResponse({
      sections: status,
      overall_status: status.every(s => s.status === 'fresh') ? 'fresh' : 
                      status.some(s => s.status === 'error') ? 'error' : 'stale',
      timestamp: now.toISOString(),
    });
    
  } catch (error) {
    console.error('Failed to get sync status:', error);
    return errors.internalError('Failed to get sync status');
  }
}

// ============================================
// POST /api/sync/:section - Sync specific section
// ============================================

export async function syncSpecificSection(
  env: Env,
  section: string,
  request: Request
): Promise<Response> {
  const validSections = OPERATIONS_MANUAL_FILES.map(f => f.section);
  
  if (!validSections.includes(section)) {
    return errors.badRequest(`Invalid section. Must be one of: ${validSections.join(', ')}`);
  }
  
  try {
    let body: { content?: string; dryRun?: boolean } = {};
    
    try {
      body = await request.json() as typeof body;
    } catch {
      // No body
    }
    
    // For projects section, use the dedicated projects sync
    if (section === 'projects') {
      return syncProjectsEndpoint(env, request);
    }
    
    // For other sections, just update sync state (content stored elsewhere)
    await updateSyncState(env.DB, section, {
      last_sync: new Date().toISOString(),
      etag: body.content ? generateEtag(body.content) : null,
      last_error: null,
      retry_count: 0,
    });
    
    return successResponse({
      success: true,
      section,
      message: `${section} sync state updated. Content management handled separately.`,
      timestamp: new Date().toISOString(),
    });
    
  } catch (error) {
    console.error(`Failed to sync ${section}:`, error);
    
    // Update sync state with error
    await updateSyncState(env.DB, section, {
      last_error: error instanceof Error ? error.message : 'Unknown error',
    });
    
    return errors.internalError(`Failed to sync ${section}`);
  }
}

// ============================================
// GET /api/sync/:section/content - Get section content
// ============================================

export async function getSectionContent(env: Env, section: string): Promise<Response> {
  const validSections = ['protocols', 'processes', 'features', 'projects'];
  
  if (!validSections.includes(section)) {
    return errors.badRequest(`Invalid section. Must be one of: ${validSections.join(', ')}`);
  }
  
  // For projects, return markdown representation
  if (section === 'projects') {
    const { content, projectCount } = await syncToFile(env.DB);
    return successResponse({
      section: 'projects',
      format: 'markdown',
      project_count: projectCount,
      content,
    });
  }
  
  // For other sections, return sync state info
  const syncState = await getSyncState(env.DB, section);
  
  return successResponse({
    section,
    format: 'markdown',
    sync_state: syncState,
    message: 'Content available in source markdown file',
  });
}

// ============================================
// Utility Functions
// ============================================

/**
 * Generate a simple ETag for content
 */
function generateEtag(content: string): string {
  // Simple hash - in production, use a proper hash function
  let hash = 0;
  for (let i = 0; i < content.length; i++) {
    const char = content.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return `"${hash.toString(16)}"`;
}

/**
 * Check if content has changed based on ETag
 */
function hasContentChanged(currentEtag: string | null, newContent: string): boolean {
  if (!currentEtag) return true;
  const newEtag = generateEtag(newContent);
  return currentEtag !== newEtag;
}
