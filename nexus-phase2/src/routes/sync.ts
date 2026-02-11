// Sync API Routes
// Handles bidirectional sync between markdown files and D1

import type { Env, SyncState, Project } from '../types';
import { performBidirectionalSync, syncToFile, parseProjectsMarkdown, generateProjectsMarkdown, SyncOptions } from '../lib/sync';
import { getSyncState, updateSyncState, getAllProjects, createProject, updateProject } from '../lib/db';
import { successResponse, errors, generateProjectId } from '../lib/utils';

// ============================================
// Configuration
// ============================================

// Only PROJECTS.md has bidirectional sync (file ↔ D1)
// Other files are read-only: markdown source → D1 storage → viewer
const OPERATIONS_MANUAL_FILES = [
  { section: 'protocols', filename: 'PROTOCOLS.md', bidirectional: false },
  { section: 'processes', filename: 'PROCESSES.md', bidirectional: false },
  { section: 'features', filename: 'FEATURES.md', bidirectional: false },
  { section: 'projects', filename: 'PROJECTS.md', bidirectional: true },
];

// In-memory store for section content (since we can't access filesystem from Worker)
// In production, this would use R2, KV, or another storage
const sectionContentStore: Record<string, { content: string; etag: string; updated_at: string }> = {};

// ============================================
// POST /api/sync - Universal sync endpoint
// ============================================

export async function triggerUniversalSync(env: Env, request: Request): Promise<Response> {
  const startTime = Date.now();
  const results: Record<string, unknown> = {};
  const syncErrors: string[] = [];
  
  try {
    // Parse request body for options
    let options: SyncOptions = {};
    try {
      const body = await request.json() as { 
        direction?: string; 
        dryRun?: boolean; 
        conflictResolution?: string;
        files?: Record<string, string>; // Optional: file contents from client
      };
      options = {
        direction: body.direction as SyncOptions['direction'] || 'bidirectional',
        dryRun: body.dryRun || false,
        conflictResolution: body.conflictResolution as SyncOptions['conflictResolution'] || 'prefer_d1',
      };
      
      // If files are provided in the request, store them
      if (body.files) {
        for (const [section, content] of Object.entries(body.files)) {
          sectionContentStore[section] = {
            content,
            etag: generateEtag(content),
            updated_at: new Date().toISOString(),
          };
        }
      }
    } catch {
      // No body or invalid JSON - use defaults
    }
    
    // Sync Projects (bidirectional)
    try {
      const projectsResult = await syncProjectsFromStore(env, options);
      results.projects = projectsResult;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      syncErrors.push(`Projects sync failed: ${errorMsg}`);
      results.projects = { success: false, error: errorMsg };
    }
    
    // Sync other Operations Manual sections (read-only, just update state)
    for (const file of OPERATIONS_MANUAL_FILES.filter(f => !f.bidirectional)) {
      try {
        const sectionResult = await syncReadOnlySection(env, file.section);
        results[file.section] = sectionResult;
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Unknown error';
        syncErrors.push(`${file.section} sync failed: ${errorMsg}`);
        results[file.section] = { success: false, error: errorMsg };
      }
    }
    
    const duration = Date.now() - startTime;
    const success = syncErrors.length === 0;
    
    return successResponse({
      success,
      duration_ms: duration,
      results,
      errors: syncErrors.length > 0 ? syncErrors : undefined,
      timestamp: new Date().toISOString(),
    });
    
  } catch (error) {
    console.error('Universal sync failed:', error);
    return errors.internalError('Universal sync failed');
  }
}

// ============================================
// Sync Projects from Store
// ============================================

async function syncProjectsFromStore(env: Env, options: SyncOptions): Promise<unknown> {
  const storeEntry = sectionContentStore['projects'];
  
  if (!storeEntry?.content) {
    // No content in store - return current D1 state
    const projects = await getAllProjects(env.DB);
    return {
      success: true,
      direction: 'to_file',
      d1_project_count: projects.length,
      message: 'No file content available. Send PROJECTS.md content to enable sync.',
      project_count: projects.length,
    };
  }

  // Perform bidirectional sync
  const result = await performBidirectionalSync(env.DB, storeEntry.content, {
    ...options,
    direction: 'to_d1', // When content is provided, default to syncing to D1
  });

  // Update sync state
  await updateSyncState(env.DB, 'projects', {
    last_sync: new Date().toISOString(),
    etag: storeEntry.etag,
    last_error: result.success ? null : result.errors.join(', '),
    retry_count: result.success ? 0 : 1,
  });

  return {
    ...result,
    project_count: result.summary.created + result.summary.updated + result.summary.unchanged,
  };
}

// ============================================
// Sync Section from Store (read-only sections)
// ============================================

async function syncReadOnlySection(env: Env, section: string): Promise<unknown> {
  const storeEntry = sectionContentStore[section];
  
  if (!storeEntry?.content) {
    return {
      success: true,
      section,
      message: 'No file content available for this section.',
      synced: false,
    };
  }

  // For read-only sections, just update sync state (content stored for display only)
  await updateSyncState(env.DB, section, {
    last_sync: new Date().toISOString(),
    etag: storeEntry.etag,
    last_error: null,
    retry_count: 0,
  });

  return {
    success: true,
    section,
    message: `${section} stored for display (read-only)`,
    synced: true,
    content_length: storeEntry.content.length,
    read_only: true,
  };
}

// ============================================
// POST /api/sync/projects - Projects-specific sync
// ============================================

