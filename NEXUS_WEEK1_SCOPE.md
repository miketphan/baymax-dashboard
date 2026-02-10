# Nexus Phase 2 - Week 1 Detailed Scope

> **Status:** Ready for Review  
> **Target:** Week of 2026-02-10 to 2026-02-17  
> **Prepared For:** Mike  

---

## Executive Summary

Week 1 establishes the technical foundation for Nexus Phase 2 and delivers the **Projects Kanban MVP** — a functional drag-and-drop project management board that will be used to track the remaining Nexus Phase 2 work (dogfooding).

**What "MVP" Means for Projects Kanban:**
- ✅ Full CRUD operations (Create, Read, Update, Delete projects)
- ✅ Drag-and-drop between columns (Backlog → In Progress → Done → Archived)
- ✅ Basic project details view (title, description, status, priority)
- ✅ Data persistence in D1 database
- ✅ Bidirectional sync with `PROJECTS.md`
- ❌ "Trigger Baymax" button (Week 2)
- ❌ Advanced filtering/search (Week 2)
- ❌ Project linking with tasks (Week 3)

---

## Deliverables Checklist

| # | Deliverable | Definition of Done |
|---|-------------|-------------------|
| 1 | **D1 Database Schema** | Tables created, indexes defined, migration scripts ready |
| 2 | **Cloudflare Workers API** | All endpoints deployed and tested via curl/Postman |
| 3 | **Connected Services Section** | Replaces Phase 1 "Systems Overview", displays 5 services with status |
| 4 | **Usage & Limits Section** | Replaces Phase 1 "Token Tracker", adds Brave Search quota tracking |
| 5 | **Projects Kanban MVP** | Functional board with drag-drop, CRUD, and D1 persistence |

---

## 1. Architecture & Database (Day 1-2)

### 1.1 Cloudflare D1 Schema Design

**Estimated Time:** 4 hours  
**Dependencies:** None

#### Tables Required:

```sql
-- Projects table (core for Week 1)
CREATE TABLE projects (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    status TEXT CHECK(status IN ('backlog', 'in_progress', 'done', 'archived')),
    priority TEXT CHECK(priority IN ('low', 'medium', 'high')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    metadata TEXT -- JSON for extensibility
);

-- Services status table (Connected Services)
CREATE TABLE services (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    display_name TEXT,
    status TEXT CHECK(status IN ('online', 'attention', 'offline')),
    last_check DATETIME,
    next_check DATETIME,
    details TEXT, -- JSON for service-specific data
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Usage tracking table (Usage & Limits)
CREATE TABLE usage_limits (
    id TEXT PRIMARY KEY,
    category TEXT NOT NULL, -- 'tokens', 'brave_search', 'api_calls'
    current_value INTEGER DEFAULT 0,
    limit_value INTEGER,
    period TEXT, -- 'session', 'daily', 'monthly'
    last_updated DATETIME,
    metadata TEXT -- JSON for cost estimates, etc.
);

-- Sync state table (for Smart Cascade)
CREATE TABLE sync_state (
    section TEXT PRIMARY KEY,
    last_sync DATETIME,
    etag TEXT,
    stale_after_minutes INTEGER DEFAULT 10
);
```

#### Indexes:
```sql
CREATE INDEX idx_projects_status ON projects(status);
CREATE INDEX idx_projects_priority ON projects(priority);
CREATE INDEX idx_services_status ON services(status);
CREATE INDEX idx_usage_category ON usage_limits(category);
```

**Deliverable:** `schema.sql` file + D1 migration applied

---

### 1.2 Cloudflare Workers Setup

**Estimated Time:** 3 hours  
**Dependencies:** D1 schema complete

#### Worker Configuration:

```toml
# wrangler.toml
name = "nexus-api"
main = "src/index.ts"
compatibility_date = "2024-02-10"

[[d1_databases]]
binding = "DB"
database_name = "nexus-production"
database_id = "<uuid>"
```

