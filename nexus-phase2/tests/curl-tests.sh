#!/bin/bash
# Nexus Phase 2 - Comprehensive API Test Suite
# Run with: ./tests/curl-tests.sh
# Or: API_URL=https://api.example.com ./tests/curl-tests.sh

set -e

# Configuration
API_URL="${API_URL:-http://localhost:8787}"
ECHO="echo -e"
PASS=0
FAIL=0
CREATED_PROJECT_IDS=()

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Helper functions
log_info() {
  $ECHO "${YELLOW}[INFO]${NC} $1"
}

log_pass() {
  $ECHO "${GREEN}[PASS]${NC} $1"
  ((PASS++))
}

log_fail() {
  $ECHO "${RED}[FAIL]${NC} $1"
  if [ -n "$2" ]; then
    $ECHO "       Error: $2"
  fi
  ((FAIL++))
}

make_request() {
  local method=$1
  local endpoint=$2
  local body=$3
  local expected_status=$4
  
  if [ -n "$body" ]; then
    curl -s -w "\n%{http_code}" -X "$method" \
      -H "Content-Type: application/json" \
      -d "$body" \
      "${API_URL}${endpoint}"
  else
    curl -s -w "\n%{http_code}" -X "$method" \
      -H "Content-Type: application/json" \
      "${API_URL}${endpoint}"
  fi
}

extract_body() {
  echo "$1" | sed '$d'
}

extract_status() {
  echo "$1" | tail -n1
}

# ============================================
# Test Suite
# ============================================

$ECHO "\n========================================"
$ECHO "  Nexus Phase 2 - API Test Suite"
$ECHO "  URL: ${API_URL}"
$ECHO "========================================\n"

# ============================================
# Health Check Tests
# ============================================
log_info "Testing Health Endpoints..."

response=$(make_request "GET" "/health" "" "200")
body=$(extract_body "$response")
status=$(extract_status "$response")

if [ "$status" == "200" ]; then
  if echo "$body" | grep -q '"status":"healthy"'; then
    log_pass "GET /health returns healthy status"
  else
    log_fail "GET /health" "Status not healthy"
  fi
else
  log_fail "GET /health" "Expected 200, got $status"
fi

# ============================================
# Projects API Tests
# ============================================
log_info "Testing Projects API..."

# Test: List projects (should return array)
response=$(make_request "GET" "/api/projects" "" "200")
body=$(extract_body "$response")
status=$(extract_status "$response")

if [ "$status" == "200" ]; then
  if echo "$body" | grep -q '"success":true'; then
    log_pass "GET /api/projects returns success"
  else
    log_fail "GET /api/projects" "Success flag not found"
  fi
else
  log_fail "GET /api/projects" "Expected 200, got $status"
fi

# Test: Create project
TEST_TITLE="Test Project $(date +%s)"
response=$(make_request "POST" "/api/projects" "{\"title\":\"$TEST_TITLE\",\"description\":\"Test description\",\"status\":\"backlog\",\"priority\":\"high\"}" "200")
body=$(extract_body "$response")
status=$(extract_status "$response")