export async function syncProjectsEndpoint(env: Env, request: Request): Promise<Response> {
  try {
    let body: { 
      content?: string; 
      direction?: 'to_d1' | 'to_file' | 'bidirectional'; 
      dryRun?: boolean;
      conflictResolution?: 'prefer_d1' | 'prefer_file' | 'manual';
    } = {};
    
    try {
      body = await request.json() as typeof body;
    } catch {
      // No body - use defaults
    }
    
    // If content is provided, store it and sync to D1
    if (body.content) {
      // Store the content
      sectionContentStore['projects'] = {
        content: body.content,
        etag: generateEtag(body.content),
        updated_at: new Date().toISOString(),
      };

      const result = await performBidirectionalSync(env.DB, body.content, {
        direction: body.direction || 'to_d1',
        dryRun: body.dryRun || false,
        conflictResolution: body.conflictResolution || 'prefer_d1',
      });
      
      // Update sync state
      await updateSyncState(env.DB, 'projects', {
        last_sync: new Date().toISOString(),
        etag: generateEtag(body.content),
        last_error: result.success ? null : result.errors.join(', '),
        retry_count: result.success ? 0 : 1,
      });
      
      return successResponse({
        ...result,
        project_count: result.summary.created + result.summary.updated + result.summary.unchanged,
      });
    }
    
    // No content provided - return current D1 state as markdown
    const { content, projectCount } = await syncToFile(env.DB);
    
    // Store the generated content
    sectionContentStore['projects'] = {
      content,
      etag: generateEtag(content),
      updated_at: new Date().toISOString(),
    };
    
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
    const sections: Array<{
      section: string;
      status: 'fresh' | 'stale' | 'error' | 'unknown';
      last_sync: string | null;
      stale_after_minutes: number;
      stale: boolean;
      error?: string | null;
      has_content: boolean;
    }> = [];
    
    for (const file of OPERATIONS_MANUAL_FILES) {
      const state = await getSyncState(env.DB, file.section);
      const hasContent = !!sectionContentStore[file.section]?.content;
      
      if (!state) {
        sections.push({
          section: file.section,
          status: 'unknown',
          last_sync: null,
          stale_after_minutes: 10,
          stale: true,
          error: null,
          has_content: hasContent,
        });
        continue;
      }
      
      const now = new Date();
      const lastSync = state.last_sync ? new Date(state.last_sync) : null;
      const staleAfter = state.stale_after_minutes || 10;
      const isStale = !lastSync || 
        (now.getTime() - lastSync.getTime()) > (staleAfter * 60 * 1000);
      
      sections.push({
        section: file.section,
        status: state.last_error ? 'error' : isStale ? 'stale' : 'fresh',
        last_sync: state.last_sync,
        stale_after_minutes: staleAfter,
        stale: isStale,
        error: state.last_error,
        has_content: hasContent,
      });
    }
    
    return successResponse({
      sections,
      overall_status: sections.every(s => s.status === 'fresh') ? 'fresh' : 
                      sections.some(s => s.status === 'error') ? 'error' : 'stale',
      timestamp: new Date().toISOString(),
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
  const fileInfo = OPERATIONS_MANUAL_FILES.find(f => f.section === section);
  
  if (!fileInfo) {
    const validSections = OPERATIONS_MANUAL_FILES.map(f => f.section);
    return errors.badRequest(`Invalid section. Must be one of: ${validSections.join(', ')}`);
  }
  
  try {
    let body: { content?: string; dryRun?: boolean } = {};
    
    try {
      body = await request.json() as typeof body;
    } catch {
      // No body
    }
    
    // Store content if provided
    if (body.content) {
      sectionContentStore[section] = {
        content: body.content,
        etag: generateEtag(body.content),
        updated_at: new Date().toISOString(),
      };
    }
    
    // For projects section (bidirectional), use the dedicated projects sync
    if (fileInfo.bidirectional) {
      return syncProjectsEndpoint(env, request);
    }
    
    // For read-only sections, just store content and update sync state
    const hasContent = !!sectionContentStore[section]?.content;
    
    await updateSyncState(env.DB, section, {
      last_sync: new Date().toISOString(),
      etag: hasContent ? sectionContentStore[section].etag : null,
      last_error: null,
      retry_count: 0,
    });
    
    return successResponse({
      success: true,
      section,
      message: `${section} stored for display (read-only).`,
      has_content: hasContent,
      read_only: true,
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
  
  // For projects, return markdown representation from D1 or store
  if (section === 'projects') {
    // First check store
    const storeEntry = sectionContentStore['projects'];
    if (storeEntry?.content) {
      return successResponse({
        section: 'projects',
        format: 'markdown',
        source: 'store',
        project_count: (storeEntry.content.match(/###\s+/g) || []).length,
        content: storeEntry.content,
        last_sync: storeEntry.updated_at,
      });
    }
    
    // Generate from D1
    const { content, projectCount } = await syncToFile(env.DB);
    
    return successResponse({
      section: 'projects',
      format: 'markdown',
      source: 'd1',
      project_count: projectCount,
      content,
      last_sync: new Date().toISOString(),
    });
  }
  
  // For other sections, return from store if available
  const storeEntry = sectionContentStore[section];
  if (storeEntry?.content) {
    return successResponse({
      section,
      format: 'markdown',
      source: 'store',
      content: storeEntry.content,
      last_sync: storeEntry.updated_at,
    });
  }
  
  // Return sync state info
  const syncState = await getSyncState(env.DB, section);
  
  return successResponse({
    section,
    format: 'markdown',
    source: 'none',
    sync_state: syncState,
    message: 'No content available. Sync with file content first.',
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
