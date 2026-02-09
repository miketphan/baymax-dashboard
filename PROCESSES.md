# Processes

Active workflows and systems that perform operations.

---

## Google Calendar Integration
**Status:** ✅ Active

**Function:** Automatically add, read, and update calendar events via API
**Trigger:** User request ("add event")
**Stored:** `GOOGLE_CALENDAR_SETUP.md`

**Files:**
- `google-credentials.json` - OAuth credentials
- `google-calendar-token.json` - Access token (auto-refreshes)

---

## Token Tracker Sync
**Status:** ✅ Active

**Function:** Sync OpenClaw session token usage to Nexus dashboard
**Frequency:** Every 10 minutes (cron job)
**Model:** Gemini Flash (cost efficient)

**Trigger:** Automatic background sync
**Output:** Updates `data/tokens.json` → git push → deploy

---

## Nexus Auto-Deploy
**Status:** ✅ Active

**Function:** Deploy Nexus updates to Cloudflare Pages
**Trigger:** Git push to `main` branch
**Method:** GitHub Actions → Cloudflare Pages

**Files:** `.github/workflows/deploy.yml`

---

## Git Sync (Manual)
**Status:** Available

**Function:** Commit and push workspace changes to GitHub
**Trigger:** On demand (when I edit files)

---

## Calendar Event Creation
**Status:** ✅ Active

**Function:** Create events using Google Calendar API
**Trigger:** User request
**Method:** PowerShell → REST API

**See:** `GOOGLE_CALENDAR_SETUP.md` for detailed command

---

*Last Updated: 2026-02-09*
