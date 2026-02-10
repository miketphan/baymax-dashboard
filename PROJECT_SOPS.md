# Project Standard Operating Procedures (SOPs)

**Purpose:** Detailed reference documentation for complex projects. Complements the Kanban board (which shows current status) with comprehensive technical documentation, troubleshooting guides, and maintenance procedures.

---

## Active Project SOPs

### Nexus Phase 2

**Status:** In Progress (as of 2026-02-09)

#### Overview
Building an interactive, database-driven Nexus dashboard with Smart Cascade updates, Kanban project management, "Trigger Baymax" integration, and proactive monitoring.

#### Architecture
- **Frontend:** Cloudflare Pages (static hosting)
- **Backend:** Cloudflare Workers (API endpoints)
- **Database:** D1 (SQLite-compatible)
- **Cache:** KV (fast reads)
- **Storage:** R2 (files)

#### Core Features
1. **Connected Services** — 5 monitored systems (Calendar, Backups, Health Monitor, Updates, Security)
2. **Usage & Limits** — LLM tokens + API quotas
3. **Operations Manual** — 4-section knowledge base
4. **Projects Kanban** — Interactive board with bidirectional sync
5. **Monitoring & Alerting** — Proactive health checks with auto-healing

#### Troubleshooting

**Issue:** Deployment failing  
**Solution:** Check GitHub repository secrets (CLOUDFLARE_API_TOKEN, CLOUDFLARE_ACCOUNT_ID)

**Issue:** Token sync not updating  
**Solution:** Verify cron job enabled; check google-calendar-token.json exists

**Issue:** Calendar API auth expired  
**Solution:** Run calendar-auth.ps1 to re-authorize

#### Maintenance Procedures
- Weekly: Review security audit results
- Monthly: Dependency updates
- Quarterly: Performance review

---

## Backlog (Future SOPs)

### Trading Performance Tracker
- P&L logging
- Win rate analytics
- Setup performance tracking

### Tasks/Habits System
- Daily task checklist
- Habit streak tracking
- Calendar heatmap visualization

---

*Last Updated: 2026-02-09*
