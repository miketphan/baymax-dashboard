# Phase 2 Nexus — Complete Project Plan

**Status:** Ready to begin | **Stored:** 2026-02-09 | **Trigger:** Awaiting user go-ahead

---

## Executive Summary

**Vision:** Phase 2 Nexus becomes an interactive, database-driven extension of Baymax — where Mike can view real-time data, manage projects via Kanban, trigger Baymax to perform work, and have all information stay in sync through Smart Cascade. **Key Innovation:** Markdown files (PROJECTS.md, PROCESSES.md) are the source of truth, with bidirectional sync to Nexus UI.

**Architecture:** Cloudflare Workers + D1 Database + KV Cache + React Frontend
**Cost:** ~$1.50 USD (hybrid model usage) + $0/month (Cloudflare free tier)
**Timeline:** 3 weeks (14 hours Baymax work, ~50 minutes Mike involvement)

---

## User Requirements Summary

### Primary User
- **Just Mike** (single user, personal tool)

### Device Priority
- Desktop-first
- Mobile app-like experience second

### Update Mechanism
- **Smart Cascade**: User-driven refreshes only
  - Page load
  - Manual refresh button
  - Tab switch back to Nexus
  - After user actions (completing tasks, etc.)
- No background updates when user not viewing

### Budget Constraints
- Optimize for cost where functionality doesn't suffer
- Free tier preferred, paid acceptable if justified

### Security
- Email authentication (same as Phase 1)
- Remember for 30 days
- Appropriate for personal use

---

## Architecture

```
┌─────────────────────────────────────────┐
│           CLOUDFLARE EDGE               │
├─────────────────────────────────────────┤
│  ┌─────────────┐    ┌─────────────┐    │
│  │   WORKERS   │◄──►│  KV CACHE   │    │
│  │   (API)     │    │  (Fast Data)│    │
│  └──────┬──────┘    └─────────────┘    │
│         │                               │
│         ▼                               │
│  ┌─────────────┐    ┌─────────────┐    │
│  │     D1      │◄──►│  R2 Storage │    │
│  │  (Database) │    │  (Files)    │    │
│  └─────────────┘    └─────────────┘    │
└─────────────────────────────────────────┘
           │
           ▼
┌─────────────────────────────────────────┐
│         BROWSER (NEXUS UI)              │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐  │
│  │  React  │ │  State  │ │  Smart  │  │
│  │Components│ │  Mgmt   │ │Cascade  │  │
│  └─────────┘ └─────────┘ └─────────┘  │
└─────────────────────────────────────────┘
```

### Data Model

| Entity | Storage | Purpose |
|--------|---------|---------|
| **Session** | KV | Auth token, preferences, last visit timestamp |
| **Token Usage** | KV | Current session data for fast reads |
| **Projects** | D1 | Kanban items, status, details, history |
| **Processes** | D1 | Documentation, steps, last updated |
| **Integrations** | D1 | API keys (encrypted), sync settings |
| **Activity Log** | D1 | Audit trail of changes |
| **Work Requests** | D1 | Trigger Baymax queue |

### Markdown Sync Architecture (Source of Truth)

**Principle:** Markdown files in workspace are the **source of truth**. Nexus displays are **views** of this data.

```
┌─────────────────────────────────────────────┐
│          MARKDOWN SOURCE FILES              │
├─────────────────────────────────────────────┤
│  PROJECTS.md → PROJECTS table (D1)         │
│  PROCESSES.md → PROCESSES table (D1)       │
│  PROTOCOLS.md → (display only, no sync)    │
│  FEATURES.md → (display only, no sync)     │
└──────────────────┬──────────────────────────┘
                   │ Parser Script
                   ▼
┌─────────────────────────────────────────────┐
│              D1 DATABASE                    │
│  Structured, queryable, fast reads          │
└──────────────────┬──────────────────────────┘
                   │ API
                   ▼
┌─────────────────────────────────────────────┐
│              NEXUS UI                       │
│  Interactive, editable, real-time           │
└─────────────────────────────────────────────┘
```

