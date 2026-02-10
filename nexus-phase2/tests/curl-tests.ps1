# Nexus Phase 2 - Comprehensive API Test Suite (PowerShell)
# Run with: .\tests\curl-tests.ps1
# Or: $env:API_URL="https://api.example.com"; .\tests\curl-tests.ps1

param(
    [string]$API_URL = $env:API_URL
)

if (-not $API_URL) {
    $API_URL = "http://localhost:8787"
}

# Initialize counters
$script:PASS = 0
$script:FAIL = 0
$CREATED_PROJECT_IDS = @()

# Colors
$GREEN = "Green"
$RED = "Red"
$YELLOW = "Yellow"

function Log-Info($message) {
    Write-Host "[INFO] $message" -ForegroundColor $YELLOW
}

function Log-Pass($message) {
    Write-Host "[PASS] $message" -ForegroundColor $GREEN
    $script:PASS++
}

function Log-Fail($message, $error_msg = "") {
    Write-Host "[FAIL] $message" -ForegroundColor $RED
    if ($error_msg) {
        Write-Host "       Error: $error_msg" -ForegroundColor $RED
    }
    $script:FAIL++
}

function Make-Request($method, $endpoint, $body = $null, $expected_status = 200) {
    $uri = "$API_URL$endpoint"
    $headers = @{ "Content-Type" = "application/json" }
    
    try {
        if ($body) {
            $response = Invoke-WebRequest -Uri $uri -Method $method -Headers $headers -Body $body -ErrorAction SilentlyContinue
        } else {
            $response = Invoke-WebRequest -Uri $uri -Method $method -Headers $headers -ErrorAction SilentlyContinue
        }
        return @{ StatusCode = $response.StatusCode; Content = $response.Content }
    } catch {
        $statusCode = $_.Exception.Response.StatusCode.value__
        return @{ StatusCode = $statusCode; Content = $_.Exception.Message }
    }
}

# ============================================
# Test Suite
# ============================================

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  Nexus Phase 2 - API Test Suite" -ForegroundColor Cyan
Write-Host "  URL: $API_URL" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

# ============================================
# Health Check Tests
# ============================================
Log-Info "Testing Health Endpoints..."

$result = Make-Request "GET" "/health"
if ($result.StatusCode -eq 200) {
    if ($result.Content -match '"status":"healthy"') {
        Log-Pass "GET /health returns healthy status"
    } else {
        Log-Fail "GET /health" "Status not healthy"
    }
} else {
    Log-Fail "GET /health" "Expected 200, got $($result.StatusCode)"
}

# ============================================
# Projects API Tests
# ============================================
Log-Info "Testing Projects API..."

# Test: List projects
$result = Make-Request "GET" "/api/projects"
if ($result.StatusCode -eq 200) {
    if ($result.Content -match '"success":true') {
        Log-Pass "GET /api/projects returns success"
    } else {
        Log-Fail "GET /api/projects" "Success flag not found"
    }
} else {
    Log-Fail "GET /api/projects" "Expected 200, got $($result.StatusCode)"
}

# Test: Create project
$timestamp = [DateTimeOffset]::UtcNow.ToUnixTimeSeconds()
$testTitle = "Test Project $timestamp"
$body = "{`"title`":`"$testTitle`",`"description`":`"Test description`",`"status`":`"backlog`",`"priority`":`"high`"}"
$result = Make-Request "POST" "/api/projects" $body

if ($result.StatusCode -eq 200) {
    $match = [regex]::Match($result.Content, '"id":"([^"]+)"')
    if ($match.Success) {
        $PROJECT_ID = $match.Groups[1].Value
        Log-Pass "POST /api/projects creates project (ID: $PROJECT_ID)"
        $CREATED_PROJECT_IDS += $PROJECT_ID
    } else {
        Log-Fail "POST /api/projects" "No project ID returned"
    }
} else {
    Log-Fail "POST /api/projects" "Expected 200, got $($result.StatusCode)"
}

# Test: Get specific project
if ($PROJECT_ID) {
    $result = Make-Request "GET" "/api/projects/$PROJECT_ID"
    if ($result.StatusCode -eq 200) {
        if ($result.Content -match "`"id`":`"$PROJECT_ID`"") {
            Log-Pass "GET /api/projects/:id returns project"
        } else {
            Log-Fail "GET /api/projects/:id" "Project ID not found"
        }
    } else {
        Log-Fail "GET /api/projects/:id" "Expected 200, got $($result.StatusCode)"
    }
}

