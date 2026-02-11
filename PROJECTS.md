# Projects

> Source of Truth for all active and planned projects
> Last Updated: 2026-02-10

---

## Active Projects

### Nexus Phase 2
**Status:** 📋 Planning Complete, Ready to Build  
**Priority:** High  
**Started:** 2026-02-08  
**Target Completion:** 3 weeks (Week of 2026-03-01)

**Description:**  
Comprehensive personal dashboard evolution from Phase 1. Adds project management, task tracking, habit systems, and bidirectional sync capabilities.

**Key Deliverables:**
- Connected Services (consolidated systems monitoring)
- Usage & Limits (expanded token + API tracking)
- Operations Manual (viewer for protocols/processes/features)
- Projects Kanban (drag-drop project management)

**Architecture:**
- Frontend: Cloudflare Pages (nexus dashboard)
- Backend: Cloudflare Workers + D1 database
- Sync: Smart Cascade (user engagement → selective refresh)
- Storage: Markdown ↔ D1 ↔ Nexus (bidirectional)

**Processes Spawned:**
- Token Tracker Sync (existing, continues)
- Smart Cascade Sync (new)
- Projects Sync (new)

**Features Built:**
- ✅ Kanban board (drag-drop, CRUD)
- ✅ Smart Cascade update mechanism
- ✅ Markdown viewer with Update button
- ✅ "Trigger Baymax" button
- ✅ Project Details view
- ✅ Loading states & error handling
- ✅ Keyboard shortcuts

**Backlogged Features:**
- Streak tracking for habits (moved to backlog)

**Revised 3-Week Build Plan:**

| Week | Focus | Deliverables |
|------|-------|--------------|
| **Week 1** | **Architecture + Core Features** | D1 schema, API endpoints, Projects Kanban MVP, Connected Services, Usage & Limits, Operations Manual viewer, bidirectional sync |
| **Week 2** | **Polish + Advanced Features** | "Trigger Baymax" button, Project Details view, Smart Cascade integration, loading states, error handling, keyboard shortcuts |
| **Week 3** | **Testing + Deployment** | End-to-end testing, bug fixes, performance optimization, deployment, documentation, user acceptance testing |

**Rationale:** Projects Kanban built in Week 1 enables using it to track remaining Nexus Phase 2 work (dogfooding).

---

### Trading Performance Tracker
**Status:** 📅 Backlog  
**Priority:** Medium  
**Dependencies:** Nexus Phase 2 completion

**Description:**  
Comprehensive trading journal with P&L tracking, performance analytics, and strategy correlation.

---

### Daily Brief Automation
**Status:** 📅 Backlog  
**Priority:** Low  
**Dependencies:** Nexus Phase 2 completion

**Description:**  
Morning automated brief with calendar, priorities, market context, and daily focus.

---

## Completed Projects

### Nexus Phase 1
**Status:** ✅ Live  
**Completed:** 2026-02-07

**Features:**
- Systems Overview
- Token Tracker
- Active Systems
- Documentation (Phase 1)
- Dark mode
- Auto-sync

---

## Backlog

### Trigger Baymax Button — Full Feature Buildout
**Status:** 📋 Planned  
**Priority:** High  
**Dependencies:** API access (✅ available)

**Architecture:** API-Only (no file sync)
- Project data lives in D1 database
- Baymax fetches fresh data via API on demand
- No local file sync needed

**Requirements:**
1. **Confirmation Dialog**
   - Clicking "Trigger Baymax" opens confirmation modal
   - Shows: "Do you want Baymax to begin working on [Project Name]?"
   - Options: "Confirm" / "Cancel"
   - Cancel closes dialog, no action taken

2. **Immediate Task Trigger**
   - On Confirm: Notification sent to Baymax
   - Baymax calls API to fetch fresh project data
   - Spawns background work session
   - Begins working immediately

3. **Notification to User**
   - Telegram message: "Baymax has begun working on [Project Name]"
   - Includes: Timestamp, current status

4. **Work Session Integration**
   - Isolated session spawned
   - Real-time API calls for project data
   - Updates project status to "in_progress"

**User Story:**
> Mike sees a project that needs work. He clicks "Trigger Baymax", confirms. I immediately fetch the latest project data from API, begin working, and confirm back.

**Why API-only?**
- Cloudflare Workers can't write to local files
- API calls are instant and fresh
- No sync complexity or lag
- Industry standard for real-time data

---

- Tasks & Habits (to-dos + recurring habits with streaks) — *Moved out of Phase 2 MVP*
- Trading Performance Tracker
- Daily Brief Automation
- Mobile-optimized Nexus view
- Guest/access sharing for friends

---

**Sync:** This file ↔ D1 ↔ Nexus Projects Section  
**Update Method:** Universal "Update" button triggers full sync of all Operations Manual content