**Sync Strategy:**
| Direction | Trigger | Method |
|-----------|---------|--------|
| Markdown → D1 | Git push to main | Parser script in GitHub Action |
| D1 → Markdown | User edits in Nexus | "Save & Sync" button triggers git commit |
| Bidirectional | Manual sync command | Force re-parse and update |

**Bidirectional Workflow:**
1. **I edit markdown** → commit → push → auto-parse → D1 updates
2. **You edit in Nexus** → D1 updates → "Sync to Markdown" → git commit
3. **Conflict resolution:** Last-write-wins with timestamp tracking

---

## Section-by-Section Breakdown

### 1. Connected Services (Consolidated)

**Replaces:** Systems Overview + Active Systems (eliminated redundancy)

| Aspect | Phase 1 | Phase 2 |
|--------|---------|---------|
| **Display** | Static cards | Live status + expandable details |
| **Data** | Hardcoded HTML | Real-time API health checks |
| **Interactions** | View only | Click any card for full metrics & actions |
| **Update Trigger** | Manual edit | Smart Cascade (single "Refresh Nexus" button) |

**Header Design:**
```
┌─────────────────────────────────────────────────────────┐
│ 🟢 4 Online    🟡 0 Attention    🔴 0 Offline  [🔄]    │
│ Last check: 2 min ago                                   │
└─────────────────────────────────────────────────────────┘
```

**Services Monitored:**

| Service | What It Shows | Status |
|---------|---------------|--------|
| 📅 **Google Calendar** | Next event, sync status, API health | Active service |
| 💾 **Auto Backups** | Last backup, next scheduled, storage used | Scheduled maintenance |
| 🩺 **Health Monitor** | Last heartbeat, auto-heal event count, open alerts | Self-monitoring |
| 🔄 **System Updates** | OpenClaw version, available updates, last check | Daily monitoring |
| 🔒 **Security Audit** | Last scan date, findings status, next scheduled | Weekly scan |

**Click any card** → Expands to full metrics, logs, and manual actions

---

### 2. Usage & Limits (Token Tracker + Service Quotas)

| Aspect | Phase 1 | Phase 2 |
|--------|---------|---------|
| **Display** | Compact cards | Unified resource consumption dashboard |
| **Data** | Token JSON only | KV cache + D1 history for all services |
| **Services Tracked** | LLM tokens only | LLM tokens + API quotas (Brave Search) |
| **Update Trigger** | Cron job (every 10 min) | Smart Cascade + auto-sync |

**Features:**

**LLM Token Usage:**
| Model | Session | Monthly | Limit | Usage Bar |
|-------|---------|---------|-------|-----------|
| 🎯 Kimi | 73K | 505K | 1M | ████░░░░ |
| ⚡ Flash | 0 | 125K | 500K | ██░░░░░░ |
| 🧩 Pro | 0 | 45K | 200K | █████░░░ |

**API Service Quotas:**
| Service | Used | Limit | Reset Date |
|---------|------|-------|------------|
| 🔍 Brave Search | 156 | 2,000 | Monthly |

**Cost Tracking:**
- 💰 **Est. Monthly Cost:** $1.92 USD
- 📊 **Cost breakdown by service**
- 📈 **7-day / 30-day trends** (expandable)

---

### 3. Operations Manual (Consolidated Documentation)

**Replaces:** Documentation & Processes (expanded scope)

| Aspect | Phase 1 | Phase 2 |
|--------|---------|---------|
| **Display** | Static HTML cards | Searchable, categorized knowledge base |
| **Sources** | Hardcoded | Multiple markdown files → Parser → D1 |
| **Interactions** | View only | Browse, search, expand, "Request Update" |
| **Sync** | Manual git edit | Bidirectional (markdown ↔ Nexus) |
| **Organization** | Flat list | Categorized sections |