#### Core API Structure:
```
src/
├── index.ts          # Worker entry point, CORS setup
├── routes/
│   ├── projects.ts   # CRUD endpoints
│   ├── services.ts   # Connected Services endpoints
│   └── usage.ts      # Usage & Limits endpoints
├── lib/
│   ├── db.ts         # D1 query helpers
│   ├── sync.ts       # Markdown ↔ D1 sync logic
│   └── utils.ts      # ID generation, validation
└── types/
    └── index.ts      # TypeScript interfaces
```

**Deliverable:** Deployed worker responding to health check at `GET /health`

---

## 2. API Endpoints (Day 2-3)

### 2.1 Projects API

**Estimated Time:** 6 hours  
**Dependencies:** Worker setup complete

| Method | Endpoint | Description | Request Body |
|--------|----------|-------------|--------------|
| GET | `/api/projects` | List all projects | - |
| GET | `/api/projects/:id` | Get single project | - |
| POST | `/api/projects` | Create project | `{title, description, status, priority}` |
| PUT | `/api/projects/:id` | Update project | `{title?, description?, status?, priority?}` |
| DELETE | `/api/projects/:id` | Delete project | - |
| PATCH | `/api/projects/:id/status` | Quick status change | `{status}` |

**Example Response:**
```json
{
  "id": "proj_abc123",
  "title": "Build Nexus API",
  "description": "Cloudflare Workers + D1 backend",
  "status": "in_progress",
  "priority": "high",
  "created_at": "2026-02-10T14:30:00Z",
  "updated_at": "2026-02-10T16:45:00Z"
}
```

---

### 2.2 Connected Services API

**Estimated Time:** 3 hours  
**Dependencies:** Projects API complete

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/services` | Get all service statuses |
| POST | `/api/services/:id/refresh` | Trigger service check |

**Services to Monitor:**
1. **Google Calendar** — Next events, OAuth status
2. **Auto Backups** — Last backup time, storage usage
3. **Health Monitor** — Last heartbeat, auto-heal events
4. **System Updates** — OpenClaw version, available updates
5. **Security Audit** — Last scan date, warnings

**Example Response:**
```json
{
  "services": [
    {
      "id": "google_calendar",
      "display_name": "📅 Google Calendar",
      "status": "online",
      "last_check": "2026-02-10T16:00:00Z",
      "details": {
        "next_event": "Team Sync at 4:00 PM",
        "events_today": 3
      }
    }
  ],
  "summary": {
    "online": 4,
    "attention": 1,
    "offline": 0
  }
}
```

---

### 2.3 Usage & Limits API

**Estimated Time:** 2 hours  
**Dependencies:** Connected Services API complete

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/usage` | Get all usage metrics |
| POST | `/api/usage/:category/sync` | Trigger usage refresh |

**Categories:**
1. **LLM Tokens** — Session + monthly usage, cost estimate
2. **Brave Search** — Queries used / 2,000 monthly limit
3. **API Calls** — General API usage stats

**Example Response:**
```json
{
  "metrics": [
    {
      "category": "llm_tokens",
      "current_value": 45000,
      "limit_value": 100000,
      "period": "monthly",
      "cost_estimate": "$2.25",
      "progress_percent": 45,
      "status": "normal"
    },
    {
      "category": "brave_search",
      "current_value": 1845,
      "limit_value": 2000,
      "period": "monthly",
      "progress_percent": 92,
      "status": "warning"
    }
  ]
}
```

---

## 3. Frontend Components (Day 3-5)

### 3.1 Shared Components

**Estimated Time:** 3 hours  
**Dependencies:** API endpoints deployed

#### Components to Build:

| Component | Purpose | Location |
|-----------|---------|----------|
| `ApiClient` | Fetch wrapper with error handling | `lib/api.ts` |
| `StatusBadge` | Online/Attention/Offline indicators | `components/StatusBadge.tsx` |
| `ProgressBar` | Visual usage percentage | `components/ProgressBar.tsx` |
| `LoadingState` | Skeleton loaders | `components/LoadingState.tsx` |
| `ErrorBoundary` | Error handling | `components/ErrorBoundary.tsx` |

