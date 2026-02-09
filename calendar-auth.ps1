# Google Calendar Setup and Event Creation
# Quick setup for Baymax to manage your calendar

param(
    [string]$AuthCode = ""
)

$CredentialsFile = "$PSScriptRoot\google-credentials.json"
$TokenFile = "$PSScriptRoot\google-calendar-token.json"

Write-Host "`n📅 Google Calendar API Setup for Baymax" -ForegroundColor Cyan
Write-Host "=========================================`n" -ForegroundColor Cyan

# Step 1: Check if we have credentials
if (-not (Test-Path $CredentialsFile)) {
    Write-Host "⚠️  Credentials file not found." -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Please get your credentials.json from Google Cloud Console:" -ForegroundColor White
    Write-Host "1. Go to https://console.cloud.google.com/" -ForegroundColor Gray
    Write-Host "2. Select project: baymax-calendar-486805" -ForegroundColor Gray
    Write-Host "3. APIs & Services → Credentials" -ForegroundColor Gray
    Write-Host "4. Click 'Download JSON' for your OAuth 2.0 Client ID" -ForegroundColor Gray
    Write-Host "5. Save as 'google-credentials.json' in this folder" -ForegroundColor Gray
    Write-Host ""
    Write-Host "Then run this script again." -ForegroundColor Yellow
    exit
}

# Load credentials
$creds = Get-Content $CredentialsFile | ConvertFrom-Json
$clientId = $creds.web.client_id
$clientSecret = $creds.web.client_secret
$redirectUri = $creds.web.redirect_uris[0]

# Step 2: Check if we have a valid token
if ((Test-Path $TokenFile) -and -not $AuthCode) {
    Write-Host "✅ Found existing token. Creating event..." -ForegroundColor Green
    
    $tokenData = Get-Content $TokenFile | ConvertTo-Json
    
    # Use the existing script to create event
    $headers = @{
        "Authorization" = "Bearer $($tokenData.access_token)"
        "Content-Type" = "application/json"
    }
    
    $event = @{
        summary = "Chris & Cindy Visit (Tentative)"
        description = "Friend Chris and wife Cindy visiting from out of town. Block time to hang out - dates are tentative."
        start = @{ date = "2026-03-05"; timeZone = "America/New_York" }
        end = @{ date = "2026-03-10"; timeZone = "America/New_York" }
        reminders = @{ useDefault = $false; overrides = @(
            @{ method = "email"; minutes = 10080 }
            @{ method = "popup"; minutes = 2880 }
        )}
    } | ConvertTo-Json -Depth 10
    
    try {
        $response = Invoke-RestMethod -Uri "https://www.googleapis.com/calendar/v3/calendars/primary/events" -Method POST -Headers $headers -Body $event
        Write-Host "✅ Event created successfully!" -ForegroundColor Green
        Write-Host "Link: $($response.htmlLink)" -ForegroundColor Cyan
    } catch {
        Write-Host "❌ Token expired. Getting new authorization..." -ForegroundColor Red
        Remove-Item $TokenFile -ErrorAction SilentlyContinue
    }
    exit
}

# Step 3: Get authorization code if needed
if (-not $AuthCode) {
    Write-Host "🌐 Opening authorization link..." -ForegroundColor Cyan
    Write-Host ""
    
    $authUrl = "https://accounts.google.com/o/oauth2/auth?client_id=$clientId&redirect_uri=$redirectUri&scope=https://www.googleapis.com/auth/calendar&response_type=code&access_type=offline&prompt=consent"
    
    Start-Process $authUrl
    
    Write-Host "1. Sign in with your Google account" -ForegroundColor White
    Write-Host "2. Click 'Allow' to authorize Baymax" -ForegroundColor White
    Write-Host "3. You'll see a 'localhost' page (this is expected)" -ForegroundColor White
    Write-Host "4. Copy the FULL URL from your browser" -ForegroundColor Yellow
    Write-Host "5. Run this script with the code:" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "   .\calendar-auth.ps1 -AuthCode '4/XXXX...'" -ForegroundColor Gray
    Write-Host ""
    Write-Host "The code is after '?code=' in the URL" -ForegroundColor Gray
    exit
}

# Step 4: Exchange code for tokens
Write-Host "`n🔄 Exchanging code for access token..." -ForegroundColor Cyan

$body = @{
    code = $AuthCode
    client_id = $clientId
    client_secret = $clientSecret
    redirect_uri = $redirectUri
    grant_type = "authorization_code"
}

try {
    $response = Invoke-RestMethod -Uri "https://oauth2.googleapis.com/token" -Method POST -Body $body
    
    $tokenData = @{
        refresh_token = $response.refresh_token
        access_token = $response.access_token
        expires_at = (Get-Date).AddSeconds($response.expires_in).ToString("o")
    }
    
    $tokenData | ConvertTo-Json | Set-Content $TokenFile
    Write-Host "✅ Authorization complete!" -ForegroundColor Green
    Write-Host ""
    
    # Create the event
    Write-Host "📅 Creating calendar event..." -ForegroundColor Cyan
    
    $headers = @{
        "Authorization" = "Bearer $($response.access_token)"
        "Content-Type" = "application/json"
    }
    
    $event = @{
        summary = "Chris & Cindy Visit (Tentative)"
        description = "Friend Chris and wife Cindy visiting from out of town. Block time to hang out - dates are tentative."
        start = @{ date = "2026-03-05"; timeZone = "America/New_York" }
        end = @{ date = "2026-03-10"; timeZone = "America/New_York" }
        reminders = @{ useDefault = $false; overrides = @(
            @{ method = "email"; minutes = 10080 }
            @{ method = "popup"; minutes = 2880 }
        )}
    } | ConvertTo-Json -Depth 10
    
    $eventResponse = Invoke-RestMethod -Uri "https://www.googleapis.com/calendar/v3/calendars/primary/events" -Method POST -Headers $headers -Body $event
    Write-Host "✅ Event created successfully!" -ForegroundColor Green
    Write-Host "Event: $($eventResponse.summary)" -ForegroundColor White
    Write-Host "Dates: March 5-9, 2026" -ForegroundColor White
    Write-Host "Link: $($eventResponse.htmlLink)" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "🔧 Future events: Run this script again (it will use saved token)" -ForegroundColor Gray
    
} catch {
    Write-Host "❌ Error: $_" -ForegroundColor Red
    Write-Host ""
    Write-Host "If this failed, try:" -ForegroundColor Yellow
    Write-Host "1. Go to https://console.cloud.google.com/" -ForegroundColor Gray
    Write-Host "2. APIs & Services → OAuth consent screen" -ForegroundColor Gray
    Write-Host "3. Make sure you're added as a Test User" -ForegroundColor Gray
}