**Source of Truth Files:**

| Section | Source File | Content |
|---------|-------------|---------|
| **Processes** | `PROCESSES.md` | Active workflows (Calendar API, Token Sync, Deploy) |
| **Protocols** | `PROTOCOLS.md` | Rules I follow (Shutdown, Privacy, Cost, Date/Time) |
| **System Reference** | `FEATURES.md` | How things work (Smart Cascade, Monitoring) |
| **Project SOPs** | `PROJECT_SOPS.md` ⭐ **NEW** | Standard operating procedures for complex projects |

**Project SOPs Purpose:**
- **Kanban** shows: "Build Phase 2 — In Progress" (current state / action)
- **Operations Manual SOP** shows: Complete architecture, troubleshooting guides, maintenance procedures (reference)
- **Use case:** 6 months later, something breaks → quick SOP reference instead of digging through Kanban history

**Features:**
- Global search across all sections
- Cross-referenced links between docs
- "Last updated" timestamps
- "Request Update" button → Creates Work Request
- Expandable detail views
- Status indicators (active/paused/archived)

---

### 4. Future Projects & Roadmap (Synced from PROJECTS.md)

| Aspect | Phase 1 | Phase 2 |
|--------|---------|---------|
| **Display** | Static cards | **Interactive Kanban board** |
| **Source** | Hardcoded HTML | **PROJECTS.md** (markdown) → Parser → D1 |
| **Interactions** | View only | Drag-drop status, CRUD, "Start Work" trigger |
| **Baymax Awareness** | ✅ Knows roadmap | ✅ Manages active projects |
| **Sync Trigger** | Manual edit | Git push → auto-parse OR "Sync to Markdown" button |
| **Bidirectional** | ❌ No | ✅ Yes (Nexus edits write back to markdown) |

**Features:**
- **Kanban columns:** Backlog | Planned | In Progress | Complete
- **Drag and drop** between columns
- **Add new project** (title, description, priority)
- **Edit existing** project details
- **Delete** projects
- **"Start Work" button** → Triggers Baymax (with confirmation dialog)
- **Project detail view:** Full requirements, notes, progress history

**"Start Work" Workflow:**
1. User clicks "Start Work" on project card
2. **Confirmation dialog appears:** "Start work on [Project Name]?"
3. User confirms
4. Work Request created in D1 (status: pending)
5. **Immediate message to Mike:** "I've begun work on [Project Name]"
6. Baymax works on it
7. Results saved back to D1
8. Nexus updates: Project status → "In Progress" → "Complete"

---

## "Trigger Baymax" Integration

### Workflow Detail

```
User clicks "Start Work"
        ↓
[Confirmation Dialog]
        ↓
User confirms
        ↓
Nexus API: Create Work Request in D1
        ↓
Message sent to Baymax (Telegram + stored in D1)
        ↓
Baymax replies: "I've begun work on [Project]"
        ↓
Baymax works
        ↓
Results saved to D1
        ↓
Nexus displays updated status
```

### Work Request Schema

```json
{
  "id": "uuid",
  "project_id": "project_uuid",
  "project_name": "Trading Performance Tracker",
  "status": "pending | acknowledged | in_progress | complete | failed",
  "requested_at": "2026-02-09T10:00:00Z",
  "acknowledged_at": "2026-02-09T10:00:15Z",
  "completed_at": "2026-02-09T10:30:00Z",
  "result_summary": "Built API endpoints, deployed to staging",
  "conversation_reference": "telegram_msg_id"
}
```

---

## Smart Cascade Implementation

### Philosophy
**One-button refresh.** Instead of per-section refresh buttons, a single "Refresh Nexus" button triggers comprehensive freshness checks. Smart Cascade intelligently updates only what's stale, not blindly re-fetching everything.

