# Features

System capabilities and functionality.

---

## Nexus Dashboard Features

### Smart Cascade
**Type:** Update mechanism
**Function:** User-driven data refresh (not background)

**Triggers:**
- Page load (full check)
- Manual refresh button
- Tab switch back (if >5 min stale)
- User actions (edit, complete, move)

**Logic:** Check timestamps → update only stale sections → parallel API calls

---

### Dark Mode
**Type:** UI Theme
**Description:** Premium dark glassmorphism design
**Elements:**
- Gradient backgrounds
- Glass cards with blur
- Glowing accent colors
- Animated Baymax icon

---

### Token Tracker v2 (Phase 2)
**Type:** Data visualization
**Function:** Real-time LLM usage tracking

**Displays:**
- Current session tokens
- Monthly running total
- Progress bars (green/yellow/red)
- Cost estimate (USD)
- Historical trends (expandable)

---

### Projects Kanban (Phase 2)
**Type:** Interactive board
**Function:** Manage roadmap items

**Features:**
- Drag-drop between columns
- Add/edit/delete projects
- Status tracking (Backlog/Planned/In Progress/Complete)
- Detail view with requirements
- "Start Work" trigger button

**Columns:** Backlog | Planned | In Progress | Complete

---

### Documentation Viewer (Phase 2)
**Type:** Content browser
**Function:** Browse and update processes

**Features:**
- List view (title + description)
- Detail view (full content)
- Search/filter
- "Update with Baymax" button

---

### Trigger Baymax Integration (Phase 2)
**Type:** Workflow trigger
**Function:** Initiate work directly from Nexus

**Flow:**
1. Click "Start Work" → Confirmation dialog
2. User confirms → Work Request created
3. Baymax immediately notified
4. Baymax replies: "I've begun work on [Project]"
5. Work completed → Results saved → Status updated

---

## Authentication Features

### Email Auth
**Type:** Security
**Method:** Google OAuth via Cloudflare Access
**Session:** 30-day remember

---

*Last Updated: 2026-02-09*
