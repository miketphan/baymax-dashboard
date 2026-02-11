#!/usr/bin/env node
/**
 * Nexus Dashboard Dev Server with File Sync
 * 
 * This script combines the Vite dev server with file watching/sync capabilities.
 * It provides a local API endpoint that the dashboard can call to trigger file sync.
 * 
 * Usage:
 *   node scripts/dev-with-sync.js
 * 
 * Environment Variables:
 *   NEXUS_API_URL    Remote API URL (default: https://nexus-api.miket-phan.workers.dev/api)
 *   PORT             Local dashboard port (default: 5173)
 */

import { createServer } from 'vite';
import { readFileSync, watch, existsSync } from 'fs';
import { join, resolve } from 'path';
import { fileURLToPath } from 'url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const WORKSPACE_ROOT = resolve(__dirname, '..');

// ============================================
// Configuration
// ============================================

const CONFIG = {
  apiUrl: process.env.NEXUS_API_URL || 'https://nexus-api.miket-phan.workers.dev/api',
  port: parseInt(process.env.PORT || '5173', 10),
  // Only PROJECTS.md has bidirectional sync
  watchedFiles: [
    { section: 'projects', path: join(WORKSPACE_ROOT, 'PROJECTS.md'), bidirectional: true },
  ],
  // Read-only files (loaded for display but not auto-synced)
  readonlyFiles: [
    { section: 'protocols', path: join(WORKSPACE_ROOT, 'PROTOCOLS.md') },
    { section: 'processes', path: join(WORKSPACE_ROOT, 'PROCESSES.md') },
    { section: 'features', path: join(WORKSPACE_ROOT, 'FEATURES.md') },
  ],
  syncDebounceMs: 1500,
};

// ============================================
// State
// ============================================

const state = {
  fileContents: {},
  syncStatus: {},
  debounceTimers: new Map(),
};

// ============================================
// Logging
// ============================================

function log(message, type = 'info') {
  const timestamp = new Date().toLocaleTimeString();
  const icons = { info: 'ℹ️', success: '✅', warn: '⚠️', error: '❌', sync: '🔄' };
  console.log(`${icons[type] || 'ℹ️'} [${timestamp}] ${message}`);
}

// ============================================
// File Operations
// ============================================

function loadFileContent(filepath) {
  try {
    if (!existsSync(filepath)) return null;
    return readFileSync(filepath, 'utf-8');
  } catch (error) {
    log(`Failed to read ${filepath}: ${error.message}`, 'error');
    return null;
  }
}

function loadAllFiles() {
  // Load bidirectional sync files
  for (const file of CONFIG.watchedFiles) {
    const content = loadFileContent(file.path);
    if (content) {
      state.fileContents[file.section] = content;
    }
  }
  // Load read-only files
  for (const file of CONFIG.readonlyFiles) {
    const content = loadFileContent(file.path);
    if (content) {
      state.fileContents[file.section] = content;
    }
  }
  log(`Loaded ${Object.keys(state.fileContents).length} files into memory (${CONFIG.watchedFiles.length} bidirectional, ${CONFIG.readonlyFiles.length} read-only)`, 'success');
}

// ============================================
// API Operations
// ============================================

async function syncToApi(section, content) {
  const url = `${CONFIG.apiUrl}/sync/${section}`;
  
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content }),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const result = await response.json();
    state.syncStatus[section] = {
      lastSync: new Date().toISOString(),
      success: true,
    };
    return { success: true, data: result.data };
  } catch (error) {
    state.syncStatus[section] = {
      lastSync: new Date().toISOString(),
      success: false,
      error: error.message,
    };
    return { success: false, error: error.message };
  }
}

async function performSync(section) {
  const content = state.fileContents[section];
  if (!content) {
    log(`No content for ${section}, skipping sync`, 'warn');
    return;
  }

  log(`Syncing ${section}...`, 'sync');
  const result = await syncToApi(section, content);
  
  if (result.success) {
    log(`${section} synced successfully!`, 'success');
  } else {
    log(`Failed to sync ${section}: ${result.error}`, 'error');
  }
  
  return result;
}

// ============================================
// File Watching
// ============================================