### Header Design
```
┌─────────────────────────────────────────────┐
│  🤖 Baymax Nexus          [🔄 Refresh]      │
│                                             │
│  Last full check: 4 minutes ago             │
│  Systems updated: Token Tracker, Calendar   │
│  (Auto-refresh on tab switch)               │
└─────────────────────────────────────────────┘
```

### Trigger Events
1. **Page Load** — Full check, refresh all stale data
2. **🔄 Refresh Button Click** — Force comprehensive refresh (one button for all)
3. **Tab Visibility Change** — Quick check if >5 min since last update
4. **User Action** (complete task, move project) — Update that section + check others

### Stale Data Detection

| Section | Max Age | Check Method |
|---------|---------|--------------|
| Systems Overview | 5 min | API health check |
| Active Systems | 5 min | API status fetch |
| Token Tracker | 10 min | Read from KV |
| Documentation | 30 min | D1 timestamp check |
| Projects | 5 min | D1 query |

### Optimization
- Only fetch what's stale (not blind re-fetch)
- Parallel API calls where possible
- Cache aggressively in KV
- Lazy load sections below fold
- Show transparency: which sections actually updated

---

## Integration Requirements

### Google Calendar
- **API:** Google Calendar API v3
- **Data:** Next 5 events, sync status
- **Refresh:** On Smart Cascade trigger
- **Auth:** OAuth2 (stored encrypted in D1)

### GitHub (Existing)
- **API:** GitHub REST API
- **Data:** Deployment status, recent commits
- **Refresh:** On Smart Cascade trigger
- **Auth:** Already configured via Cloudflare Pages

### No Additional Integrations Required
- No trading broker (deferred)
- No Notion (Nexus replaces it)
- No TradingView (deferred)

---

## Development Timeline

### Week 1: Foundation + Markdown Sync + Monitoring (5 hours)

**My Tasks:**
- [ ] Create D1 database schema (projects, processes, sync metadata, monitoring logs)
- [ ] Set up Cloudflare Worker API endpoints
- [ ] Implement KV caching layer
- [ ] **Build Markdown Parser** (PROJECTS.md → D1, PROCESSES.md → D1)
- [ ] **Create GitHub Action** for auto-sync on push
- [ ] **Build Monitoring & Alerting System**
  - [ ] Cron heartbeat every 10 min
  - [ ] Health check functions for all systems
  - [ ] Auto-healing logic
  - [ ] Real-time alert dispatch
- [ ] Build **Connected Services** section (consolidated: Calendar, Backups, Health Monitor, Updates, Security)
- [ ] Build **Usage & Limits** section (Token Tracker + Brave Search quotas)
- [ ] Set up Smart Cascade framework

**Your Involvement:**
- [ ] Provide Cloudflare API token (5 min)
- [ ] Review D1 schema (1 message)
- [ ] Confirm alert preferences (real-time vs digest)

**Deliverable:** Nexus loads with live data + markdown auto-sync + proactive monitoring working

---

### Week 2: Projects & Documentation + Bidirectional Sync (4 hours)

**My Tasks:**
- [ ] Build Kanban board component (drag-drop)
- [ ] Implement project CRUD API
- [ ] Create project detail view
- [ ] Build **Operations Manual** framework (4 sections: Processes, Protocols, System Reference, Project SOPs)
- [ ] Create markdown parser for multiple source files (PROCESSES.md, PROTOCOLS.md, FEATURES.md, PROJECT_SOPS.md)
- [ ] **Implement "Sync to Markdown" button** (D1 → PROJECTS.md)
- [ ] **Create git commit workflow** from Nexus edits
- [ ] Implement "Update with Baymax" button
- [ ] Create Work Request system

**Your Involvement:**
- [ ] Test Kanban functionality (10 min)
- [ ] Test bidirectional sync (edit in Nexus → see in markdown) (5 min)
- [ ] Report any bugs (1-2 messages)

**Deliverable:** Interactive Projects and Documentation sections with bidirectional markdown sync

---

### Week 3: Trigger Baymax & Polish (3 hours)

