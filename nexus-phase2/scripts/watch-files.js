#!/usr/bin/env node
/**
 * Nexus File Watcher
 * Watches for changes in Operations Manual markdown files and triggers sync to D1
 * 
 * Usage:
 *   node scripts/watch-files.js          # Start watching
 *   node scripts/watch-files.js --once   # Single sync, then exit
 *   node scripts/watch-files.js --sync   # Force sync all files
 */

import { watch, readFileSync, existsSync } from 'fs';
import { join, resolve } from 'path';
import { fileURLToPath } from 'url';

// ============================================
// Configuration
// ============================================

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const WORKSPACE_ROOT = resolve(__dirname, '..');

// Only PROJECTS.md has bidirectional sync
// Other files are read-only (markdown → viewer only)
const WATCHED_FILES = [
  { section: 'projects', filename: 'PROJECTS.md', path: join(WORKSPACE_ROOT, 'PROJECTS.md'), bidirectional: true },
];

// Read-only files (for reference, not auto-synced)
const READONLY_FILES = [
  { section: 'protocols', filename: 'PROTOCOLS.md', path: join(WORKSPACE_ROOT, 'PROTOCOLS.md') },
  { section: 'processes', filename: 'PROCESSES.md', path: join(WORKSPACE_ROOT, 'PROCESSES.md') },
  { section: 'features', filename: 'FEATURES.md', path: join(WORKSPACE_ROOT, 'FEATURES.md') },
];

// API endpoint for sync
const API_BASE_URL = process.env.NEXUS_API_URL || 'https://nexus-api.miket-phan.workers.dev/api';
const SYNC_DEBOUNCE_MS = 2000; // Wait 2 seconds after last change before syncing

// ============================================
// State
// ============================================

const syncState = {
  isSyncing: false,
  lastSync: null,
  pendingChanges: new Set(),
  debounceTimers: new Map(),
};

// ============================================
// Logging
// ============================================

function log(message, level = 'info') {
  const timestamp = new Date().toISOString();
  const prefix = level === 'error' ? '❌' : level === 'warn' ? '⚠️' : level === 'success' ? '✅' : '📡';
  console.log(`${prefix} [${timestamp}] ${message}`);
}

// ============================================
// File Operations
// ============================================

function readFileContent(filepath) {
  try {
    if (!existsSync(filepath)) {
      return null;
    }
    return readFileSync(filepath, 'utf-8');
  } catch (error) {
    log(`Failed to read ${filepath}: ${error.message}`, 'error');
    return null;
  }
}

// ============================================
// API Operations
// ============================================

async function syncSection(section, content) {
  const url = `${API_BASE_URL}/sync/${section}`;
  
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        content,
        dryRun: false,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`HTTP ${response.status}: ${error}`);
    }

    const result = await response.json();
    return { success: true, data: result.data };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

async function triggerUniversalSync() {
  const url = `${API_BASE_URL}/sync`;
  
  try {
    log('Triggering universal sync...');
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        direction: 'to_d1',
        conflictResolution: 'prefer_file',
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`HTTP ${response.status}: ${error}`);
    }

    const result = await response.json();
    return { success: true, data: result.data };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

async function syncProjectsWithContent(content) {
  const url = `${API_BASE_URL}/sync/projects`;
  
  try {
    log('Syncing PROJECTS.md to D1...');
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        content,
        direction: 'to_d1',
        dryRun: false,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`HTTP ${response.status}: ${error}`);
    }

    const result = await response.json();
    return { success: true, data: result.data };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// ============================================
// Sync Logic
// ============================================

async function performSync(fileInfo) {
  if (syncState.isSyncing) {
    log('Sync already in progress, queuing...', 'warn');
    syncState.pendingChanges.add(fileInfo.section);
    return;
  }

  syncState.isSyncing = true;
  
  try {
    const content = readFileContent(fileInfo.path);
    if (!content) {
      log(`No content found for ${fileInfo.filename}`, 'warn');
      return;
    }

    log(`Syncing ${fileInfo.filename}...`);

    let result;
    if (fileInfo.section === 'projects') {
      result = await syncProjectsWithContent(content);
    } else {
      result = await syncSection(fileInfo.section, content);
    }

    if (result.success) {
      log(`${fileInfo.filename} synced successfully!`, 'success');
      syncState.lastSync = new Date().toISOString();
      
      // Show summary if available
      if (result.data?.summary) {
        const s = result.data.summary;
        log(`  Created: ${s.created || 0}, Updated: ${s.updated || 0}, Unchanged: ${s.unchanged || 0}`);
      }
    } else {
      log(`Failed to sync ${fileInfo.filename}: ${result.error}`, 'error');
    }
  } catch (error) {
    log(`Sync error for ${fileInfo.filename}: ${error.message}`, 'error');
  } finally {
    syncState.isSyncing = false;
    
    // Process any pending changes
    if (syncState.pendingChanges.size > 0) {
      const nextSection = syncState.pendingChanges.values().next().value;
      syncState.pendingChanges.delete(nextSection);
      const nextFile = WATCHED_FILES.find(f => f.section === nextSection);
      if (nextFile) {
        setTimeout(() => performSync(nextFile), 100);
      }
    }
  }
}

