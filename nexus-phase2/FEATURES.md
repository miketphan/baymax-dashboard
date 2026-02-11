# Features

> Feature specifications and requirements
> Last Updated: 2026-02-10

---

## Core Features

### Project Management
**Status:** ✅ Implemented
**Priority:** High

**Description:**
Full CRUD operations for projects with priority, status, and metadata tracking.

**Requirements:**
- Create, read, update, delete projects
- Status tracking (backlog, in_progress, done, archived)
- Priority levels (high, medium, low)
- Metadata support for custom fields

### Service Health Monitoring
**Status:** ✅ Implemented
**Priority:** High

**Description:**
Monitor external services and APIs with automated health checks.

**Requirements:**
- Configurable check intervals
- Status indicators (online, attention, offline)
- Historical status tracking
- Alert on status changes

### Usage & Limits Tracking
**Status:** ✅ Implemented
**Priority:** Medium

**Description:**
Track API usage, costs, and limits across all integrated services.

**Requirements:**
- Real-time usage metrics
- Cost estimation
- Threshold alerts
- Period-based tracking (session, daily, weekly, monthly)

## Planned Features

### Bidirectional Sync
**Status:** 🔄 In Progress
**Priority:** High

**Description:**
Sync between markdown files and D1 database with conflict resolution.

**Requirements:**
- File watching for auto-sync
- Manual sync trigger
- Conflict detection and resolution
- Preserve markdown formatting

---

**Sync:** This file ↔ D1 ↔ Nexus Features Section