**My Tasks:**
- [ ] Implement "Start Work" confirmation dialog
- [ ] Build Work Request → Baymax notification system
- [ ] Implement Baymax reply → status update flow
- [ ] Finalize Smart Cascade integration
- [ ] Add mobile responsiveness
- [ ] Performance optimization
- [ ] Error handling & edge cases

**Your Involvement:**
- [ ] Test "Start Work" workflow (10 min)
- [ ] Confirm mobile experience (optional, 5 min)

**Deliverable:** Complete Phase 2 Nexus with all interactive features

---

## Cost Analysis

### Cloudflare (Free Tier)
| Service | Free Tier | Our Usage | Cost |
|---------|-----------|-----------|------|
| Workers | 100k/day | ~500/day | $0 |
| KV | 1GB | ~10MB | $0 |
| D1 | 5GB | ~50MB | $0 |
| Pages | Unlimited | 1 site | $0 |
| **Total** | | | **$0/month** |

### Model Usage (One-Time Phase 2 Build)
| Task Type | Model | Est. Tokens | Cost |
|-----------|-------|-------------|------|
| Routine coding, components | Gemini Flash | ~1M | ~$0.50 |
| Architecture, complex logic | Kimi | ~400k | ~$1.20 |
| Debugging when stuck | Kimi | ~200k | ~$0.60 |
| **Total** | **Hybrid** | **~1.6M** | **~$2.30 USD** |

**Buffer:** +30% for unexpected complexity = **~$4.00 USD max**

---

## Backlog (Phase 3+)

### Tasks/Habits Section
- Daily task checklist
- Recurring habit tracking
- Calendar heatmap visualization
- Streak counters

### Trading P&L Logging
- Daily P&L entry form
- Weekly/monthly summary charts
- Win rate tracking
- Setup performance analytics

### Additional Integrations
- Trading broker API (when ready)
- TradingView webhooks
- More notification channels

---

## Markdown Sync System (Technical)

### Parser Requirements

**Input:** `PROJECTS.md` and `PROCESSES.md` (GitHub-flavored markdown)
**Output:** Structured JSON → D1 tables

**Parsing Logic:**
```
# Project Title (H1) → project.name
**Status:** Active | Backlog | Complete → project.status
**Priority:** High | Medium | Low → project.priority
**Description:** ... → project.description

## Section Headers (H2) → project.sections[]
- List items → project.tasks[]
```

### Sync Workflow

**Git Push → D1:**
1. GitHub Action detects push to `main`
2. Runs `parse-markdown.js` script
3. Compares current markdown hash with last sync
4. If changed: parse → validate → upsert to D1
5. Updates `sync_metadata` table with timestamp and hash

**Nexus Edit → Markdown:**
1. User drags card or edits details in Nexus
2. D1 updates immediately (responsive UI)
3. "Sync to Markdown" button appears (indicating drift)
4. User clicks button → Worker calls GitHub API
5. Creates commit with updated markdown
6. Auto-merges if no conflicts

### Conflict Resolution

**Scenario:** I edit markdown while you edit Nexus
**Detection:** Hash mismatch between D1 and markdown file
**Resolution:** 
- Option A: Markdown wins (my edit takes precedence)
- Option B: Nexus wins (your edit takes precedence)  
- Option C: Manual merge (present both, you choose)

**Default:** Last-write-wins with timestamp display

### Sync Status Indicators

| Indicator | Meaning |
|-----------|---------|
| 🟢 In Sync | D1 matches markdown exactly |
| 🟡 Drift | Nexus has edits not in markdown |
| 🔴 Conflict | Both changed simultaneously |
| ⏳ Syncing | Operation in progress |

---

## Monitoring & Alerting System (New Phase 2 Component)

### Philosophy
**Active monitoring with auto-healing.** Mike's first notice of any system issue should be a message from Baymax, not by stumbling across it in Nexus.

### Two-Layer Architecture