function handleFileChange(fileInfo) {
  // Clear existing debounce timer
  if (syncState.debounceTimers.has(fileInfo.section)) {
    clearTimeout(syncState.debounceTimers.get(fileInfo.section));
  }

  // Set new debounce timer
  const timer = setTimeout(() => {
    log(`Detected change in ${fileInfo.filename}`);
    performSync(fileInfo);
    syncState.debounceTimers.delete(fileInfo.section);
  }, SYNC_DEBOUNCE_MS);

  syncState.debounceTimers.set(fileInfo.section, timer);
}

// ============================================
// Watchers
// ============================================

function startWatching() {
  log('Starting Nexus File Watcher...');
  log(`API Endpoint: ${API_BASE_URL}`);
  log(`Watching ${WATCHED_FILES.length} file(s) for bidirectional sync:\n`);

  for (const fileInfo of WATCHED_FILES) {
    const exists = existsSync(fileInfo.path);
    const syncType = fileInfo.bidirectional ? '↔️ bidirectional' : '📖 read-only';
    log(`  ${exists ? '✓' : '✗'} ${fileInfo.filename} (${fileInfo.section}) - ${syncType}`);

    if (!exists) {
      log(`    Warning: File does not exist yet`, 'warn');
      continue;
    }

    // Start watching
    watch(fileInfo.path, (eventType) => {
      if (eventType === 'change') {
        handleFileChange(fileInfo);
      }
    });
  }

  // Show read-only files
  if (READONLY_FILES.length > 0) {
    log('\n📄 Read-only files (manual sync only):');
    for (const fileInfo of READONLY_FILES) {
      const exists = existsSync(fileInfo.path);
      log(`  ${exists ? '✓' : '✗'} ${fileInfo.filename} (${fileInfo.section})`);
    }
  }

  log('\n👀 Watching for changes... (Press Ctrl+C to stop)');
  log(`Changes will sync after ${SYNC_DEBOUNCE_MS}ms of inactivity\n`);
}

// ============================================
// Commands
// ============================================

async function syncAllFiles() {
  log('Force syncing files...');
  
  // Sync bidirectional files
  for (const fileInfo of WATCHED_FILES) {
    if (!fileInfo.bidirectional) continue;
    
    const exists = existsSync(fileInfo.path);
    if (!exists) {
      log(`Skipping ${fileInfo.filename} (not found)`, 'warn');
      continue;
    }
    
    await performSync(fileInfo);
  }
  
  log('PROJECTS.md synced to D1!', 'success');
  log('Note: PROTOCOLS.md, PROCESSES.md, FEATURES.md are read-only and not synced to D1', 'info');
}

async function runOnce() {
  log('Running one-time sync...');
  
  // Try universal sync first
  const result = await triggerUniversalSync();
  
  if (result.success) {
    log('Universal sync completed!', 'success');
    if (result.data?.results) {
      console.log('\nResults:', JSON.stringify(result.data.results, null, 2));
    }
  } else {
    log(`Universal sync failed: ${result.error}`, 'error');
    log('Falling back to individual file sync...', 'warn');
    await syncAllFiles();
  }
}

// ============================================
// Main
// ============================================

const args = process.argv.slice(2);

if (args.includes('--help') || args.includes('-h')) {
  console.log(`
Nexus File Watcher

Usage:
  node scripts/watch-files.js          Start watching files for changes
  node scripts/watch-files.js --once   Run sync once, then exit
  node scripts/watch-files.js --sync   Force sync all files immediately
  node scripts/watch-files.js --help   Show this help

Environment Variables:
  NEXUS_API_URL    API base URL (default: https://nexus-api.miket-phan.workers.dev/api)

Files Watched:
  - PROJECTS.md    → /api/sync/projects
  - PROTOCOLS.md   → /api/sync/protocols
  - PROCESSES.md   → /api/sync/processes
  - FEATURES.md    → /api/sync/features
`);
  process.exit(0);
}

if (args.includes('--sync')) {
  syncAllFiles().then(() => process.exit(0));
} else if (args.includes('--once')) {
  runOnce().then(() => process.exit(0));
} else {
  startWatching();
  
  // Handle graceful shutdown
  process.on('SIGINT', () => {
    log('\n👋 Stopping file watcher...');
    process.exit(0);
  });
  
  process.on('SIGTERM', () => {
    log('\n👋 Stopping file watcher...');
    process.exit(0);
  });
}
