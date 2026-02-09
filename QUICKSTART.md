# Baymax Token Tracker - Quick Start

## ✅ What's Now Automated

Your token tracker is **fully automated** and ready to go:

### 🔄 Auto-Refresh (Dashboard)
- Dashboard checks for updates **every 10 seconds**
- Also refreshes when you switch back to the tab
- Manual refresh button available

### 📊 Token Data Files Created
```
workspace/
├── dashboard.html              ← Your live dashboard
├── auto-update-tokens.ps1      ← Fetches OpenClaw data
├── setup-auto-tracker.ps1      ← Creates scheduled task
├── update-tokens.ps1           ← Manual updates
├── TOKEN-TRACKER-GUIDE.md      ← Full documentation
└── data/
    └── tokens.json             ← Live token storage ✨
```

## 🚀 To Enable Background Auto-Updates

Run this **as Administrator** in PowerShell:

```powershell
cd C:\Users\miket\.openclaw\workspace
.\setup-auto-tracker.ps1
```

This creates a Windows Scheduled Task that:
- Runs every **2 minutes** in the background
- Fetches current session data from OpenClaw
- Updates `data/tokens.json` automatically
- Runs silently (no windows popup)

## 📋 Current Status

Your dashboard now shows:
| Model | Session | Monthly | Limit |
|-------|---------|---------|-------|
| 🎯 Kimi | 23,400 | 456,000 | 1,000,000 |
| ⚡ Flash | 0 | 125,000 | 500,000 |
| 🧩 Pro | 0 | 45,000 | 200,000 |

**Est. Cost**: ~$1.78 USD this month

## 🎯 Manual Commands (if needed)

```powershell
# Check status anytime
.\auto-update-tokens.ps1 -Status

# Manual update with specific values
.\update-tokens.ps1 -Model kimi-k2.5 -Tokens 25000

# Reset for new month
.\update-tokens.ps1 -ResetMonthly
```

## 🔧 Dashboard URL

Open this in your browser:
```
file:///C:/Users/miket/.openclaw/workspace/dashboard.html
```

The dashboard is already open and refreshing every 10 seconds!

---

**Next step**: Run `setup-auto-tracker.ps1` as Admin to enable background updates.