# Test: Update project
if ($PROJECT_ID) {
    $body = '{"title":"Updated Title","status":"in_progress"}'
    $result = Make-Request "PUT" "/api/projects/$PROJECT_ID" $body
    if ($result.StatusCode -eq 200) {
        if ($result.Content -match '"title":"Updated Title"' -and $result.Content -match '"status":"in_progress"') {
            Log-Pass "PUT /api/projects/:id updates project"
        } else {
            Log-Fail "PUT /api/projects/:id" "Fields not updated"
        }
    } else {
        Log-Fail "PUT /api/projects/:id" "Expected 200, got $($result.StatusCode)"
    }
}

# Test: Patch project status
if ($PROJECT_ID) {
    $body = '{"status":"done"}'
    $result = Make-Request "PATCH" "/api/projects/$PROJECT_ID/status" $body
    if ($result.StatusCode -eq 200) {
        if ($result.Content -match '"status":"done"') {
            Log-Pass "PATCH /api/projects/:id/status updates status"
        } else {
            Log-Fail "PATCH /api/projects/:id/status" "Status not updated"
        }
    } else {
        Log-Fail "PATCH /api/projects/:id/status" "Expected 200, got $($result.StatusCode)"
    }
}

# Test: Delete project
if ($PROJECT_ID) {
    $result = Make-Request "DELETE" "/api/projects/$PROJECT_ID"
    if ($result.StatusCode -eq 200) {
        if ($result.Content -match '"deleted":true') {
            Log-Pass "DELETE /api/projects/:id removes project"
            $CREATED_PROJECT_IDS = $CREATED_PROJECT_IDS | Where-Object { $_ -ne $PROJECT_ID }
        } else {
            Log-Fail "DELETE /api/projects/:id" "Delete not confirmed"
        }
    } else {
        Log-Fail "DELETE /api/projects/:id" "Expected 200, got $($result.StatusCode)"
    }
}

# Test: Get non-existent project
$result = Make-Request "GET" "/api/projects/nonexistent-id-12345"
if ($result.StatusCode -eq 404) {
    Log-Pass "GET /api/projects/:id returns 404 for unknown ID"
} else {
    Log-Fail "GET /api/projects/:id (404 test)" "Expected 404, got $($result.StatusCode)"
}

# Test: Create project with missing title
$body = '{"description":"No title"}'
$result = Make-Request "POST" "/api/projects" $body
if ($result.StatusCode -eq 422) {
    Log-Pass "POST /api/projects validates required fields"
} else {
    Log-Fail "POST /api/projects validation" "Expected 422, got $($result.StatusCode)"
}

# Test: Invalid status
$body = '{"title":"Test","status":"invalid_status"}'
$result = Make-Request "POST" "/api/projects" $body
if ($result.StatusCode -eq 422) {
    Log-Pass "POST /api/projects validates status values"
} else {
    Log-Fail "POST /api/projects status validation" "Expected 422, got $($result.StatusCode)"
}

# ============================================
# Services API Tests
# ============================================
Log-Info "Testing Services API..."

$result = Make-Request "GET" "/api/services"
if ($result.StatusCode -eq 200) {
    if ($result.Content -match '"services"' -and $result.Content -match '"summary"') {
        Log-Pass "GET /api/services returns services and summary"
    } else {
        Log-Fail "GET /api/services" "Missing services or summary"
    }
} else {
    Log-Fail "GET /api/services" "Expected 200, got $($result.StatusCode)"
}

$result = Make-Request "GET" "/api/services/google_calendar"
if ($result.StatusCode -eq 200) {
    if ($result.Content -match '"id":"google_calendar"') {
        Log-Pass "GET /api/services/:id returns specific service"
    } else {
        Log-Fail "GET /api/services/:id" "Service ID not found"
    }
} else {
    Log-Fail "GET /api/services/:id" "Expected 200, got $($result.StatusCode)"
}

$result = Make-Request "POST" "/api/services/google_calendar/refresh"
if ($result.StatusCode -eq 200) {
    if ($result.Content -match '"refreshed_at"') {
        Log-Pass "POST /api/services/:id/refresh triggers refresh"
    } else {
        Log-Fail "POST /api/services/:id/refresh" "Refresh not confirmed"
    }
} else {
    Log-Fail "POST /api/services/:id/refresh" "Expected 200, got $($result.StatusCode)"
}