```
┌─────────────────────────────────────────────┐
│  BASE LAYER: Cron Heartbeat                 │
│  Every 10 minutes when PC is on             │
│  → Monitors all systems                     │
│  → Auto-heals if possible                   │
│  → Alerts of any issues (all tiers)         │
│  (Runs regardless of Nexus being open)      │
└─────────────────────────────────────────────┘
                    +
┌─────────────────────────────────────────────┐
│  BONUS LAYER: Smart Cascade                 │
│  When user opens/refreshes Nexus            │
│  → Checks what's stale                      │
│  → Updates UI immediately                   │
│  → Additional peace of mind                 │
│  (Extra checks on top of base layer)        │
└─────────────────────────────────────────────┘
```

### Monitored Systems

| System | Check Method | Auto-Heal Attempt | Alert Tier |
|--------|--------------|-------------------|------------|
| **Google Calendar API** | Auth test | Refresh token, retry auth | 🟡/🔴 |
| **Token Sync** | Last sync timestamp | Switch model, retry | 🟡/🔴 |
| **Cloudflare Deploy** | GitHub webhook status | Retry once | 🟡/🔴 |
| **GitHub Connection** | API health check | None (manual fix) | 🔴 |
| **Backups** | Last backup timestamp | Retry with delay | 🟠/🔴 |

### Alert Tiers (Option A: Real-Time)

| Severity | Scenario | Example Message |
|----------|----------|-----------------|
| **🟡 FYI** | Failed, auto-fixed immediately | "🟡 Calendar API auth expired at 2:15 PM → Auto-refreshed in 3 seconds → Operational" |
| **🟠 Attention** | Failed, auto-fixed after retries | "🟠 Token sync failed 3 times in 10 min → Switched to Flash model → Working now, monitoring closely" |
| **🔴 Action Needed** | Failed, couldn't auto-fix | "🚨 Backup failed, auto-retry didn't work → Error: Disk space low → Action: Clear space or guide available" |

### Frequency & Cost

- **Base heartbeat:** Every 10 minutes (when PC is on)
- **Est. checks/day:** ~96 (16 active hours, not 24)
- **Cost impact:** Minimal (~$1-2/month for monitoring)
- **API limits:** No risk (well under all service limits)

### Implementation

**Week 1 addition to scope:**
- [ ] Create monitoring cron job (10 min interval)
- [ ] Build health check functions for each system
- [ ] Implement auto-healing logic
- [ ] Create alert dispatch system
- [ ] Test each failure scenario

**Deliverable:** Proactive monitoring with immediate alerts and auto-healing

---

## Maintenance Plan

### Ongoing (Post-Launch)
- Monitor error logs via Cloudflare
- Monthly dependency updates
- Quarterly performance reviews
- Feature additions via "Start Work" triggers

### Backup Strategy
- D1 automated backups (Cloudflare native)
- GitHub repo for code
- Documented schema for recovery

---

## Success Criteria

✅ **Functional:** All sections display real, current data
✅ **Interactive:** Projects Kanban works (drag, add, edit, delete)
✅ **Connected:** "Start Work" triggers Baymax with confirmation
✅ **Responsive:** Mobile experience is usable
✅ **Fast:** Page loads < 2s, updates < 1s
✅ **Reliable:** 99% uptime (Cloudflare SLA)
✅ **Monitored:** Proactive alerts within 10 min of any failure
✅ **Auto-Healing:** Common issues resolve without user intervention
✅ **Cost-Effective:** <$5 total build cost

---

## Next Steps (When You Say Go)

1. **Receive Cloudflare API Token** from you
2. **Create D1 database** and schema
3. **Deploy Week 1** foundation
4. **Report back** with live URL for testing

**Stored and ready. Awaiting your signal to begin.**

---

*Document Version: 3.0*
*Last Updated: 2026-02-09 8:25 PM EST*
*Status: READY TO EXECUTE — Updated with Markdown Sync Architecture + Monitoring & Alerting System*
