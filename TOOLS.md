# TOOLS.md - Local Notes

Skills define _how_ tools work. This file is for _your_ specifics — the stuff that's unique to your setup.

## What Goes Here

Things like:

- Camera names and locations
- SSH hosts and aliases
- Preferred voices for TTS
- Speaker/room names
- Device nicknames
- Anything environment-specific

## Examples

```markdown
### Cameras

- living-room → Main area, 180° wide angle
- front-door → Entrance, motion-triggered

### SSH

- home-server → 192.168.1.100, user: admin

### TTS

- Preferred voice: "Nova" (warm, slightly British)
- Default speaker: Kitchen HomePod
```

## Why Separate?

Skills are shared. Your setup is yours. Keeping them apart means you can update skills without losing your notes, and share skills without leaking your infrastructure.

---

## Token Usage Tracking

**Location:** `data/token-usage.json`

**Process:** Every session (main or sub-agent) logs usage before ending:
1. Call `session_status` to get final token count
2. Append entry to `data/token-usage.json`
3. Update model totals and daily aggregates

**Nexus Integration:** Usage dashboard section reads from this file via API endpoint (to be added to Nexus API).

**Cost Estimates (rough):**
- Kimi K2.5: ~$0.50-1.00 / 1M tokens
- Gemini Flash: ~$0.075 / 1M tokens  
- Gemini Pro: ~$1.25-2.50 / 1M tokens

---

Add whatever helps you do your job. This is your cheat sheet.
