# 🤖 Baymax Token Tracker - Setup Guide

## Overview
Your dashboard now tracks LLM token usage across all 3 models (Kimi, Flash, Pro) with **near real-time updates**.

## How It Works

### Data Flow
```
OpenClaw Session → update-tokens.ps1 → data/tokens.json → Dashboard (auto-refresh)
```

1. **Session Data** → PowerShell script reads your current session
2. **Update Script** → Calculates and saves token usage
3. **JSON File** → Stores cumulative data by model
4. **Dashboard** → Auto-refreshes every 10 seconds to show latest data

## Quick Start

### Option 1: Manual Update (After Each Session)
```powershell
cd C:\Users\miket\.openclaw\workspace
.\update-tokens.ps1 -Model kimi-k2.5 -Tokens 23400
```

### Option 2: View Current Status
```powershell
.\update-tokens.ps1 -Status
```

### Option 3: Auto-Update Hook (Recommended)
Add this to your PowerShell profile to run after every OpenClaw command:

```powershell
# Add to your PowerShell profile ($PROFILE)
function Update-BaymaxTokens {
    $sessionData = openclaw sessions-list --limit 1 --json 2>$null | ConvertFrom-Json
    if ($sessionData) {
        $tokens = $sessionData.totalTokens
        $model = $sessionData.model
        & "C:\Users\miket\.openclaw\workspace\update-tokens.ps1" -Model $model -Tokens $tokens
    }
}
```

## Dashboard Features

### Real-Time Updates
- ✅ Auto-refreshes every 10 seconds
- ✅ Updates immediately when tab becomes active
- ✅ Manual refresh button available

### Visual Indicators
- 🟢 **Green** (< 70% monthly limit)
- 🟡 **Yellow** (70-90% monthly limit)  
- 🔴 **Red** (> 90% monthly limit)

### Data Persistence
- Monthly totals persist across browser sessions
- Session history tracked (last 100 entries)
- Costs calculated automatically

## File Structure
```
workspace/
├── dashboard.html          ← Your main dashboard
├── update-tokens.ps1       ← PowerShell update script
├── update-tokens.js        ← Node.js alternative
└── data/
    └── tokens.json         ← Live token data storage
```

## Troubleshooting

### "Auto-sync disabled" message
The dashboard opened via `file://` protocol. Browser security blocks fetch() for local files.
**Solution**: Use the PowerShell script to update, then click the Refresh button.

### Dashboard not updating
1. Check that `data/tokens.json` exists
2. Run `.\update-tokens.ps1 -Status` to verify data
3. Click the 🔄 Refresh button on dashboard

### Resetting counters
```powershell
# Reset current session only
.\update-tokens.ps1 -ResetSession

# Reset everything (new month)
.\update-tokens.ps1 -ResetMonthly
```

## Cost Estimates

| Model | Cost per 1M tokens |
|-------|-------------------|
| Kimi (K2.5) | ~$3.00 |
| Gemini Flash | ~$0.50 |
| Gemini Pro | ~$5.00 |

*Note: Actual costs may vary based on provider pricing*

## Next Steps

To make this fully hands-off, you could:
1. Set up a Windows Task Scheduler job to run the update script every 5 minutes
2. Create an OpenClaw hook that triggers the update after each session
3. Host the dashboard on a local web server (enables true auto-sync)

---
Dashboard URL: `file:///C:/Users/miket/.openclaw/workspace/dashboard.html`