---

### 3.2 Connected Services Section

**Estimated Time:** 4 hours  
**Dependencies:** Shared components

**Layout:**
```
┌─────────────────────────────────────────────────────────┐
│ 📡 Connected Services                    [🔄 Refresh]   │
├─────────────────────────────────────────────────────────┤
│  ✅ Online: 4    ⚠️ Attention: 1    ❌ Offline: 0       │
├─────────────────────────────────────────────────────────┤
│  📅 Google Calendar              [🟢 Online]            │
│     Next: Team Sync at 4:00 PM                          │
│  💾 Auto Backups                 [🟢 Online]            │
│     Last: Today 12:00 AM | Next: Tomorrow 12:00 AM      │
│  🩺 Health Monitor               [🟢 Online]            │
│     Last check: 15 min ago                              │
│  🔄 System Updates               [🟡 Attention]         │
│     OpenClaw v2.1.0 available                           │
│  🔒 Security Audit               [🟢 Online]            │
│     Last scan: Sunday 9:00 AM                           │
└─────────────────────────────────────────────────────────┘
```

**Features:**
- Summary row with counts
- Individual service cards with expand/collapse
- Status indicator with color coding
- Refresh button (manual sync)

**Files:**
- `sections/ConnectedServices.tsx`
- `components/ServiceCard.tsx`

---

### 3.3 Usage & Limits Section

**Estimated Time:** 4 hours  
**Dependencies:** Connected Services complete

**Layout:**
```
┌─────────────────────────────────────────────────────────┐
│ 📊 Usage & Limits                        [🔄 Refresh]   │
├─────────────────────────────────────────────────────────┤
│  LLM Tokens (Monthly)                                   │
│  ████████████████████░░░░░  45K / 100K  ($2.25)         │
│                                                          │
│  Brave Search (Monthly)                                 │
│  █████████████████████████░  1,845 / 2,000  [⚠️ 92%]    │
│                                                          │
│  API Calls (Today)                                      │
│  ████████░░░░░░░░░░░░░░░░░  23 / 100                    │
└─────────────────────────────────────────────────────────┘
```

**Features:**
- Progress bars with percentage
- Cost estimates where applicable
- Warning states at thresholds (70%, 90%, 100%)
- Color coding: green → yellow → red

**Files:**
- `sections/UsageLimits.tsx`
- `components/UsageCard.tsx`

---

### 3.4 Projects Kanban MVP

**Estimated Time:** 10 hours  
**Dependencies:** All other sections complete

**Layout:**
```
┌─────────────────────────────────────────────────────────┐
│ 📋 Projects                             [+ New Project] │
├──────────────┬──────────────┬──────────────┬────────────┤
│   BACKLOG    │ IN PROGRESS  │    DONE      │  ARCHIVED  │
│     (3)      │     (2)      │     (1)      │    (0)     │
├──────────────┼──────────────┼──────────────┼────────────┤
│ ┌──────────┐ │ ┌──────────┐ │ ┌──────────┐ │            │
│ │ Nexus    │ ││ Nexus    │ ││ Phase 1  │ │            │
│ │ Phase 2  │ ││ Phase 2  │ ││ Migration│ │            │
│ │          │ ││ Week 1   │ ││          │ │            │
│ │ 🔴 High  │ ││          │ ││ 🟢 Low   │ │            │
│ └──────────┘ │ │ 🔴 High  │ │└──────────┘ │            │
│ ┌──────────┐ │ └──────────┘ │              │            │
│ │ Trading  │ │ ┌──────────┐ │              │            │
│ │ Tracker  │ ││ API      │ │              │            │
│ │          │ ││ Schema   │ │              │            │
│ │ 🟡 Med   │ ││          │ │              │            │
│ └──────────┘ │ │ 🟡 Med   │ │              │            │
│              │ └──────────┘ │              │            │
└──────────────┴──────────────┴──────────────┴────────────┘
```

**Features (MVP):**

