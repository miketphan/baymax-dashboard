# Auto-fetch token data from OpenClaw sessions and update tracker
# This script fetches current session info and updates the token tracker

param(
    [switch]$Silent,
    [switch]$Status
)

$DataFile = "$PSScriptRoot\data\tokens.json"
$ErrorActionPreference = "Stop"

# Load token data
function Load-TokenData {
    if (Test-Path $DataFile) {
        return Get-Content $DataFile | ConvertFrom-Json
    }
    return Create-DefaultData
}

# Save token data
function Save-TokenData($data) {
    $data.lastUpdated = (Get-Date -Format "yyyy-MM-ddTHH:mm:sszzz")
    $data | ConvertTo-Json -Depth 10 | Set-Content $DataFile
}

# Create default data structure
function Create-DefaultData {
    return @{
        lastUpdated = (Get-Date -Format "yyyy-MM-ddTHH:mm:sszzz")
        models = @{
            kimi = @{
                name = "Kimi (K2.5)"
                sessionTokens = 0
                monthlyTokens = 0
                monthlyLimit = 1000000
                costPer1M = 3.00
            }
            flash = @{
                name = "Gemini Flash"
                sessionTokens = 0
                monthlyTokens = 0
                monthlyLimit = 500000
                costPer1M = 0.50
            }
            pro = @{
                name = "Gemini Pro"
                sessionTokens = 0
                monthlyTokens = 0
                monthlyLimit = 200000
                costPer1M = 5.00
            }
        }
        sessionHistory = @()
    }
}

# Map model names
function Get-ModelKey($model) {
    switch -Wildcard ($model) {
        "*kimi*" { return "kimi" }
        "*flash*" { return "flash" }
        "*pro*" { return "pro" }
        default { return "kimi" }
    }
}

# Fetch session data from OpenClaw
function Get-OpenClawSession {
    try {
        # Try to get active session info via openclaw CLI
        $output = & openclaw status 2>&1
        
        if ($LASTEXITCODE -ne 0 -or $output -match "error" -or $output -match "not found") {
            return $null
        }
        
        # Parse the status output
        $model = $null
        $tokens = 0
        
        foreach ($line in $output) {
            # Look for model line
            if ($line -match "Model:\s*(.+?)\s*·") {
                $model = $matches[1].Trim()
            }
            # Look for tokens line
            if ($line -match "Tokens:\s*(\d+)\w*\s*(?:in|/)") {
                $tokens = [int]$matches[1]
            }
            # Alternative: 23k format
            if ($line -match "Tokens:\s*(\d+)k") {
                $tokens = [int]$matches[1] * 1000
            }
        }
        
        if ($model -and $tokens -gt 0) {
            return @{
                model = $model
                tokens = $tokens
            }
        }
        
        return $null
    } catch {
        return $null
    }
}

# Update tokens from session
function Update-TokensFromSession($sessionData) {
    $data = Load-TokenData
    $modelKey = Get-ModelKey $sessionData.model
    
    $currentSession = $sessionData.tokens
    $previousSession = $data.models.$modelKey.sessionTokens
    
    # Update session tokens
    $data.models.$modelKey.sessionTokens = $currentSession
    
    # Add difference to monthly total (if increased)
    $diff = $currentSession - $previousSession
    if ($diff -gt 0) {
        $data.models.$modelKey.monthlyTokens += $diff
    }
    
    # Add to history
    $data.sessionHistory += @{
        timestamp = (Get-Date -Format "yyyy-MM-ddTHH:mm:sszzz")
        model = $modelKey
        tokens = $currentSession
    }
    
    # Keep only last 100 entries
    if ($data.sessionHistory.Length -gt 100) {
        $data.sessionHistory = $data.sessionHistory | Select-Object -Last 100
    }
    
    Save-TokenData $data
    
    if (-not $Silent) {
        Write-Host "✅ Updated $($data.models.$modelKey.name): $currentSession tokens (+$diff)" -ForegroundColor Green
    }
    
    return $data
}

# Show current status
function Show-Status($data) {
    if (-not $data) {
        $data = Load-TokenData
    }
    
    Write-Host "`n📊 Baymax Token Tracker" -ForegroundColor Cyan
    Write-Host "=======================" -ForegroundColor Cyan
    
    $kimi = $data.models.kimi
    $flash = $data.models.flash
    $pro = $data.models.pro
    
    $totalMonthly = $kimi.monthlyTokens + $flash.monthlyTokens + $pro.monthlyTokens
    $totalCost = ($kimi.monthlyTokens / 1000000 * $kimi.costPer1M) + 
                 ($flash.monthlyTokens / 1000000 * $flash.costPer1M) + 
                 ($pro.monthlyTokens / 1000000 * $pro.costPer1M)
    
    Write-Host "`n🎯 Kimi (K2.5):      $($kimi.sessionTokens.ToString('N0').PadLeft(8)) session  /  $($kimi.monthlyTokens.ToString('N0').PadLeft(9)) monthly"
    Write-Host "⚡ Gemini Flash:     $($flash.sessionTokens.ToString('N0').PadLeft(8)) session  /  $($flash.monthlyTokens.ToString('N0').PadLeft(9)) monthly"  
    Write-Host "🧩 Gemini Pro:       $($pro.sessionTokens.ToString('N0').PadLeft(8)) session  /  $($pro.monthlyTokens.ToString('N0').PadLeft(9)) monthly"
    
    Write-Host "`n💰 Total:            $($totalMonthly.ToString('N0').PadLeft(8)) tokens   /  `$($totalCost.ToString('F2')) USD" -ForegroundColor Green
    Write-Host "🕐 Last Updated:     $($data.lastUpdated)" -ForegroundColor Gray
}

# Main logic
try {
    if ($Status) {
        Show-Status
        exit 0
    }
    
    # Fetch current session from OpenClaw
    $sessionData = Get-OpenClawSession
    
    if ($sessionData) {
        $data = Update-TokensFromSession $sessionData
        if (-not $Silent) {
            Show-Status $data
            
            # Offer to open sync page
            Write-Host "`n🌐 Open token-sync.html to sync with deployed dashboard? (Y/n): " -ForegroundColor Cyan -NoNewline
            $response = Read-Host
            if ($response -ne 'n' -and $response -ne 'N') {
                $syncPage = "$PSScriptRoot\token-sync.html"
                if (Test-Path $syncPage) {
                    Start-Process $syncPage
                    Write-Host "✅ Sync page opened in browser" -ForegroundColor Green
                } else {
                    Write-Host "⚠️  token-sync.html not found" -ForegroundColor Yellow
                }
            }
        }
    } else {
        if (-not $Silent) {
            Write-Host "⚠️  No active OpenClaw session found" -ForegroundColor Yellow
            Write-Host "   Run 'openclaw status' to verify connection" -ForegroundColor Gray
        }
    }
} catch {
    if (-not $Silent) {
        Write-Host "❌ Error: $_" -ForegroundColor Red
    }
    exit 1
}
