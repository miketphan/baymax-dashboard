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
- Tasks/Habits Sync (new)

**Features Required:**
- Smart Cascade update mechanism
- Kanban board (drag-drop)
- Markdown viewer with Update button
- Streak tracking for habits

**Revised 3-Week Build Plan:**

| Week | Focus | Deliverables |
|------|-------|--------------|
| **Week 1** | **Architecture + Projects Kanban** | D1 schema, API endpoints, **Projects Kanban MVP** (CRUD, drag-drop, basic view), Connected Services, Usage & Limits |
| **Week 2** | **Operations Manual + Polish** | Operations Manual viewer with Universal Update button, bidirectional sync, Projects Kanban polish ("Trigger Baymax", details view) |
| **Week 3** | **Final Integration + Polish** | Smart Cascade integration, "Trigger Baymax" button, Project Details view, testing & polish |

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

- Tasks & Habits (to-dos + recurring habits with streaks) — *Moved out of Phase 2 MVP*
- Trading Performance Tracker
- Daily Brief Automation
- Mobile-optimized Nexus view
- Guest/access sharing for friends

---

**Sync:** This file ↔ D1 ↔ Nexus Projects Section  
**Update Method:** Universal "Update" button triggers full sync of all Operations Manual content