| Feature | Implementation |
|---------|----------------|
| Drag-and-drop | `@dnd-kit/core` or native HTML5 drag API |
| Create project | Modal form with title, description, priority |
| Edit project | Inline or modal edit |
| Delete project | Confirm dialog → soft delete (move to archived) |
| Status change | Drag to column OR dropdown select |
| Priority indicator | 🔴 High / 🟡 Medium / 🟢 Low |
| Persist order | Store `sort_order` in D1 |

**Technical Implementation:**

```typescript
// Key interfaces
interface Project {
  id: string;
  title: string;
  description?: string;
  status: 'backlog' | 'in_progress' | 'done' | 'archived';
  priority: 'low' | 'medium' | 'high';
  sort_order: number;
  created_at: string;
  updated_at: string;
}

// Drag and drop handlers
const handleDragEnd = (event: DragEndEvent) => {
  const { active, over } = event;
  if (!over) return;
  
  const newStatus = over.id as ProjectStatus;
  const projectId = active.id as string;
  
  // Optimistic UI update
  updateProjectStatus(projectId, newStatus);
  
  // API call to persist
  api.patch(`/projects/${projectId}/status`, { status: newStatus });
};
```

**Files:**
- `sections/ProjectsKanban.tsx` — Main section
- `components/KanbanBoard.tsx` — Drag-drop container
- `components/KanbanColumn.tsx` — Individual column
- `components/ProjectCard.tsx` — Draggable card
- `components/ProjectModal.tsx` — Create/edit form

---

## 4. Bidirectional Sync (Day 5)

### 4.1 Markdown ↔ D1 Sync Logic

**Estimated Time:** 4 hours  
**Dependencies:** All CRUD operations working

**Sync Flow:**
```
┌──────────────┐     ┌──────────┐     ┌──────────────┐
│ PROJECTS.md  │◄────┤ Sync     ├────►│   D1 DB      │
│ (Source)     │     │ Engine   │     │ (Runtime)    │
└──────────────┘     └──────────┘     └──────────────┘
                            │
                            ▼
                     ┌──────────────┐
                     │ Nexus UI     │
                     │ (Dashboard)  │
                     └──────────────┘
```

**Rules:**
1. **PROJECTS.md is source of truth** for project metadata
2. **D1 is source of truth** for runtime state (status, position)
3. **Sync triggers:**
   - File watcher on `PROJECTS.md` → updates D1
   - UI "Sync" button → updates file from D1
   - Smart Cascade on engagement

**Implementation:**
```typescript
// Parse PROJECTS.md into structured data
function parseProjectsMarkdown(content: string): Project[] {
  // Extract project blocks using regex
  // Map to Project interface
}

// Generate markdown from projects
function generateProjectsMarkdown(projects: Project[]): string {
  // Maintain existing format from PROJECTS.md
  // Update only changed sections
}
```

**Deliverable:** `lib/sync.ts` with bidirectional sync functions

---

## 5. Task Dependencies & Timeline

### Gantt-style View

```
Day 1       Day 2       Day 3       Day 4       Day 5       Weekend
────────────────────────────────────────────────────────────────────
[DB Schema ==]
             [Workers ==]
                         [Projects API ====]
                                        [Services API ==]
                                                       [Usage API ==]
[───────────────────────────────────────────────────────────────────]
                         [Shared Components ===]
                                                      [Services UI ===]
                                                                   [Usage UI ===]
[───────────────────────────────────────────────────────────────────]
                                                                   [Kanban MVP ============]
                                                                                [Sync Logic ==]
                                                                                           [Test & Polish ==]
```

### Critical Path
1. DB Schema → Workers Setup → Projects API → Kanban MVP
2. Parallel track: Shared Components → Section UIs
3. Final: Sync Logic → Testing

---

## 6. Testing Strategy

### 6.1 API Testing (curl/Postman)

