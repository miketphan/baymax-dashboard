# Create scheduled task for automatic token tracking
# Run this in PowerShell as Administrator
# This sets up background auto-updates every 2 minutes

$TaskName = "BaymaxTokenTracker"
$ScriptPath = "C:\Users\miket\.openclaw\workspace\auto-update-tokens.ps1"
$WorkingDir = "C:\Users\miket\.openclaw\workspace"

Write-Host "`n🤖 Baymax Token Tracker - Auto-Setup`n" -ForegroundColor Cyan

# Check if running as admin
$currentPrincipal = New-Object Security.Principal.WindowsPrincipal([Security.Principal.WindowsIdentity]::GetCurrent())
if (-not $currentPrincipal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)) {
    Write-Host "⚠️  This script needs to run as Administrator!`n" -ForegroundColor Yellow
    Write-Host "   Right-click PowerShell → 'Run as Administrator'" -ForegroundColor White
    Write-Host "   Then run: .\setup-auto-tracker.ps1`n" -ForegroundColor Gray
    exit 1
}

# Verify the script exists
if (-not (Test-Path $ScriptPath)) {
    Write-Host "❌ Script not found: $ScriptPath" -ForegroundColor Red
    exit 1
}

# Remove existing task if present
$existing = Get-ScheduledTask -TaskName $TaskName -ErrorAction SilentlyContinue
if ($existing) {
    Write-Host "Removing existing task..." -ForegroundColor Yellow
    Unregister-ScheduledTask -TaskName $TaskName -Confirm:$false
}

# Create the action - run silently
$Action = New-ScheduledTaskAction `
    -Execute "powershell.exe" `
    -Argument "-WindowStyle Hidden -ExecutionPolicy Bypass -File `"$ScriptPath`" -Silent" `
    -WorkingDirectory $WorkingDir

# Create the trigger - run every 2 minutes indefinitely
$Trigger = New-ScheduledTaskTrigger `
    -Once `
    -At (Get-Date) `
    -RepetitionInterval (New-TimeSpan -Minutes 2) `
    -RepetitionDuration ([TimeSpan]::MaxValue)

# Create the principal (run as current user, whether logged in or not)
$Principal = New-ScheduledTaskPrincipal `
    -UserId $env:USERNAME `
    -LogonType S4U `
    -RunLevel Limited

# Create the task settings
$Settings = New-ScheduledTaskSettingsSet `
    -AllowStartIfOnBatteries `
    -DontStopIfGoingOnBatteries `
    -StartWhenAvailable `
    -RunOnlyIfNetworkAvailable:$false `
    -MultipleInstances IgnoreNew

# Register the task
try {
    $Task = Register-ScheduledTask `
        -TaskName $TaskName `
        -Action $Action `
        -Trigger $Trigger `
        -Principal $Principal `
        -Settings $Settings `
        -Force
    
    Write-Host "✅ Task created successfully!`n" -ForegroundColor Green
    Write-Host "   Task Name:    $TaskName" -ForegroundColor White
    Write-Host "   Runs Every:   2 minutes" -ForegroundColor White
    Write-Host "   Script:       auto-update-tokens.ps1" -ForegroundColor Gray
    Write-Host "   Next Run:     $($Task.NextRunTime)`n" -ForegroundColor Gray
    
    Write-Host "📊 What happens now:" -ForegroundColor Cyan
    Write-Host "   • Token data auto-updates every 2 minutes" -ForegroundColor White
    Write-Host "   • Dashboard refreshes automatically (every 10s)" -ForegroundColor White
    Write-Host "   • Check status anytime: .\auto-update-tokens.ps1 -Status" -ForegroundColor White
    
    Write-Host "`n📝 To manage the task:" -ForegroundColor Cyan
    Write-Host "   • Open Task Scheduler → Find 'BaymaxTokenTracker'" -ForegroundColor White
    Write-Host "   • Or run: Get-ScheduledTask -TaskName '$TaskName'" -ForegroundColor Gray
    Write-Host "   • To remove: Unregister-ScheduledTask -TaskName '$TaskName' -Confirm:`$false" -ForegroundColor Gray
    
    Write-Host "`n✨ You're all set! The tracker will run in the background." -ForegroundColor Green
    
    # Start the task immediately
    Start-ScheduledTask -TaskName $TaskName
    Write-Host "🚀 Task started! First update in progress..." -ForegroundColor Green
    
} catch {
    Write-Host "`n❌ Failed to create task: $_" -ForegroundColor Red
    exit 1
}
