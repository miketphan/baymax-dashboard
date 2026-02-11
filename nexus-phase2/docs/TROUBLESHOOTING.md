# Nexus Phase 2 - Troubleshooting Guide

Common issues and solutions for Nexus Phase 2.

**Architecture Note:** Nexus uses **API-only** data flow. Project data lives in Cloudflare D1 database. Baymax fetches fresh data via API calls — no local file sync required.

**Data Flow:**
```
You edit in UI → Saves to D1 database → Baymax fetches via API when needed
```

This is simpler, faster, and more reliable than bidirectional file sync.

---

## Table of Contents

1. [Database Issues](#database-issues)
2. [API Errors](#api-errors)
3. [Sync Problems](#sync-problems)
4. [CORS Issues](#cors-issues)
5. [Performance Issues](#performance-issues)
6. [Deployment Issues](#deployment-issues)
7. [Frontend Integration](#frontend-integration)

---

## Quick Reference: Common Issues from First Deployment

### Issue: HTTP 404 / "Something Went Wrong" on Dashboard
**Symptoms:** Dashboard loads but immediately shows error

**Likely Causes:**
1. API path mismatch (frontend calling wrong endpoint)
2. Data format mismatch (frontend expects different structure than API returns)
3. Database not migrated on remote

**Fix Steps:**
```bash
# 1. Test API directly
curl https://nexus-api.miket-phan.workers.dev/api/projects
# Should return: {"success":true,"data":{"projects":[]}}

# 2. If error, check database migrated on REMOTE (not local)
npx wrangler d1 execute nexus-production --remote --file=./schema.sql

# 3. Rebuild frontend with correct API_BASE_URL
# Edit dashboard/src/lib/api.ts:
# const API_BASE_URL = 'https://nexus-api.miket-phan.workers.dev/api';

# 4. Clear build cache and rebuild
cd dashboard
Remove-Item -Recurse -Force dist
npm run build
Add-Content dist\index.html "`n"  # Force file change
npx wrangler pages deploy dist --project-name=nexus-dashboard
```

---

### Issue: "0 files uploaded" on Deploy
**Symptoms:** Cloudflare Pages says "0 files changed"

**Cause:** Pages cache thinks files are identical

**Fix:** Force a file change:
```bash
Add-Content dist\index.html "`n"  # Add newline
# OR
echo. >> dist\index.html
```

Then redeploy.

---

### Issue: SSL Error on Fresh Deploy
**Symptoms:** `ERR_SSL_VERSION_OR_CIPHER_MISMATCH`

**Cause:** SSL certificate still propagating

**Fix:** Wait 30-60 seconds, refresh. Or try different browser.

---

### Issue: Black Screen After Load
**Symptoms:** Dashboard flashes content then goes black

**Cause:** JavaScript runtime error (usually data format mismatch)

**Fix:**
1. Open browser DevTools (F12)
2. Check Console for error
3. Verify API response format matches frontend expectations

**Common mismatches:**
- API returns `{data:{projects:[]}}`, frontend expects `[]`
- API returns `{title:"..."}`, frontend expects `{name:"..."}`

---

## Database Issues

### Error: "D1 database not found"

**Symptoms:**
```
Error: D1 database not found
```

**Causes:**
- Database ID not set in `wrangler.toml`
- Database doesn't exist
- Wrong database name

**Solutions:**

1. Verify database exists:
```bash
wrangler d1 list
```

2. Check `wrangler.toml`:
```toml
[[d1_databases]]
binding = "DB"
database_name = "nexus-production"
database_id = "your-actual-database-id"
```

3. Create database if missing:
```bash
wrangler d1 create nexus-production
```

---

### Error: "no such table"

**Symptoms:**
```
Error: no such table: projects
```

**Causes:**
- Migrations not applied
- Database is empty

**Solutions:**

1. Apply migrations:
```bash
wrangler d1 migrations apply nexus-production
```

2. Or seed directly:
```bash
wrangler d1 execute nexus-production --file=./schema.sql
```

3. Verify tables exist:
```bash
wrangler d1 execute nexus-production --command="SELECT name FROM sqlite_master WHERE type='table'"
```

---

### Error: "database is locked"

**Symptoms:**
- Slow response times
- Timeout errors
- "database is locked" message

**Causes:**
- Concurrent write operations
- Long-running transactions

**Solutions:**

1. Check for long-running queries:
```bash
wrangler tail
```

2. Optimize queries (add indexes):
```sql
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
```

3. Batch operations:
- Use D1's batch API for multiple inserts
- Reduce transaction scope

---

## API Errors

### Error: "404 Not Found"

**Symptoms:**
```json
{
  "success": false,
  "error": {
    "code": "NOT_FOUND",
    "message": "Project not found"
  }
}
```

**Causes:**
- Invalid ID
- Resource was deleted
- Wrong endpoint URL

**Solutions:**

1. Verify the ID:
```bash
curl https://api.example.com/api/projects
```

2. Check URL spelling:
- `/api/projects` (correct)
- `/api/project` (incorrect)

3. Verify resource exists:
```bash
wrangler d1 execute nexus-production --command="SELECT id FROM projects WHERE id = 'proj_xxx'"
```

---

### Error: "422 Validation Error"

**Symptoms:**
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed",
    "details": {
      "field": "title",
      "message": "Title cannot be empty"
    }
  }
}
```

**Causes:**
- Missing required fields
- Invalid field values
- Field type mismatch

**Solutions:**

1. Check required fields:
```json
{
  "title": "Required field"
}
```

2. Validate status values:
- Valid: `backlog`, `in_progress`, `done`, `archived`
- Invalid: `pending`, `completed`, etc.

3. Validate priority values:
- Valid: `low`, `medium`, `high`

---

### Error: "400 Bad Request"

**Symptoms:**
```json
{
  "success": false,
  "error": {
    "code": "BAD_REQUEST",
    "message": "Invalid JSON in request body"
  }
}
```

**Causes:**
- Malformed JSON
- Missing Content-Type header

**Solutions:**

1. Validate JSON:
```bash
echo '{"title":"Test"}' | jq .
```

2. Add Content-Type header:
```bash
curl -X POST https://api.example.com/api/projects \
  -H "Content-Type: application/json" \
  -d '{"title":"Test"}'
```

---

### Error: "500 Internal Server Error"

**Symptoms:**
```json
{
  "success": false,
  "error": {
    "code": "INTERNAL_ERROR",
    "message": "Internal server error"
  }
}
```

**Causes:**
- Unhandled exception
- Database error
- Code bug

**Solutions:**

1. Check worker logs:
```bash
wrangler tail
```

2. Enable debug logging:
```typescript
console.log('Debug:', JSON.stringify(data));
```

3. Test locally:
```bash
npm run dev
```

---

## Sync Problems

### Issue: Sync never completes

**Symptoms:**
- Sync status stuck
- No error message
- High retry count

**Causes:**
- Timeout
- Deadlock
- Resource conflict

**Solutions:**

1. Check sync state:
```bash
curl https://api.example.com/api/sync
```

2. Reset sync state:
```bash
wrangler d1 execute nexus-production --command="UPDATE sync_state SET last_error = NULL, retry_count = 0 WHERE section = 'projects'"
```

3. Force sync with dry-run:
```bash
curl -X POST https://api.example.com/api/sync \
  -H "Content-Type: application/json" \
  -d '{"dryRun":true}'
```

---

### Issue: Conflicts not resolving

**Symptoms:**
- Same conflicts appear repeatedly
- Data not updating

**Causes:**
- Conflict resolution strategy
- Stale data sources

**Solutions:**

1. Change conflict resolution:
```bash
curl -X POST https://api.example.com/api/sync \
  -H "Content-Type: application/json" \
  -d '{
    "direction": "bidirectional",
    "conflictResolution": "prefer_d1"
  }'
```

2. Force direction:
```bash
# Force file to D1
curl -X POST https://api.example.com/api/sync \
  -d '{"direction":"to_d1"}'

# Force D1 to file
curl -X POST https://api.example.com/api/sync \
  -d '{"direction":"to_file"}'
```

---

### Issue: Markdown not parsing correctly

**Symptoms:**
- Projects not created from markdown
- Data extracted incorrectly

**Causes:**
- Malformed markdown
- Unexpected format

**Solutions:**

1. Validate markdown format:
```markdown
# Projects

### Project Title
**Status:** 🔄 In Progress
**Priority:** High

**Description:**
Description text here

**Key Deliverables:**
- Item 1
- Item 2
```

2. Check status values:
- `📅 Backlog` or `backlog`
- `🔄 In Progress` or `in_progress`
- `✅ Complete` or `done`
- `📦 Archived` or `archived`

3. Test parsing locally:
```bash
curl -X POST https://api.example.com/api/sync/projects \
  -H "Content-Type: application/json" \
  -d '{
    "content": "# Projects\n\n### Test Project\n**Status:** 📅 Backlog\n**Priority:** Medium",
    "direction": "to_d1",
    "dryRun": true
  }'
```

---

## CORS Issues

### Error: "CORS policy: No 'Access-Control-Allow-Origin' header"

**Symptoms:**
```
Access to fetch at 'https://api.example.com/api/projects' from origin 
'http://localhost:3000' has been blocked by CORS policy
```

**Causes:**
- CORS origin not configured
- Wrong origin in request
- Preflight failed

**Solutions:**

1. Update `wrangler.toml`:
```toml
[vars]
CORS_ORIGIN = "http://localhost:3000"  # Development
# CORS_ORIGIN = "https://yourdomain.com"  # Production
```

2. Test CORS preflight:
```bash
curl -X OPTIONS https://api.example.com/api/projects \
  -H "Origin: http://localhost:3000" \
  -H "Access-Control-Request-Method: POST" \
  -v
```

3. Check response headers:
```
Access-Control-Allow-Origin: http://localhost:3000
Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS
```

---

### Error: "CORS preflight channel did not succeed"

**Symptoms:**
- OPTIONS request fails
- Actual request never sent

**Causes:**
- Server not responding to OPTIONS
- Wrong headers requested

**Solutions:**

1. Verify OPTIONS handler:
```typescript
// In src/index.ts
if (request.method === 'OPTIONS') {
  return new Response(null, { status: 204, headers: corsHeaders });
}
```

2. Test OPTIONS manually:
```bash
curl -X OPTIONS https://api.example.com/api/projects -v
```

---

## Performance Issues

### Issue: Slow API responses

**Symptoms:**
- Response time > 1 second
- Timeout errors

**Causes:**
- N+1 queries
- Missing indexes
- Large data sets

**Solutions:**

1. Add database indexes:
```sql
-- Already in schema.sql
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
CREATE INDEX IF NOT EXISTS idx_projects_priority ON projects(priority);
```

2. Use query batching:
```typescript
const statements = projects.map(p => 
  db.prepare('INSERT INTO projects ...').bind(...)
);
await db.batch(statements);
```

3. Add caching headers:
```typescript
return new Response(data, {
  headers: {
    'Cache-Control': 'public, max-age=60',
  },
});
```

---

### Issue: High memory usage

**Symptoms:**
- Worker exceeding limits
- Out of memory errors

**Causes:**
- Loading too much data
- Memory leaks
- Large JSON parsing

**Solutions:**

1. Paginate large results:
```typescript
const limit = 50;
const offset = (page - 1) * limit;
const results = await db
  .prepare('SELECT * FROM projects LIMIT ? OFFSET ?')
  .bind(limit, offset)
  .all();
```

2. Stream large responses:
```typescript
const stream = new ReadableStream({
  start(controller) {
    // Stream data chunks
  }
});
```

3. Optimize data loading:
- Don't load full history
- Use projections (select specific columns)

---

## Deployment Issues

### Error: "Failed to publish"

**Symptoms:**
```
Failed to publish: Error 10000: Authentication error
```

**Causes:**
- Not logged in
- Expired token
- Wrong permissions

**Solutions:**

1. Re-authenticate:
```bash
wrangler login
```

2. Verify account:
```bash
wrangler whoami
```

3. Check permissions in Cloudflare dashboard

---

### Error: "Module not found"

**Symptoms:**
```
Error: Module not found: src/index.ts
```

**Causes:**
- Missing file
- Wrong path in `wrangler.toml`
- Build not run

**Solutions:**

1. Verify file exists:
```bash
ls -la src/index.ts
```

2. Check `wrangler.toml`:
```toml
main = "src/index.ts"
```

3. Build if needed:
```bash
npm run build
```

---

### Error: "TypeScript compilation failed"

**Symptoms:**
```
Error: TypeScript compilation failed
```

**Causes:**
- Type errors
- Missing types
- Wrong configuration

**Solutions:**

1. Check types locally:
```bash
npx tsc --noEmit
```

2. Install missing types:
```bash
npm install --save-dev @cloudflare/workers-types
```

3. Fix type errors

---

## Frontend Integration

### Issue: Frontend can't connect to API

**Symptoms:**
- Network errors in browser
- Connection refused
- CORS errors

**Solutions:**

1. Check API URL:
```typescript
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8787';
```

2. Verify CORS origin:
- Must match frontend domain exactly
- Include protocol (http/https)
- Include port if non-standard

3. Test with curl:
```bash
curl https://api.example.com/health
```

---

### Issue: Data not updating in UI

**Symptoms:**
- Changes not reflecting
- Stale data displayed

**Solutions:**

1. Check cache headers:
```bash
curl -I https://api.example.com/api/projects
```

2. Force refresh:
```typescript
// Add cache-busting
fetch(`/api/projects?_=${Date.now()}`)
```

3. Check sync status:
```bash
curl https://api.example.com/api/sync/health
```

---

## Debug Mode

Enable detailed logging:

```typescript
// Add to src/index.ts
console.log(`[${new Date().toISOString()}] ${request.method} ${pathname}`);
console.log('Headers:', JSON.stringify(Object.fromEntries(request.headers)));
console.log('Body:', await request.clone().text());
```

View logs:
```bash
wrangler tail
```

---

## Getting Help

1. **Check logs:** `wrangler tail`
2. **Test locally:** `npm run dev`
3. **Review docs:** See `docs/API.md`
4. **Check status:** Cloudflare Status Page
5. **Community:** Cloudflare Workers Discord

---

## Emergency Contacts

| Role | Contact | Escalation |
|------|---------|------------|
| Primary On-Call | | |
| Secondary On-Call | | |
| Cloudflare Support | | |
