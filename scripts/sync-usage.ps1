# PowerShell Script to Sync OpenClaw Token Usage to Cloudflare KV

param(
    [string]$ApiKey = $env:CLOUDFLARE_API_TOKEN,
    [string]$AccountId = $env:CLOUDFLARE_ACCOUNT_ID
)

# --- CONFIGURATION ---
$UsageFilePath = "C:\Users\miket\.openclaw\workspace\data\token-usage.json"
$KvNamespaceId = "7f537d58786c41bd917f95c6de384a10"
$KvKey = "LATEST_USAGE_DATA"

# --- Main Logic ---
try {
    # 1. Get Live Session Data from OpenClaw
    Write-Host "Fetching live session data from OpenClaw..."
    $sessionsJson = openclaw sessions list --json
    $mainSession = $sessionsJson | ConvertFrom-Json | Where-Object { $_.key -eq 'agent:main:main' }

    if (-not $mainSession) {
        Write-Host "Main session 'agent:main:main' not found. Nothing to sync. Exiting."
        exit 0
    }

    $liveSessionId = $mainSession.sessionId
    $liveTotalTokens = [int]$mainSession.totalTokens
    $liveModel = $mainSession.model

    # 2. Read and Parse the Local Data File
    Write-Host "Reading local usage file: $UsageFilePath"
    $usageData = Get-Content -Path $UsageFilePath -Raw | ConvertFrom-Json

    # 3. Update JSON Data in Memory
    $mainSessionLog = $usageData.sessions | Where-Object { $_.label -eq 'main' } | Select-Object -Last 1
    $oldTotalTokens = 0
    if ($mainSessionLog) {
        $oldTotalTokens = [int]$mainSessionLog.tokensIn + [int]$mainSessionLog.tokensOut
    }

    # Check if the session ID is the same or if it has been reset
    if ($mainSessionLog -and $mainSessionLog.id -eq $liveSessionId) {
        # Session is the same. Calculate the change and update the existing entry.
        $tokenDelta = $liveTotalTokens - $oldTotalTokens
        $mainSessionLog.tokensIn = $liveTotalTokens
        $mainSessionLog.tokensOut = 0 # Simplify: Assume out tokens are negligible for this sync
    } else {
        # This is a new session. Add a new entry.
        $tokenDelta = $liveTotalTokens # All tokens for this session are new
        $newSessionEntry = [PSCustomObject]@{
            id        = $liveSessionId
            date      = (Get-Date).ToString("yyyy-MM-dd")
            model     = $liveModel
            label     = "main"
            tokensIn  = $liveTotalTokens
            tokensOut = 0
            purpose   = "Live user session"
        }
        $usageData.sessions += $newSessionEntry
    }

    # Update the aggregate model totals
    $modelStats = $usageData.models.PSObject.Properties[$liveModel]
    if ($modelStats) {
        $modelStats.Value.totalTokensIn = [int]$modelStats.Value.totalTokensIn + $tokenDelta
    } else {
        # First time seeing this model, create a new entry
        $newModelData = @{ totalTokensIn = $liveTotalTokens; totalTokensOut = 0; estimatedCost = 0 } # Cost can be refined later
        $usageData.models | Add-Member -MemberType NoteProperty -Name $liveModel -Value $newModelData
    }
    
    # Update the timestamp
    $usageData.meta.lastUpdated = (Get-Date).ToUniversalTime().ToString("o")
    
    # 4. Write Updated Data Back to Local File
    Write-Host "Writing updated data back to local file..."
    $usageData | ConvertTo-Json -Depth 10 | Set-Content -Path $UsageFilePath

    # 5. Push to Cloudflare KV
    Write-Host "Pushing updated usage data to Cloudflare KV..."
    npx wrangler kv key put --namespace-id=$KvNamespaceId "$KvKey" --path=$UsageFilePath --remote
    
    Write-Host "✅ Token usage sync completed successfully."

} catch {
    Write-Error "An error occurred during token usage sync: $_"
    exit 1
}
