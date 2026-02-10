# Features

> Source of Truth for Nexus capabilities and system features
> Last Updated: 2026-02-10

---

## Phase 1 Features (Live)

### Dark Mode
**Status:** ✅ Active  
**Description:** Toggle between light and dark themes  
**Location:** Nexus Dashboard (Phase 1)

---

### Auto-Sync
**Status:** ✅ Active  
**Description:** Automatic data refresh on page load  
**Location:** Token Tracker, Systems Overview

---

### Token Tracker
**Status:** ✅ Active  
**Description:** Live display of LLM token usage and costs  
**Data Source:** `auto-update-tokens.ps1` + cron

---

### Systems Overview
**Status:** ✅ Active  
**Description:** Status display for connected systems  
**Being Replaced By:** Connected Services (Phase 2)

---

## Phase 2 Features (Planned)

### Smart Cascade
**Status:** 📋 Planned  
**Priority:** Core architectural feature

**Description:**  
Intelligent update mechanism that only refreshes stale data when user engages. Nexus stays static when idle to save API calls and costs.

**How It Works:**
1. User engages (open page, refresh, switch back to tab)
2. "Pulse" fires — checks staleness of each section
3. Updates only sections with stale data
4. User sees fresh data without background noise

**Benefits:**
- Saves API quota
- Reduces costs
- Faster perceived performance
- No wasted background updates

**Applies To:** All Phase 2 sections

---

### Connected Services
**Status:** 📋 Planned  
**Priority:** High (after Kanban)  
**Replaces:** Systems Overview + Active Systems

**Description:**  
Consolidated monitoring of all connected systems with unified refresh.

**Services Monitored:**
- 📅 Google Calendar — Next events, sync status
- 💾 Auto Backups — Last/next backup, storage
- 🩺 Health Monitor — Last heartbeat, auto-heal events
- 🔄 System Updates — OpenClaw version, available updates
- 🔒 Security Audit — Last scan date, warnings/issues

**Features:**
- Summary row (Online/Attention/Offline counts)
- Single 🔄 Refresh button
- Individual service details on click
- Status indicators with color coding

---

### Usage & Limits
**Status:** 📋 Planned  
**Priority:** High (after Kanban)  
**Replaces:** Token Tracker (expanded scope)

**Description:**  
Comprehensive resource tracking across all services.

**Tracks:**
- LLM token usage (session + monthly)
- Brave Search API quota (2,000/month limit)
- Cost estimates
- Progress bars for visual feedback
- Alerts when approaching limits

**Features:**
- Progress bars
- Cost projections
- Limit warnings
- Historical trends

---

### Projects Kanban
**Status:** 📋 Planned  
**Priority:** High (Week 1)

**Description:**  
Drag-and-drop project management board.

**Columns:**
- Backlog
- In Progress
- Done
- Archived

**Features:**
- Drag-drop between columns
- Quick add/edit/delete
- View project details & history
- **"Trigger Baymax"** button → notifies me to start work
- Project linking (tasks ↔ projects)

**Data:** Stored in D1, synced with `PROJECTS.md`

---

### Tasks & Habits
**Status:** 📋 Planned  
**Priority:** High (Week 3)

**Description:**  
Personal productivity system with one-off tasks and recurring habits.

**Tasks:**
- One-off to-dos
- Due dates
- Priorities
- Project linking

**Habits:**
- Recurring (daily/weekly/custom)
- Streak tracking
- Completion history
- Visual streak indicators

**Features:**
- Check off completion
- Streak visualization
- Historical data
- Integration with Projects

**Data:** Stored in D1, synced bidirectionally

---

### Operations Manual Viewer
**Status:** 📋 Planned  
**Priority:** Medium (Week 2)

**Description:**  
Unified viewer for protocols, processes, and features documentation.

**Sections:**
- 📋 Project SOPs — From `PROJECTS.md`
- ⚡ Protocols — From `PROTOCOLS.md`
- 🔄 Processes — From `PROCESSES.md`
- 🔧 Setup Guides — Step-by-step procedures
- 📊 Troubleshooting — Common issues & fixes
- 📝 Runbooks — Recurring tasks

**Features:**
- **Universal "Update" button** — syncs ALL sections at once (not per-section)
- Markdown rendering
- Collapsible sections
- Search/filter capability

**Sync:** All source files ↔ D1 ↔ Operations Manual (bidirectional)

---

## Universal Update Button

**Status:** 📋 Planned  
**Location:** Operations Manual section header

**Behavior:**
- Single button to sync ALL Operations Manual content
- Triggers fetch from all source files: `PROJECTS.md`, `PROCESSES.md`, `PROTOCOLS.md`, `FEATURES.md`
- Updates D1 database
- Refreshes Nexus view
- NOT per-section buttons (one universal button only)

**Sync Flow:**
```
User clicks "Update" → Fetch all markdown files → Update D1 → Refresh Nexus view
```

---

## Feature Status Legend

| Icon | Meaning |
|------|---------|
| ✅ | Live and active |
| 📋 | Planned/ready to build |
| 🔄 | In development |
| ⚠️ | Needs attention |

---

**Sync:** This file ↔ D1 ↔ Nexus Operations Manual  
**Update Method:** Universal "Update" button triggers full sync of all Operations Manual content