```bash
# Health check
curl https://nexus-api.your-subdomain.workers.dev/health

# Create project
curl -X POST https://nexus-api.your-subdomain.workers.dev/api/projects \
  -H "Content-Type: application/json" \
  -d '{"title":"Test Project","status":"backlog","priority":"high"}'

# List projects
curl https://nexus-api.your-subdomain.workers.dev/api/projects

# Update status
curl -X PATCH https://nexus-api.your-subdomain.workers.dev/api/projects/proj_123/status \
  -H "Content-Type: application/json" \
  -d '{"status":"in_progress"}'
```

### 6.2 Frontend Testing

| Test Case | Expected Result |
|-----------|-----------------|
| Create project | Appears in Backlog column |
| Drag to In Progress | Status updates, persists on refresh |
| Edit title | Updates in real-time |
| Delete project | Moves to Archived |
| Refresh page | All state restored from D1 |
| Mobile view | Columns stack vertically |

---

## 7. Week 1 Success Criteria

### Must Have (MVP)
- [ ] D1 schema created and migrated
- [ ] All API endpoints responding correctly
- [ ] Connected Services displays 5 services with status
- [ ] Usage & Limits shows progress bars with real data
- [ ] Projects Kanban supports drag-drop between all 4 columns
- [ ] Projects CRUD operations fully functional
- [ ] Changes persist to D1 and survive refresh

### Should Have
- [ ] Bidirectional sync with PROJECTS.md working
- [ ] Basic error handling (no silent failures)
- [ ] Loading states for all async operations

### Nice to Have
- [ ] Animations for drag-drop
- [ ] Keyboard shortcuts (Ctrl+N for new project)
- [ ] Optimistic UI updates

---

## 8. Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| D1 latency issues | Low | Medium | Use edge caching, optimistic UI |
| Drag-drop library conflicts | Medium | Low | Test early, have fallback ready |
| Scope creep for Kanban | High | Medium | Strict MVP definition, defer non-MVP features |
| Cloudflare Workers limits | Low | Medium | Monitor usage, implement caching |

---

## 9. Week 2 Preview (Context)

To understand where Week 1 fits, here's what follows:

| Week 2 Deliverable | Builds On |
|-------------------|-----------|
| Operations Manual viewer | API patterns from Week 1 |
| Universal "Update" button | Sync logic from Week 1 |
| "Trigger Baymax" button | Projects Kanban MVP |
| Project details view | Projects API |
| Bidirectional sync polish | Week 1 sync foundation |

---

## 10. Approval Checklist

Before work begins, confirm:

- [ ] **Architecture approved:** Cloudflare Workers + D1 confirmed
- [ ] **MVP scope approved:** Features marked MVP vs deferred
- [ ] **Timeline realistic:** 5-day build + weekend buffer
- [ ] **Dependencies clear:** No blockers identified
- [ ] **Testing approach agreed:** Manual testing sufficient for MVP

**Mike's Approval:** _________________ Date: _________________

---

## Appendix: File Structure

```
nexus-phase2/
├── wrangler.toml
├── package.json
├── schema.sql
├── migrations/
│   └── 001_initial.sql
├── src/
│   ├── index.ts
│   ├── routes/
│   │   ├── projects.ts
│   │   ├── services.ts
│   │   └── usage.ts
│   ├── lib/
│   │   ├── db.ts
│   │   ├── sync.ts
│   │   └── utils.ts
│   └── types/
│       └── index.ts
└── dashboard/
    ├── package.json
    ├── src/
    │   ├── App.tsx
    │   ├── lib/
    │   │   └── api.ts
    │   ├── components/
    │   │   ├── StatusBadge.tsx
    │   │   ├── ProgressBar.tsx
    │   │   ├── LoadingState.tsx
    │   │   ├── KanbanBoard.tsx
    │   │   ├── KanbanColumn.tsx
    │   │   ├── ProjectCard.tsx
    │   │   └── ProjectModal.tsx
    │   └── sections/
    │       ├── ConnectedServices.tsx
    │       ├── UsageLimits.tsx
    │       └── ProjectsKanban.tsx
    └── index.html
```

---

*Document Version: 1.0*  
*Prepared by: Baymax*  
*Date: 2026-02-10*
