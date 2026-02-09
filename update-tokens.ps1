# Baymax Token Tracker - Auto-Update Script
# Run this after each OpenClaw session to update token counts

param(
    [string]$Model = "",
    [int]$Tokens = 0,
    [switch]$Status,
    [switch]$ResetSession,
    [switch]$ResetMonthly
)

$DataFile = "$PSScriptRoot\data\tokens.json"

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
    Write-Host "✅ Token data saved" -ForegroundColor Green
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

# Show current status
function Show-Status {
    $data = Load-TokenData
    
    Write-Host "`n📊 Baymax Token Tracker Status" -ForegroundColor Cyan
    Write-Host "==============================`n" -ForegroundColor Cyan
    
    $kimi = $data.models.kimi
    $flash = $data.models.flash
    $pro = $data.models.pro
    
    Write-Host "🎯 Kimi (K2.5):" -ForegroundColor Yellow
    Write-Host "   Session:  $($kimi.sessionTokens.ToString('N0')) tokens"
    Write-Host "   Monthly:  $($kimi.monthlyTokens.ToString('N0')) / $($kimi.monthlyLimit.ToString('N0')) tokens"
    Write-Host "   Progress: $([math]::Round($kimi.monthlyTokens / $kimi.monthlyLimit * 100, 1))%" -NoNewline
    Show-ProgressBar $kimi.monthlyTokens $kimi.monthlyLimit
    
    Write-Host "`n⚡ Gemini Flash:" -ForegroundColor Yellow
    Write-Host "   Session:  $($flash.sessionTokens.ToString('N0')) tokens"
    Write-Host "   Monthly:  $($flash.monthlyTokens.ToString('N0')) / $($flash.monthlyLimit.ToString('N0')) tokens"
    Write-Host "   Progress: $([math]::Round($flash.monthlyTokens / $flash.monthlyLimit * 100, 1))%" -NoNewline
    Show-ProgressBar $flash.monthlyTokens $flash.monthlyLimit
    
    Write-Host "`n🧩 Gemini Pro:" -ForegroundColor Yellow
    Write-Host "   Session:  $($pro.sessionTokens.ToString('N0')) tokens"
    Write-Host "   Monthly:  $($pro.monthlyTokens.ToString('N0')) / $($pro.monthlyLimit.ToString('N0')) tokens"
    Write-Host "   Progress: $([math]::Round($pro.monthlyTokens / $pro.monthlyLimit * 100, 1))%" -NoNewline
    Show-ProgressBar $pro.monthlyTokens $pro.monthlyLimit
    
    $totalMonthly = $kimi.monthlyTokens + $flash.monthlyTokens + $pro.monthlyTokens
    $totalCost = ($kimi.monthlyTokens / 1000000 * $kimi.costPer1M) + 
                 ($flash.monthlyTokens / 1000000 * $flash.costPer1M) + 
                 ($pro.monthlyTokens / 1000000 * $pro.costPer1M)
    
    Write-Host "`n💰 Summary:" -ForegroundColor Green
    Write-Host "   Total Monthly: $($totalMonthly.ToString('N0')) tokens"
    Write-Host "   Est. Cost:     `$($totalCost.ToString('F2')) USD"
    Write-Host "   Last Updated:  $($data.lastUpdated)"
}

# Show ASCII progress bar
function Show-ProgressBar($current, $max) {
    $width = 20
    $filled = [math]::Floor($current / $max * $width)
    $bar = "█" * $filled + "░" * ($width - $filled)
    
    if ($current / $max -gt 0.9) {
        Write-Host " [$bar]" -ForegroundColor Red
    } elseif ($current / $max -gt 0.7) {
        Write-Host " [$bar]" -ForegroundColor Yellow
    } else {
        Write-Host " [$bar]" -ForegroundColor Green
    }
}

# Update tokens from session
function Update-Tokens($model, $sessionTokens) {
    $data = Load-TokenData
    $modelKey = Get-ModelKey $model
    
    # Update session tokens
    $data.models.$modelKey.sessionTokens = $sessionTokens
    
    # Add to monthly total (only if increased)
    $prevSession = if ($data.sessionHistory.Length -gt 0) { 
        ($data.sessionHistory | Select-Object -Last 1).tokens 
    } else { 
        0 
    }
    
    $diff = $sessionTokens - $prevSession
    if ($diff -gt 0) {
        $data.models.$modelKey.monthlyTokens += $diff
    }
    
    # Add to history
    $data.sessionHistory += @{
        timestamp = (Get-Date -Format "yyyy-MM-ddTHH:mm:sszzz")
        model = $modelKey
        tokens = $sessionTokens
    }
    
    # Keep only last 100 entries
    if ($data.sessionHistory.Length -gt 100) {
        $data.sessionHistory = $data.sessionHistory | Select-Object -Last 100
    }
    
    Save-TokenData $data
    
    Write-Host "`n✅ Updated $($data.models.$modelKey.name)" -ForegroundColor Green
    Write-Host "   Session: $sessionTokens tokens" -ForegroundColor White
    Write-Host "   Monthly: $($data.models.$modelKey.monthlyTokens) tokens" -ForegroundColor White
}

# Reset functions
function Reset-SessionTokens {
    $data = Load-TokenData
    $data.models.kimi.sessionTokens = 0
    $data.models.flash.sessionTokens = 0
    $data.models.pro.sessionTokens = 0
    Save-TokenData $data
    Write-Host "✅ Session tokens reset to 0" -ForegroundColor Green
}

function Reset-MonthlyTokens {
    $data = Load-TokenData
    $data.models.kimi.monthlyTokens = 0
    $data.models.flash.monthlyTokens = 0
    $data.models.pro.monthlyTokens = 0
    $data.models.kimi.sessionTokens = 0
    $data.models.flash.sessionTokens = 0
    $data.models.pro.sessionTokens = 0
    $data.sessionHistory = @()
    Save-TokenData $data
    Write-Host "✅ All tokens reset for new month" -ForegroundColor Green
}

# Main logic
if ($ResetMonthly) {
    Reset-MonthlyTokens
    Show-Status
}
elseif ($ResetSession) {
    Reset-SessionTokens
    Show-Status
}
elseif ($Status) {
    Show-Status
}
elseif ($Model -and $Tokens -gt 0) {
    Update-Tokens $Model $Tokens
    Show-Status
}
else {
    Show-Status
    Write-Host "`n📖 Usage:" -ForegroundColor Cyan
    Write-Host "   .\update-tokens.ps1 -Model kimi-k2.5 -Tokens 25000"
    Write-Host "   .\update-tokens.ps1 -Status"
    Write-Host "   .\update-tokens.ps1 -ResetSession"
    Write-Host "   .\update-tokens.ps1 -ResetMonthly"
}
