# Nexus Bidirectional Sync

This document describes the bidirectional sync system between markdown files and the D1 database.

## Overview

The sync system enables:
- **PROJECTS.md ↔ D1**: Bidirectional sync between markdown and database
- **Other files → D1**: Read-only sync (markdown source → viewer only)
- **Conflict Resolution**: Configurable strategies for PROJECTS.md conflicts
- **Auto-refresh**: Dashboard polls for updates and refreshes automatically

### Scope

| File | Direction | Editable in UI |
|------|-----------|----------------|
| `PROJECTS.md` | ↔️ Bidirectional | ✅ Yes (planned) |
| `PROTOCOLS.md` | ➡️ Read-only | ❌ No |
| `PROCESSES.md` | ➡️ Read-only | ❌ No |
| `FEATURES.md` | ➡️ Read-only | ❌ No |

## Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                     Markdown Files                           │
│  ┌─────────────┐ ┌──────────────┐ ┌──────────────┐          │
│  │ PROJECTS.md │ │ PROTOCOLS.md │ │ PROCESSES.md │ ...      │
│  │  (↔️ sync)   │ │  (📖 read)   │ │  (📖 read)   │          │
│  └──────┬──────┘ └──────┬───────┘ └──────┬───────┘          │
└─────────┼───────────────┼────────────────┼──────────────────┘
          │               │                │
          │    ┌──────────┴────────────────┴──────────┐
          │    │         File Watcher (Node.js)        │
          │    │  - Watches PROJECTS.md for changes    │
          │    │  - Loads others for display only      │
          │    └──────────┬────────────────────────────┘
          │               │
          │    ┌──────────┴──────────┐
          └───▶│  POST /api/sync/*   │
               │  (with file content)│
               └──────────┬──────────┘
                          │
          ┌───────────────┼───────────────┐
          │               │               │
   ┌──────▼──────┐ ┌──────▼──────┐ ┌─────▼──────┐
   │   D1 DB     │ │   D1 DB     │ │   D1 DB    │
   │  (projects) │ │ (protocols) │ │ (processes)│
   │  parsed &   │ │  stored as  │ │  stored as │
   │  structured │ │   markdown  │ │  markdown  │
   └──────┬──────┘ └──────┬──────┘ └─────┬──────┘
          │               │               │
          └───────────────┼───────────────┘
                          │
               ┌──────────┴──────────┐
               │   GET /api/sync/*   │
               │   (fetch content)   │
               └──────────┬──────────┘
                          │
               ┌──────────▼──────────┐
               │  Nexus Dashboard    │
               │  (React + Vite)     │
               │  - Displays all     │
               │  - Polls for updates│
               └─────────────────────┘
```

## Components

### 1. File Watcher (`scripts/watch-files.js`)

A Node.js script that watches PROJECTS.md for changes and syncs bidirectionally with D1. Other files are loaded for display but not auto-synced.

**Usage:**
```bash
# Start watching PROJECTS.md (runs continuously)
npm run watch

# One-time sync of PROJECTS.md
npm run watch:once

# Force sync PROJECTS.md
npm run sync
```

**Features:**
- Watches **PROJECTS.md** for bidirectional sync
- Loads PROTOCOLS.md, PROCESSES.md, FEATURES.md for display
- Debounces changes (2 second delay)
- Auto-syncs PROJECTS.md on file save
- Shows sync progress and results

### 2. Integrated Dev Server (`scripts/dev-with-sync.js`)

Combines the Vite dev server with the file watcher. Provides local API endpoints for the dashboard to trigger sync.

**Usage:**
```bash
npm run dev:full
```

**Endpoints:**
- `GET /api/local/files` - Get current file contents
- `POST /api/local/sync` - Trigger sync to D1
- `GET /api/local/status` - Get sync status

### 3. Dashboard Updates (`dashboard/src/sections/OperationsManual.tsx`)

Updated with:
- **Auto-polling**: Checks for updates every 10 seconds
- **Refresh Button**: Manual refresh from database
- **Sync Status**: Visual indicators (✅ fresh, ⚠️ stale, ❌ error)
- **Last Updated Timestamp**: Shows when data was last synced

### 4. API Endpoints (`src/routes/sync.ts`)

Updated to:
- Accept file content via POST requests
- Store content in memory (for Worker environment)
- Parse markdown and sync to D1
- Generate markdown from D1
- Handle conflict resolution

## File Structure

```
nexus-phase2/
├── PROJECTS.md          # Project data (↔️ bidirectional sync)
├── PROTOCOLS.md         # Protocol documentation (📖 read-only)
├── PROCESSES.md         # Process documentation (📖 read-only)
├── FEATURES.md          # Feature specifications (📖 read-only)
├── scripts/
│   ├── watch-files.js      # Standalone file watcher
│   └── dev-with-sync.js    # Integrated dev server
├── dashboard/
│   └── src/
│       └── sections/
│           └── OperationsManual.tsx  # Updated UI with read-only indicators
└── src/
    └── routes/
        └── sync.ts       # API endpoints (bidirectional for projects)
```

## Sync Flow

### PROJECTS.md ↔ D1 (Bidirectional Auto-sync)

1. User edits and saves `PROJECTS.md`
2. File watcher detects change (after 2s debounce)
3. Watcher reads file content
4. Watcher POSTs content to `/api/sync/projects`
5. API parses markdown into project objects
6. API creates/updates/deletes projects in D1
7. API updates sync state
8. Dashboard (polling) detects sync state change
9. Dashboard refreshes project data

### Read-Only Files (Markdown → Viewer)

1. On startup, file watcher loads `PROTOCOLS.md`, `PROCESSES.md`, `FEATURES.md`
2. Files are sent to API and stored for display
3. Dashboard displays content directly from stored markdown
4. Changes to these files require restart or manual sync

### Manual Sync (Dashboard)

1. User clicks "Universal Update" button
2. Dashboard calls `triggerLocalSync()` (if available) to sync PROJECTS.md
3. Dashboard calls `triggerUniversalSync()`
4. API syncs PROJECTS.md bidirectionally
5. API updates read-only section states
6. Dashboard reloads all content

### D1 → PROJECTS.md

1. Call `GET /api/sync/projects` without content
2. API fetches projects from D1
3. API generates markdown
4. Returns markdown in response
5. (Optional) Save to file (currently manual)

## Markdown Format

### PROJECTS.md

```markdown
# Projects

> Source of Truth for all active and planned projects
> Last Updated: 2026-02-10

---

## Active Projects

### Project Title
**Status:** 🔄 In Progress
**Priority:** High
**Started:** 2026-02-01
**Target Completion:** 2026-02-15

**Description:**
Project description here...

**Key Deliverables:**
- Deliverable 1
- Deliverable 2

**Features Required:**
- Feature 1
- Feature 2

---

## Backlog

- Future project idea (medium priority)
```

## Configuration

### Environment Variables

```bash
# API URL for file watcher
NEXUS_API_URL=https://nexus-api.miket-phan.workers.dev/api

# Dashboard port (for dev-with-sync)
PORT=5173
```

### Sync Options

When calling sync endpoints:

```json
{
  "direction": "to_d1",        // "to_d1", "to_file", "bidirectional"
  "conflictResolution": "prefer_file",  // "prefer_d1", "prefer_file", "manual"
  "dryRun": false              // Preview changes without applying
}
```

## Scripts

### Root `package.json`

```json
{
  "scripts": {
    "watch": "node scripts/watch-files.js",
    "watch:once": "node scripts/watch-files.js --once",
    "sync": "node scripts/watch-files.js --sync",
    "dev:full": "node scripts/dev-with-sync.js"
  }
}
```

## Testing

### Manual Test Flow

1. **Start the file watcher:**
   ```bash
   cd nexus-phase2
   npm run watch
   ```

2. **Edit PROJECTS.md:**
   - Add a new project
   - Save the file

3. **Verify sync:**
   - Watch console for sync success message
   - Check API for updated projects: `GET /api/projects`

4. **Test dashboard:**
   - Open dashboard
   - Verify project appears
   - Check sync status indicator

5. **Test conflict resolution:**
   - Edit project in dashboard (when that feature exists)
   - Edit same project in markdown
   - Sync and verify conflict resolution

## Known Limitations

1. **File Access**: Cloudflare Workers cannot access the local filesystem. File content must be sent via POST from the file watcher.

2. **In-Memory Storage**: In the Worker environment, file content is stored in memory (lost on restart). For production, use R2 or KV storage.

3. **Conflict Detection**: Currently uses simple field comparison for PROJECTS.md. More sophisticated diffing could be added.

4. **D1 → File Sync**: PROJECTS.md can be generated from D1 but isn't automatically saved to filesystem (Worker limitation).

5. **Read-Only Updates**: Changes to PROTOCOLS.md, PROCESSES.md, FEATURES.md require a restart or manual sync to update in the dashboard.

## Future Enhancements

- [ ] WebSocket for real-time updates (instead of polling)
- [ ] R2 storage for file content in production
- [ ] GitHub integration for file storage
- [ ] Rich text editor in dashboard
- [ ] Visual diff viewer for conflicts
- [ ] Scheduled sync jobs
