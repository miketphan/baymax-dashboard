# [BACKLOG] Enable Multi-Model Delegation for Baymax

**Status:** BACKLOG  
**Priority:** HIGH  
**Created:** 2026-02-11

---

## Problem

Baymax cannot spawn Flash or Pro subagents for cost-effective task routing. All tasks currently run on Kimi (expensive), defeating our cost optimization strategy.

## Attempted Solutions

### 1. Added Agent Configurations

Updated `openclaw.json` with explicit agent entries:
- **main** → moonshot/kimi-k2.5 (default)
- **flash** → google/gemini-2.0-flash  
- **pro** → google/gemini-2.5-pro

### 2. Gateway Restarts

Restarted gateway multiple times to apply config changes:
- SIGUSR1 restarts (2026-02-11 06:28)
- Full config reload

### 3. Doctor Diagnostics

Ran diagnostics:
```bash
openclaw doctor --non-interactive
openclaw doctor --fix
```

**Doctor output confirms agents are recognized:**
```
Agents: main (default), flash, pro
```

### 4. Test Spawning

Attempted to spawn flash subagent via `sessions_spawn` API.

**Result:** FAILED
```json
{
  "status": "forbidden",
  "error": "agentId is not allowed for sessions_spawn (allowed: none)"
}
```

---

## Root Cause

The system enforces a hard policy restriction:
- `agents_list` returns: `"allowAny": false`
- `sessions_spawn` returns: `"allowed: none"`

This policy override exists at a system level below user-configurable settings in `openclaw.json`.

---

## Potential Solutions

### Option A: Policy Configuration (RECOMMENDED)

Investigate if there's a policy/permissions config file or setting that controls subagent spawning permissions. May require:
- [ ] Checking OpenClaw documentation for policy settings
- [ ] Looking for a permissions/policy config file (possibly `.openclaw/policy.json` or similar)
- [ ] Setting `allowAny: true` or explicit `allowAgents` list
- [ ] Checking environment variables that control agent permissions

### Option B: OpenClaw Update

Current version: `2026.2.6-3`

Check if newer versions have different subagent policy handling:
- [ ] Run `openclaw update check`
- [ ] Review changelog for agent-related changes
- [ ] Consider upgrading if delegation is fixed in newer versions

### Option C: Alternative Architecture

If spawning remains blocked, implement task routing manually:
- [ ] Create separate sessions with different model overrides using `session_status`
- [ ] Switch models mid-task for different phases
- [ ] Document model selection criteria in MEMORY.md
- [ ] Update user expectations about delegation

---

## Impact Assessment

| Metric | Current State | With Delegation |
|--------|--------------|-----------------|
| **Cost per complex task** | ~$0.50-1.00 (Kimi) | ~$0.05-0.10 (Flash) |
| **Cost per simple task** | ~$0.10-0.20 (Kimi) | ~$0.01-0.05 (Flash) |
| **Latency (simple tasks)** | Slower | Faster |
| **User Trust** | Eroding (false promises) | Restored |

**Estimated Monthly Savings (if delegation works):** $50-200 depending on usage

---

## User Context

> *"I really wish you would be proactive about this. You know that I've asked for this multiple times, and when I explicitly added it to my prompt and you ran into issues, you didn't offer to find out why for me."* — Mike Phan, 2026-02-11

This frustration stems from:
1. Repeated promises to delegate to Flash/Pro
2. Acknowledging the strategy in MEMORY.md
3. Never actually following through due to system restrictions
4. Not proactively investigating the blocker until explicitly pushed

---

## Next Steps

1. **Research Phase**
   - [ ] Search OpenClaw docs for "subagent", "sessions_spawn", "agent policy"
   - [ ] Check if there's a `~/.openclaw/policy.json` or similar
   - [ ] Look for environment variables (`OPENCLAW_ALLOW_AGENTS`, etc.)

2. **Configuration Phase**
   - [ ] Try setting `allowAny: true` in agents config
   - [ ] Check for separate policy config file
   - [ ] Consult OpenClaw Discord/ community

3. **Fallback Phase** (if delegation remains blocked)
   - [ ] Update MEMORY.md to reflect single-agent reality
   - [ ] Remove delegation promises from system prompts
   - [ ] Focus on Kimi-only optimizations

---

## Related Files

- `~/.openclaw/openclaw.json` — Current agent config (agents listed but spawning blocked)
- `MEMORY.md` — Contains Model Usage Strategy section referencing delegation
- `AGENTS.md` — May contain relevant configuration notes

---

## Technical Details

**Current Config (post-fix attempts):**
```json
{
  "agents": {
    "list": [
      {"id": "main", "default": true, "model": {"primary": "moonshot/kimi-k2.5"}},
      {"id": "flash", "model": {"primary": "google/gemini-2.0-flash"}},
      {"id": "pro", "model": {"primary": "google/gemini-2.5-pro"}}
    ]
  }
}
```

**Blocking Error:**
```
agentId is not allowed for sessions_spawn (allowed: none)
```

**Tools Affected:**
- `sessions_spawn` — Cannot create subagent sessions
- `agents_list` — Only returns `main` despite config having 3 agents

---

*Last Updated: 2026-02-11 by Baymax*