if [ "$status" == "200" ]; then
  PROJECT_ID=$(echo "$body" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
  if [ -n "$PROJECT_ID" ]; then
    log_pass "POST /api/projects creates project (ID: $PROJECT_ID)"
    CREATED_PROJECT_IDS+=("$PROJECT_ID")
  else
    log_fail "POST /api/projects" "No project ID returned"
  fi
else
  log_fail "POST /api/projects" "Expected 200, got $status"
fi

# Test: Get specific project
if [ -n "$PROJECT_ID" ]; then
  response=$(make_request "GET" "/api/projects/$PROJECT_ID" "" "200")
  body=$(extract_body "$response")
  status=$(extract_status "$response")
  
  if [ "$status" == "200" ]; then
    if echo "$body" | grep -q "\"id\":\"$PROJECT_ID\""; then
      log_pass "GET /api/projects/:id returns project"
    else
      log_fail "GET /api/projects/:id" "Project ID not found in response"
    fi
  else
    log_fail "GET /api/projects/:id" "Expected 200, got $status"
  fi
fi

# Test: Update project
if [ -n "$PROJECT_ID" ]; then
  response=$(make_request "PUT" "/api/projects/$PROJECT_ID" "{\"title\":\"Updated Title\",\"status\":\"in_progress\"}" "200")
  body=$(extract_body "$response")
  status=$(extract_status "$response")
  
  if [ "$status" == "200" ]; then
    if echo "$body" | grep -q '"title":"Updated Title"' && echo "$body" | grep -q '"status":"in_progress"'; then
      log_pass "PUT /api/projects/:id updates project"
    else
      log_fail "PUT /api/projects/:id" "Fields not updated"
    fi
  else
    log_fail "PUT /api/projects/:id" "Expected 200, got $status"
  fi
fi

# Test: Patch project status
if [ -n "$PROJECT_ID" ]; then
  response=$(make_request "PATCH" "/api/projects/$PROJECT_ID/status" "{\"status\":\"done\"}" "200")
  body=$(extract_body "$response")
  status=$(extract_status "$response")
  
  if [ "$status" == "200" ]; then
    if echo "$body" | grep -q '"status":"done"'; then
      log_pass "PATCH /api/projects/:id/status updates status"
    else
      log_fail "PATCH /api/projects/:id/status" "Status not updated"
    fi
  else
    log_fail "PATCH /api/projects/:id/status" "Expected 200, got $status"
  fi
fi

# Test: Delete project
if [ -n "$PROJECT_ID" ]; then
  response=$(make_request "DELETE" "/api/projects/$PROJECT_ID" "" "200")
  body=$(extract_body "$response")
  status=$(extract_status "$response")
  
  if [ "$status" == "200" ]; then
    if echo "$body" | grep -q '"deleted":true'; then
      log_pass "DELETE /api/projects/:id removes project"
      # Remove from cleanup list since we deleted it
      CREATED_PROJECT_IDS=("${CREATED_PROJECT_IDS[@]/$PROJECT_ID}")
    else
      log_fail "DELETE /api/projects/:id" "Delete not confirmed"
    fi
  else
    log_fail "DELETE /api/projects/:id" "Expected 200, got $status"
  fi
fi

# Test: Get non-existent project (should 404)
response=$(make_request "GET" "/api/projects/nonexistent-id-12345" "" "404")
status=$(extract_status "$response")

if [ "$status" == "404" ]; then
  log_pass "GET /api/projects/:id returns 404 for unknown ID"
else
  log_fail "GET /api/projects/:id (404 test)" "Expected 404, got $status"
fi

# Test: Create project with missing title (should 422)
response=$(make_request "POST" "/api/projects" "{\"description\":\"No title\"}" "422")
status=$(extract_status "$response")

if [ "$status" == "422" ]; then
  log_pass "POST /api/projects validates required fields"
else
  log_fail "POST /api/projects validation" "Expected 422, got $status"
fi

# Test: Create project with invalid status (should 422)
response=$(make_request "POST" "/api/projects" "{\"title\":\"Test\",\"status\":\"invalid_status\"}" "422")
status=$(extract_status "$response")

if [ "$status" == "422" ]; then
  log_pass "POST /api/projects validates status values"
else
  log_fail "POST /api/projects status validation" "Expected 422, got $status"
fi

# Test: Invalid JSON (should 400)
response=$(curl -s -w "\n%{http_code}" -X POST \
  -H "Content-Type: application/json" \
  -d "not valid json" \
  "${API_URL}/api/projects")
status=$(extract_status "$response")

if [ "$status" == "400" ]; then
  log_pass "POST /api/projects returns 400 for invalid JSON"
else
  log_fail "POST /api/projects (invalid JSON)" "Expected 400, got $status"
fi

# ============================================
# Services API Tests
# ============================================
log_info "Testing Services API..."

response=$(make_request "GET" "/api/services" "" "200")
body=$(extract_body "$response")
status=$(extract_status "$response")

if [ "$status" == "200" ]; then
  if echo "$body" | grep -q '"services"' && echo "$body" | grep -q '"summary"'; then
    log_pass "GET /api/services returns services and summary"
  else
    log_fail "GET /api/services" "Missing services or summary"
  fi
else
  log_fail "GET /api/services" "Expected 200, got $status"
fi

# Test: Get specific service
response=$(make_request "GET" "/api/services/google_calendar" "" "200")
body=$(extract_body "$response")
status=$(extract_status "$response")

if [ "$status" == "200" ]; then
  if echo "$body" | grep -q '"id":"google_calendar"'; then
    log_pass "GET /api/services/:id returns specific service"
  else
    log_fail "GET /api/services/:id" "Service ID not found"
  fi
else
  log_fail "GET /api/services/:id" "Expected 200, got $status"
fi

# Test: Refresh service
response=$(make_request "POST" "/api/services/google_calendar/refresh" "" "200")
body=$(extract_body "$response")
status=$(extract_status "$response")

if [ "$status" == "200" ]; then
  if echo "$body" | grep -q '"refreshed_at"'; then
    log_pass "POST /api/services/:id/refresh triggers refresh"
  else
    log_fail "POST /api/services/:id/refresh" "Refresh not confirmed"
  fi
else
  log_fail "POST /api/services/:id/refresh" "Expected 200, got $status"
fi

# Test: Refresh all services
response=$(make_request "POST" "/api/services" "" "200")
body=$(extract_body "$response")
status=$(extract_status "$response")

if [ "$status" == "200" ]; then
  if echo "$body" | grep -q '"refreshed_at"'; then
    log_pass "POST /api/services refreshes all services"
  else
    log_fail "POST /api/services" "Refresh not confirmed"
  fi
else
  log_fail "POST /api/services" "Expected 200, got $status"
fi

# Test: Get non-existent service (should 404)
response=$(make_request "GET" "/api/services/nonexistent" "" "404")
status=$(extract_status "$response")

if [ "$status" == "404" ]; then
  log_pass "GET /api/services/:id returns 404 for unknown service"
else
  log_fail "GET /api/services/:id (404 test)" "Expected 404, got $status"
fi

# ============================================
# Usage API Tests
# ============================================
log_info "Testing Usage API..."

response=$(make_request "GET" "/api/usage" "" "200")
body=$(extract_body "$response")
status=$(extract_status "$response")

if [ "$status" == "200" ]; then
  if echo "$body" | grep -q '"metrics"' && echo "$body" | grep -q '"refreshed_at"'; then
    log_pass "GET /api/usage returns metrics"
  else
    log_fail "GET /api/usage" "Missing metrics or refreshed_at"
  fi
else
  log_fail "GET /api/usage" "Expected 200, got $status"
fi

# Test: Get specific usage category
response=$(make_request "GET" "/api/usage/llm_tokens" "" "200")
body=$(extract_body "$response")
status=$(extract_status "$response")

if [ "$status" == "200" ]; then
  if echo "$body" | grep -q '"category":"llm_tokens"'; then
    log_pass "GET /api/usage/:category returns specific category"
  else
    log_fail "GET /api/usage/:category" "Category not found"
  fi
else
  log_fail "GET /api/usage/:category" "Expected 200, got $status"
fi

# Test: Sync usage category
response=$(make_request "POST" "/api/usage/llm_tokens/sync" "" "200")
body=$(extract_body "$response")
status=$(extract_status "$response")

if [ "$status" == "200" ]; then
  if echo "$body" | grep -q '"synced_at"'; then
    log_pass "POST /api/usage/:category/sync triggers sync"
  else
    log_fail "POST /api/usage/:category/sync" "Sync not confirmed"
  fi
else
  log_fail "POST /api/usage/:category/sync" "Expected 200, got $status"
fi

# Test: Sync all usage
response=$(make_request "POST" "/api/usage" "" "200")
body=$(extract_body "$response")
status=$(extract_status "$response")

if [ "$status" == "200" ]; then
  if echo "$body" | grep -q '"synced_at"'; then
    log_pass "POST /api/usage syncs all categories"
  else
    log_fail "POST /api/usage" "Sync not confirmed"
  fi
else
  log_fail "POST /api/usage" "Expected 200, got $status"
fi

# Test: Get non-existent category (should 404)
response=$(make_request "GET" "/api/usage/nonexistent_category" "" "404")
status=$(extract_status "$response")

if [ "$status" == "404" ]; then
  log_pass "GET /api/usage/:category returns 404 for unknown category"
else
  log_fail "GET /api/usage/:category (404 test)" "Expected 404, got $status"
fi

# ============================================
# Sync API Tests
# ============================================
log_info "Testing Sync API..."

response=$(make_request "GET" "/api/sync" "" "200")
body=$(extract_body "$response")
status=$(extract_status "$response")

if [ "$status" == "200" ]; then
  if echo "$body" | grep -q '"sections"' && echo "$body" | grep -q '"overall_status"'; then
    log_pass "GET /api/sync returns sync status"
  else
    log_fail "GET /api/sync" "Missing sections or overall_status"
  fi
else
  log_fail "GET /api/sync" "Expected 200, got $status"
fi

# Test: Universal sync
response=$(make_request "POST" "/api/sync" "{\"direction\":\"bidirectional\",\"dryRun\":true}" "200")
body=$(extract_body "$response")
status=$(extract_status "$response")

if [ "$status" == "200" ]; then
  if echo "$body" | grep -q '"results"' && echo "$body" | grep -q '"duration_ms"'; then
    log_pass "POST /api/sync triggers universal sync"
  else
    log_fail "POST /api/sync" "Missing results or duration"
  fi
else
  log_fail "POST /api/sync" "Expected 200, got $status"
fi

# Test: Get projects markdown
response=$(make_request "GET" "/api/sync/projects" "" "200")
body=$(extract_body "$response")
status=$(extract_status "$response")

if [ "$status" == "200" ]; then
  if echo "$body" | grep -q '"markdown"' && echo "$body" | grep -q '"project_count"'; then
    log_pass "GET /api/sync/projects returns markdown"
  else
    log_fail "GET /api/sync/projects" "Missing markdown or project_count"
  fi
else
  log_fail "GET /api/sync/projects" "Expected 200, got $status"
fi

# Test: Sync projects with markdown
MARKDOWN_CONTENT='# Projects

### API Test Project
**Status:** 🔄 In Progress
**Priority:** High

**Description:**
Test project from API sync

**Key Deliverables:**
- Test feature 1
- Test feature 2
'

response=$(make_request "POST" "/api/sync/projects" "{\"content\":\"$MARKDOWN_CONTENT\",\"direction\":\"to_d1\",\"dryRun\":true}" "200")
body=$(extract_body "$response")
status=$(extract_status "$response")

if [ "$status" == "200" ]; then
  log_pass "POST /api/sync/projects accepts markdown content"
else
  log_fail "POST /api/sync/projects" "Expected 200, got $status"
fi

# Test: Get section content
response=$(make_request "GET" "/api/sync/protocols" "" "200")
body=$(extract_body "$response")
status=$(extract_status "$response")

if [ "$status" == "200" ]; then
  if echo "$body" | grep -q '"section":"protocols"'; then
    log_pass "GET /api/sync/:section returns section content"
  else
    log_fail "GET /api/sync/:section" "Section not found"
  fi
else
  log_fail "GET /api/sync/:section" "Expected 200, got $status"
fi

# Test: Sync specific section
response=$(make_request "POST" "/api/sync/protocols" "" "200")
body=$(extract_body "$response")
status=$(extract_status "$response")

if [ "$status" == "200" ]; then
  log_pass "POST /api/sync/:section syncs section"
else
  log_fail "POST /api/sync/:section" "Expected 200, got $status"
fi

# Test: Invalid section (should 400)
response=$(make_request "GET" "/api/sync/invalid_section_12345" "" "400")
status=$(extract_status "$response")

if [ "$status" == "400" ]; then
  log_pass "GET /api/sync/:section returns 400 for invalid section"
else
  log_fail "GET /api/sync/:section (invalid)" "Expected 400, got $status"
fi

# ============================================
# Notifications API Tests
# ============================================
log_info "Testing Notifications API..."

response=$(make_request "GET" "/api/notifications" "" "200")
body=$(extract_body "$response")
status=$(extract_status "$response")

if [ "$status" == "200" ]; then
  if echo "$body" | grep -q '"notifications"'; then
    log_pass "GET /api/notifications returns notifications"
  else
    log_fail "GET /api/notifications" "Missing notifications array"
  fi
else
  log_fail "GET /api/notifications" "Expected 200, got $status"
fi

# Test: Get notification count
response=$(make_request "GET" "/api/notifications/count" "" "200")
body=$(extract_body "$response")
status=$(extract_status "$response")

if [ "$status" == "200" ]; then
  if echo "$body" | grep -q '"total"' && echo "$body" | grep -q '"unread"'; then
    log_pass "GET /api/notifications/count returns counts"
  else
    log_fail "GET /api/notifications/count" "Missing counts"
  fi
else
  log_fail "GET /api/notifications/count" "Expected 200, got $status"
fi

# Test: Create notification
response=$(make_request "POST" "/api/notify" "{\"type\":\"baymax_alert\",\"title\":\"Test Alert\",\"message\":\"Test message\"}" "200")
body=$(extract_body "$response")
status=$(extract_status "$response")

if [ "$status" == "200" ]; then
  NOTIFICATION_ID=$(echo "$body" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
  if [ -n "$NOTIFICATION_ID" ]; then
    log_pass "POST /api/notify creates notification (ID: $NOTIFICATION_ID)"
  else
    log_fail "POST /api/notify" "No notification ID returned"
  fi
else
  log_fail "POST /api/notify" "Expected 200, got $status"
fi

# Test: Create project notification
if [ -n "$PROJECT_ID" ]; then
  response=$(make_request "POST" "/api/notify/project/$PROJECT_ID" "{\"message\":\"Project alert\"}" "200")
  body=$(extract_body "$response")
  status=$(extract_status "$response")
  
  if [ "$status" == "200" ]; then
    log_pass "POST /api/notify/project/:id creates project notification"
  else
    log_fail "POST /api/notify/project/:id" "Expected 200, got $status"
  fi
fi

# Test: Notification with missing title (should 422)
response=$(make_request "POST" "/api/notify" "{\"type\":\"system\",\"message\":\"No title\"}" "422")
status=$(extract_status "$response")

if [ "$status" == "422" ]; then
  log_pass "POST /api/notify validates required title"
else
  log_fail "POST /api/notify validation" "Expected 422, got $status"
fi

# ============================================
# Sync Health API Tests
# ============================================
log_info "Testing Sync Health API..."

response=$(make_request "GET" "/api/sync/health" "" "200")
body=$(extract_body "$response")
status=$(extract_status "$response")

if [ "$status" == "200" ]; then
  if echo "$body" | grep -q '"sections"' && echo "$body" | grep -q '"overall_status"'; then
    log_pass "GET /api/sync/health returns health status"
  else
    log_fail "GET /api/sync/health" "Missing sections or overall_status"
  fi
else
  log_fail "GET /api/sync/health" "Expected 200, got $status"
fi

# Test: Get specific section health
response=$(make_request "GET" "/api/sync/health/projects" "" "200")
body=$(extract_body "$response")
status=$(extract_status "$response")

if [ "$status" == "200" ]; then
  if echo "$body" | grep -q '"section":"projects"'; then
    log_pass "GET /api/sync/health/:section returns section health"
  else
    log_fail "GET /api/sync/health/:section" "Section not found"
  fi
else
  log_fail "GET /api/sync/health/:section" "Expected 200, got $status"
fi

# ============================================
# CORS Tests
# ============================================
log_info "Testing CORS..."

response=$(curl -s -w "\n%{http_code}" -X OPTIONS \
  -H "Origin: http://localhost:3000" \
  -H "Access-Control-Request-Method: POST" \
  "${API_URL}/api/projects")
status=$(extract_status "$response")
headers=$(echo "$response" | grep -i "access-control-allow")

if [ "$status" == "204" ]; then
  log_pass "OPTIONS request returns 204"
else
  log_fail "OPTIONS request" "Expected 204, got $status"
fi

# Check CORS headers on regular request
response=$(curl -s -I -X GET \
  -H "Origin: http://localhost:3000" \
  "${API_URL}/api/projects")

if echo "$response" | grep -qi "access-control-allow-origin"; then
  log_pass "GET response includes CORS headers"
else
  log_fail "GET CORS headers" "Missing Access-Control-Allow-Origin"
fi

# ============================================
# Error Handling Tests
# ============================================
log_info "Testing Error Handling..."

# Test: Method not allowed
response=$(curl -s -w "\n%{http_code}" -X PATCH \
  -H "Content-Type: application/json" \
  "${API_URL}/api/projects")
status=$(extract_status "$response")

if [ "$status" == "405" ]; then
  log_pass "PATCH /api/projects returns 405 (method not allowed)"
else
  log_fail "PATCH /api/projects" "Expected 405, got $status"
fi

# Test: Not found endpoint
response=$(make_request "GET" "/api/nonexistent-endpoint" "" "404")
status=$(extract_status "$response")

if [ "$status" == "404" ]; then
  log_pass "Unknown endpoint returns 404"
else
  log_fail "Unknown endpoint" "Expected 404, got $status"
fi

# Test: Large payload
LARGE_TITLE=$(python3 -c "print('A'*5000)")
response=$(make_request "POST" "/api/projects" "{\"title\":\"$LARGE_TITLE\"}" "422")
status=$(extract_status "$response")

if [ "$status" == "422" ]; then
  log_pass "POST /api/projects validates title length"
else
  log_fail "POST /api/projects length validation" "Expected 422, got $status"
fi

# ============================================
# Cleanup
# ============================================
log_info "Cleaning up test data..."

for id in "${CREATED_PROJECT_IDS[@]}"; do
  if [ -n "$id" ]; then
    curl -s -X DELETE "${API_URL}/api/projects/$id" > /dev/null
  fi
done

# ============================================
# Summary
# ============================================
$ECHO "\n========================================"
$ECHO "  Test Summary"
$ECHO "========================================"
$ECHO "  Passed: ${GREEN}${PASS}${NC}"
$ECHO "  Failed: ${RED}${FAIL}${NC}"
$ECHO "========================================\n"

if [ $FAIL -eq 0 ]; then
  $ECHO "${GREEN}All tests passed!${NC}\n"
  exit 0
else
  $ECHO "${RED}Some tests failed!${NC}\n"
  exit 1
fi