function handleFileChange(fileInfo) {
  // Clear existing debounce timer
  if (state.debounceTimers.has(fileInfo.section)) {
    clearTimeout(state.debounceTimers.get(fileInfo.section));
  }

  // Reload content
  const content = loadFileContent(fileInfo.path);
  if (content) {
    state.fileContents[fileInfo.section] = content;
  }

  // Set new debounce timer
  const timer = setTimeout(() => {
    log(`Detected change in ${fileInfo.section}`, 'info');
    performSync(fileInfo.section);
    state.debounceTimers.delete(fileInfo.section);
  }, CONFIG.syncDebounceMs);

  state.debounceTimers.set(fileInfo.section, timer);
}

function startFileWatching() {
  log('Starting file watcher...', 'info');
  
  // Watch bidirectional files for changes
  for (const file of CONFIG.watchedFiles) {
    if (!existsSync(file.path)) {
      log(`File not found: ${file.path}`, 'warn');
      continue;
    }

    watch(file.path, (eventType) => {
      if (eventType === 'change') {
        handleFileChange(file);
      }
    });

    log(`↔️ Watching (bidirectional): ${file.section} (${file.path})`, 'info');
  }
  
  // Log read-only files
  for (const file of CONFIG.readonlyFiles) {
    if (existsSync(file.path)) {
      log(`📖 Loaded (read-only): ${file.section}`, 'info');
    } else {
      log(`⚠️ Not found: ${file.path}`, 'warn');
    }
  }
}

// ============================================
// Vite Plugin for Sync API
// ============================================

function nexusSyncPlugin() {
  return {
    name: 'nexus-sync',
    configureServer(server) {
      // Add API endpoint for dashboard to trigger sync
      server.middlewares.use('/api/local/sync', async (req, res, next) => {
        if (req.method !== 'POST') {
          res.statusCode = 405;
          res.end(JSON.stringify({ error: 'Method not allowed' }));
          return;
        }

        try {
          const results = {};
          
          for (const section of Object.keys(state.fileContents)) {
            results[section] = await performSync(section);
          }

          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ 
            success: true, 
            results,
            timestamp: new Date().toISOString(),
          }));
        } catch (error) {
          res.statusCode = 500;
          res.end(JSON.stringify({ 
            success: false, 
            error: error.message 
          }));
        }
      });

      // Get file contents endpoint
      server.middlewares.use('/api/local/files', (req, res) => {
        if (req.method !== 'GET') {
          res.statusCode = 405;
          res.end(JSON.stringify({ error: 'Method not allowed' }));
          return;
        }

        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({
          files: state.fileContents,
          syncStatus: state.syncStatus,
          timestamp: new Date().toISOString(),
        }));
      });

      // Get sync status endpoint
      server.middlewares.use('/api/local/status', (req, res) => {
        if (req.method !== 'GET') {
          res.statusCode = 405;
          res.end(JSON.stringify({ error: 'Method not allowed' }));
          return;
        }

        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({
          syncStatus: state.syncStatus,
          filesLoaded: Object.keys(state.fileContents),
          timestamp: new Date().toISOString(),
        }));
      });
    },
  };
}

// ============================================
// Main
// ============================================

async function startDevServer() {
  log('Nexus Dashboard Dev Server with Sync', 'info');
  log(`API URL: ${CONFIG.apiUrl}`, 'info');
  log(`Dashboard: http://localhost:${CONFIG.port}`, 'info');
  log('');

  // Load initial file contents
  loadAllFiles();

  // Start file watching
  startFileWatching();

  // Create Vite server with custom plugin
  const server = await createServer({
    root: join(WORKSPACE_ROOT, 'dashboard'),
    plugins: [nexusSyncPlugin()],
    server: {
      port: CONFIG.port,
      host: true,
    },
  });

  await server.listen();

  log('');
  log('Dashboard ready! Available endpoints:', 'success');
  log(`  http://localhost:${CONFIG.port}/ - Dashboard UI`, 'info');
  log(`  http://localhost:${CONFIG.port}/api/local/files - Get file contents`, 'info');
  log(`  http://localhost:${CONFIG.port}/api/local/sync - Trigger sync`, 'info');
  log(`  http://localhost:${CONFIG.port}/api/local/status - Get sync status`, 'info');
  log('');
  log('File changes will auto-sync after 1.5s debounce', 'info');
  log('Press Ctrl+C to stop', 'info');
  log('');
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  log('\nShutting down...', 'info');
  process.exit(0);
});

process.on('SIGTERM', () => {
  log('\nShutting down...', 'info');
  process.exit(0);
});

// Start the server
startDevServer().catch((error) => {
  log(`Failed to start server: ${error.message}`, 'error');
  process.exit(1);
});