# ============================================
# Usage API Tests
# ============================================
Log-Info "Testing Usage API..."

$result = Make-Request "GET" "/api/usage"
if ($result.StatusCode -eq 200) {
    if ($result.Content -match '"metrics"') {
        Log-Pass "GET /api/usage returns metrics"
    } else {
        Log-Fail "GET /api/usage" "Missing metrics"
    }
} else {
    Log-Fail "GET /api/usage" "Expected 200, got $($result.StatusCode)"
}

$result = Make-Request "GET" "/api/usage/llm_tokens"
if ($result.StatusCode -eq 200) {
    if ($result.Content -match '"category":"llm_tokens"') {
        Log-Pass "GET /api/usage/:category returns specific category"
    } else {
        Log-Fail "GET /api/usage/:category" "Category not found"
    }
} else {
    Log-Fail "GET /api/usage/:category" "Expected 200, got $($result.StatusCode)"
}

# ============================================
# Sync API Tests
# ============================================
Log-Info "Testing Sync API..."

$result = Make-Request "GET" "/api/sync"
if ($result.StatusCode -eq 200) {
    if ($result.Content -match '"sections"' -and $result.Content -match '"overall_status"') {
        Log-Pass "GET /api/sync returns sync status"
    } else {
        Log-Fail "GET /api/sync" "Missing sections or overall_status"
    }
} else {
    Log-Fail "GET /api/sync" "Expected 200, got $($result.StatusCode)"
}

$body = '{"direction":"bidirectional","dryRun":true}'
$result = Make-Request "POST" "/api/sync" $body
if ($result.StatusCode -eq 200) {
    Log-Pass "POST /api/sync triggers universal sync"
} else {
    Log-Fail "POST /api/sync" "Expected 200, got $($result.StatusCode)"
}

$result = Make-Request "GET" "/api/sync/projects"
if ($result.StatusCode -eq 200) {
    if ($result.Content -match '"markdown"') {
        Log-Pass "GET /api/sync/projects returns markdown"
    } else {
        Log-Fail "GET /api/sync/projects" "Missing markdown"
    }
} else {
    Log-Fail "GET /api/sync/projects" "Expected 200, got $($result.StatusCode)"
}

# ============================================
# Notifications API Tests
# ============================================
Log-Info "Testing Notifications API..."

$result = Make-Request "GET" "/api/notifications"
if ($result.StatusCode -eq 200) {
    if ($result.Content -match '"notifications"') {
        Log-Pass "GET /api/notifications returns notifications"
    } else {
        Log-Fail "GET /api/notifications" "Missing notifications"
    }
} else {
    Log-Fail "GET /api/notifications" "Expected 200, got $($result.StatusCode)"
}

$body = '{"type":"baymax_alert","title":"Test Alert","message":"Test message"}'
$result = Make-Request "POST" "/api/notify" $body
if ($result.StatusCode -eq 200) {
    Log-Pass "POST /api/notify creates notification"
} else {
    Log-Fail "POST /api/notify" "Expected 200, got $($result.StatusCode)"
}

# ============================================
# Sync Health API Tests
# ============================================
Log-Info "Testing Sync Health API..."

$result = Make-Request "GET" "/api/sync/health"
if ($result.StatusCode -eq 200) {
    if ($result.Content -match '"sections"') {
        Log-Pass "GET /api/sync/health returns health status"
    } else {
        Log-Fail "GET /api/sync/health" "Missing sections"
    }
} else {
    Log-Fail "GET /api/sync/health" "Expected 200, got $($result.StatusCode)"
}

# ============================================
# Cleanup
# ============================================
Log-Info "Cleaning up test data..."

foreach ($id in $CREATED_PROJECT_IDS) {
    if ($id) {
        Invoke-RestMethod -Uri "$API_URL/api/projects/$id" -Method Delete -ErrorAction SilentlyContinue | Out-Null
    }
}

# ============================================
# Summary
# ============================================
Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  Test Summary" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Passed: $PASS" -ForegroundColor $GREEN
Write-Host "  Failed: $FAIL" -ForegroundColor $RED
Write-Host "========================================`n" -ForegroundColor Cyan

if ($FAIL -eq 0) {
    Write-Host "All tests passed!" -ForegroundColor $GREEN
    exit 0
} else {
    Write-Host "Some tests failed!" -ForegroundColor $RED
    exit 1
}
