# Processes

> Source of Truth for active workflows and automated systems
> Last Updated: 2026-02-10

---

## Active Processes

### Google Calendar API
**Status:** ✅ Active  
**Location:** `GOOGLE_CALENDAR_SETUP.md`  
**Integration:** OpenClaw Calendar Skill

**What It Does:**
- Auto-adds events from natural language
- Manages OAuth tokens securely
- Syncs with Google Calendar API
- Displays next events in Nexus Connected Services

**Trigger:** User says "add to calendar" or natural language event description  
**Frequency:** On-demand + daily sync check

---

### Token Tracker Sync
**Status:** ✅ Active  
**Location:** Cron job (`baymax-dashboard` GitHub repo)  
**Integration:** Nexus Dashboard

**What It Does:**
- Fetches OpenClaw session data via `auto-update-tokens.ps1`
- Updates Nexus Usage & Limits section every 10 minutes
- Tracks session tokens, monthly usage, cost estimates

**Trigger:** Cron job every 10 minutes  
**Frequency:** 10 min intervals

---

### GitHub → Cloudflare Deploy
**Status:** ✅ Active  
**Location:** GitHub Actions (`.github/workflows/deploy.yml`)  
**Integration:** Nexus Dashboard hosting

**What It Does:**
- Watches `main` branch for changes
- Auto-deploys to Cloudflare Pages on every push
- Zero-downtime deployment

**Trigger:** Push to `main` branch  
**Frequency:** On every commit

---

### Auto-Update Tokens
**Status:** ✅ Ready  
**Location:** `auto-update-tokens.ps1`  
**Integration:** Token Tracker Sync

**What It Does:**
- Fetches current OpenClaw session data
- Updates dashboard with live token usage
- Can be run manually or via cron

**Trigger:** Cron job or manual execution  
**Frequency:** 10 min (when active)

---

### Health Monitor
**Status:** ✅ Active  
**Location:** `healthcheck` cron skill  
**Integration:** Connected Services section

**What It Does:**
- Weekly security audits (Sundays 9 AM)
- System status checks
- Self-monitoring for Baymax/OpenClaw health

**Trigger:** Cron weekly + on-demand via Nexus  
**Frequency:** Weekly (Sundays)

---

## Phase 2 Processes (Planned)

### Smart Cascade Sync
**Status:** 📋 Planned  
**Integration:** All Nexus sections

**What It Will Do:**
- Monitor user engagement (open, refresh, switch back)
- Check staleness of each section
- Update only stale sections on demand
- Minimize API calls and costs

**Trigger:** User engagement pulse  
**Frequency:** On engagement only (not background)

---

### Projects Sync
**Status:** 📋 Planned  
**Integration:** Projects Kanban

**What It Will Do:**
- Bidirectional sync: Markdown ↔ D1 ↔ Nexus
- Push: Edit `PROJECTS.md` → updates Nexus
- Pull: Edit in Nexus → updates `PROJECTS.md`
- Version history tracking

**Trigger:** "Update" button or auto-sync on engagement  
**Frequency:** On-demand + smart cascade

---

### Tasks/Habits Sync
**Status:** 📋 Planned  
**Integration:** Tasks & Habits section

**What It Will Do:**
- Sync to-dos and recurring habits
- Streak tracking with history
- Completion logging
- Project linking (tasks → projects)

**Trigger:** "Update" button or smart cascade  
**Frequency:** On-demand + smart cascade

---

## Process Categories

| Category | Processes |
|----------|-----------|
| **Sync** | Token Tracker, Smart Cascade, Projects, Tasks/Habits |
| **Deploy** | GitHub → Cloudflare |
| **Integration** | Google Calendar API |
| **Monitoring** | Health Monitor, Auto-Update Tokens |

---

**Sync:** This file ↔ D1 ↔ Nexus Operations Manual  
**Update Method:** Universal "Update" button triggers full sync of all Operations Manual content
