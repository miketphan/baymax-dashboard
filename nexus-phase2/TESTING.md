# Nexus Phase 2 - Testing & API Documentation

## Table of Contents
1. [Quick Start](#quick-start)
2. [API Endpoints](#api-endpoints)
3. [Test Scripts](#test-scripts)
4. [cURL Commands](#curl-commands)
5. [Troubleshooting](#troubleshooting)

---

## Quick Start

### Local Development
```bash
# Start the Wrangler dev server
cd nexus-phase2
wrangler dev

# The API will be available at http://localhost:8787
```

### Run All Tests
```bash
# Run the test suite
node tests/api.test.js
```

---

## API Endpoints

### Health Check
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Check API and database health |

### Projects API
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/projects` | List all projects |
| POST | `/api/projects` | Create a new project |
| GET | `/api/projects/:id` | Get a single project |
| PUT | `/api/projects/:id` | Update a project |
| PATCH | `/api/projects/:id/status` | Quick status update |
| DELETE | `/api/projects/:id` | Delete a project |

### Services API
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/services` | List all services |
| POST | `/api/services` | Refresh all services |
| GET | `/api/services/:id` | Get a single service |
| POST | `/api/services/:id/refresh` | Refresh specific service |

### Usage API
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/usage` | List all usage metrics |
| POST | `/api/usage` | Sync all usage data |
| GET | `/api/usage/:category` | Get specific category |
| POST | `/api/usage/:category/sync` | Sync specific category |

### Sync API
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/sync` | Get sync status for all sections |
| POST | `/api/sync` | **Universal Update** - Sync all sections |
| GET | `/api/sync/projects` | Get projects as markdown |
| POST | `/api/sync/projects` | Sync projects (bidirectional) |
| GET | `/api/sync/:section` | Get section content |
| POST | `/api/sync/:section` | Sync specific section |

---

## Test Scripts

### Automated Test Suite

Create `nexus-phase2/tests/api.test.js`:

```javascript
// Nexus Phase 2 - API Test Suite
// Run with: node tests/api.test.js

const BASE_URL = process.env.API_URL || 'http://localhost:8787';

class TestRunner {
  constructor() {
    this.tests = [];
    this.passed = 0;
    this.failed = 0;
  }

  test(name, fn) {
    this.tests.push({ name, fn });
  }

  async run() {
    console.log('\n🧪 Nexus Phase 2 - API Tests\n');
    console.log('=' .repeat(50));

    for (const { name, fn } of this.tests) {
      try {
        await fn();
        console.log(`✅ ${name}`);
        this.passed++;
      } catch (error) {
        console.log(`❌ ${name}`);
        console.log(`   Error: ${error.message}`);
        this.failed++;
      }
    }

    console.log('=' .repeat(50));
    console.log(`\nResults: ${this.passed} passed, ${this.failed} failed\n`);
    process.exit(this.failed > 0 ? 1 : 0);
  }

  assert(condition, message) {
    if (!condition) {
      throw new Error(message || 'Assertion failed');
    }
  }

  async fetch(path, options = {}) {
    const response = await fetch(`${BASE_URL}${path}`, {
      headers: { 'Content-Type': 'application/json', ...options.headers },
      ...options,
    });
    const data = await response.json().catch(() => null);
    return { response, data };
  }
}

const runner = new TestRunner();

// Health Check
runner.test('GET /health returns healthy status', async () => {
  const { response, data } = await runner.fetch('/health');
  runner.assert(response.status === 200, `Expected 200, got ${response.status}`);
  runner.assert(data?.status === 'healthy', 'Expected healthy status');
  runner.assert(data?.checks?.database === true, 'Database should be healthy');
});

// Projects API
runner.test('GET /api/projects returns array', async () => {
  const { response, data } = await runner.fetch('/api/projects');
  runner.assert(response.status === 200, `Expected 200, got ${response.status}`);
  runner.assert(data?.success === true, 'Expected success=true');
  runner.assert(Array.isArray(data?.data?.projects), 'Expected projects array');
});

runner.test('POST /api/projects creates project', async () => {
  const project = {
    title: 'Test Project ' + Date.now(),
    description: 'A test project',
    status: 'backlog',
    priority: 'high',
  };
  
  const { response, data } = await runner.fetch('/api/projects', {
    method: 'POST',
    body: JSON.stringify(project),
  });
  
  runner.assert(response.status === 200, `Expected 200, got ${response.status}`);
  runner.assert(data?.success === true, 'Expected success=true');
  runner.assert(data?.data?.title === project.title, 'Title should match');
  runner.assert(data?.data?.id, 'Should have generated ID');
  
  // Store for cleanup
  runner.createdProjectId = data.data.id;
});

runner.test('GET /api/projects/:id returns project', async () => {
  // First create a project
  const project = {
    title: 'Get Test ' + Date.now(),
    status: 'backlog',
    priority: 'medium',
  };
  
  const { data: createData } = await runner.fetch('/api/projects', {
    method: 'POST',
    body: JSON.stringify(project),
  });
  
  const id = createData.data.id;
  
  const { response, data } = await runner.fetch(`/api/projects/${id}`);
  runner.assert(response.status === 200, `Expected 200, got ${response.status}`);
  runner.assert(data?.data?.id === id, 'ID should match');
  
  // Cleanup
  await runner.fetch(`/api/projects/${id}`, { method: 'DELETE' });
});

runner.test('PUT /api/projects/:id updates project', async () => {
  // Create
  const { data: createData } = await runner.fetch('/api/projects', {
    method: 'POST',
    body: JSON.stringify({ title: 'Update Test', status: 'backlog', priority: 'low' }),
  });
  
  const id = createData.data.id;
  
  // Update
  const { response, data } = await runner.fetch(`/api/projects/${id}`, {
    method: 'PUT',
    body: JSON.stringify({ title: 'Updated Title', status: 'in_progress' }),
  });
  
  runner.assert(response.status === 200, `Expected 200, got ${response.status}`);
  runner.assert(data?.data?.title === 'Updated Title', 'Title should be updated');
  runner.assert(data?.data?.status === 'in_progress', 'Status should be updated');
  
  // Cleanup
  await runner.fetch(`/api/projects/${id}`, { method: 'DELETE' });
});

runner.test('PATCH /api/projects/:id/status updates status', async () => {
  // Create
  const { data: createData } = await runner.fetch('/api/projects', {
    method: 'POST',
    body: JSON.stringify({ title: 'Status Test', status: 'backlog', priority: 'medium' }),
  });
  
  const id = createData.data.id;
  
  // Update status
  const { response, data } = await runner.fetch(`/api/projects/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status: 'done' }),
  });
  
  runner.assert(response.status === 200, `Expected 200, got ${response.status}`);
  runner.assert(data?.data?.status === 'done', 'Status should be done');
  
  // Cleanup
  await runner.fetch(`/api/projects/${id}`, { method: 'DELETE' });
});

runner.test('DELETE /api/projects/:id removes project', async () => {
  // Create
  const { data: createData } = await runner.fetch('/api/projects', {
    method: 'POST',
    body: JSON.stringify({ title: 'Delete Test', status: 'backlog', priority: 'low' }),
  });
  
  const id = createData.data.id;
  
  // Delete
  const { response, data } = await runner.fetch(`/api/projects/${id}`, {
    method: 'DELETE',
  });
  
  runner.assert(response.status === 200, `Expected 200, got ${response.status}`);
  runner.assert(data?.data?.deleted === true, 'Should confirm deletion');
  
  // Verify it's gone
  const { response: getResponse } = await runner.fetch(`/api/projects/${id}`);
  runner.assert(getResponse.status === 404, 'Should return 404 after deletion');
});

// Services API
runner.test('GET /api/services returns services', async () => {
  const { response, data } = await runner.fetch('/api/services');
  runner.assert(response.status === 200, `Expected 200, got ${response.status}`);
  runner.assert(data?.success === true, 'Expected success=true');
  runner.assert(Array.isArray(data?.data?.services), 'Expected services array');
  runner.assert(typeof data?.data?.summary === 'object', 'Expected summary object');
});

// Usage API
runner.test('GET /api/usage returns metrics', async () => {
  const { response, data } = await runner.fetch('/api/usage');
  runner.assert(response.status === 200, `Expected 200, got ${response.status}`);
  runner.assert(data?.success === true, 'Expected success=true');
  runner.assert(Array.isArray(data?.data?.metrics), 'Expected metrics array');
});

// Sync API
runner.test('GET /api/sync returns sync status', async () => {
  const { response, data } = await runner.fetch('/api/sync');
  runner.assert(response.status === 200, `Expected 200, got ${response.status}`);
  runner.assert(data?.success === true, 'Expected success=true');
  runner.assert(Array.isArray(data?.data?.sections), 'Expected sections array');
  runner.assert(typeof data?.data?.overall_status === 'string', 'Expected overall_status');
});

runner.test('POST /api/sync triggers universal sync', async () => {
  const { response, data } = await runner.fetch('/api/sync', {
    method: 'POST',
    body: JSON.stringify({ direction: 'bidirectional', dryRun: true }),
  });
  
  runner.assert(response.status === 200, `Expected 200, got ${response.status}`);
  runner.assert(data?.success === true, 'Expected success=true');
  runner.assert(typeof data?.data?.results === 'object', 'Expected results object');
});

runner.test('GET /api/sync/projects returns markdown', async () => {
  const { response, data } = await runner.fetch('/api/sync/projects');
  runner.assert(response.status === 200, `Expected 200, got ${response.status}`);
  runner.assert(data?.success === true, 'Expected success=true');
  runner.assert(typeof data?.data?.markdown === 'string', 'Expected markdown string');
  runner.assert(typeof data?.data?.project_count === 'number', 'Expected project_count');
});

// Error Handling
runner.test('GET /api/projects/:id returns 404 for unknown ID', async () => {
  const { response } = await runner.fetch('/api/projects/nonexistent-id-12345');
  runner.assert(response.status === 404, `Expected 404, got ${response.status}`);
});

runner.test('POST /api/projects validates required fields', async () => {
  const { response, data } = await runner.fetch('/api/projects', {
    method: 'POST',
    body: JSON.stringify({}), // Missing required title
  });
  
  runner.assert(response.status === 422, `Expected 422, got ${response.status}`);
  runner.assert(data?.success === false, 'Expected success=false');
});

// Cleanup
runner.test('Cleanup created test project', async () => {
  if (runner.createdProjectId) {
    await runner.fetch(`/api/projects/${runner.createdProjectId}`, {
      method: 'DELETE',
    });
  }
});

// Run tests
runner.run().catch(console.error);
```

---

## cURL Commands

### Health Check
```bash
# Check API health
curl -X GET http://localhost:8787/health | jq
```

### Projects
```bash
# List all projects
curl -X GET http://localhost:8787/api/projects | jq

# Create a new project
curl -X POST http://localhost:8787/api/projects \
  -H "Content-Type: application/json" \
  -d '{
    "title": "New Project",
    "description": "Project description",
    "status": "backlog",
    "priority": "high"
  }' | jq

# Get a specific project (replace :id)
curl -X GET http://localhost:8787/api/projects/:id | jq

# Update a project
curl -X PUT http://localhost:8787/api/projects/:id \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Updated Title",
    "status": "in_progress"
  }' | jq

# Quick status update
curl -X PATCH http://localhost:8787/api/projects/:id/status \
  -H "Content-Type: application/json" \
  -d '{"status": "done"}' | jq

# Delete a project
curl -X DELETE http://localhost:8787/api/projects/:id | jq
```

### Services
```bash
# List all services
curl -X GET http://localhost:8787/api/services | jq

# Get specific service
curl -X GET http://localhost:8787/api/services/google_calendar | jq

# Refresh all services
curl -X POST http://localhost:8787/api/services | jq

# Refresh specific service
curl -X POST http://localhost:8787/api/services/google_calendar/refresh | jq
```

### Usage & Limits
```bash
# List all usage metrics
curl -X GET http://localhost:8787/api/usage | jq

# Get specific category
curl -X GET http://localhost:8787/api/usage/llm_tokens | jq

# Sync usage data
curl -X POST http://localhost:8787/api/usage | jq

# Sync specific category
curl -X POST http://localhost:8787/api/usage/llm_tokens/sync | jq
```

### Sync (Bidirectional)
```bash
# Get sync status for all sections
curl -X GET http://localhost:8787/api/sync | jq

# Universal Update - Sync all sections
curl -X POST http://localhost:8787/api/sync \
  -H "Content-Type: application/json" \
  -d '{
    "direction": "bidirectional",
    "dryRun": false,
    "conflictResolution": "prefer_d1"
  }' | jq

# Get projects as markdown
curl -X GET http://localhost:8787/api/sync/projects | jq

# Sync projects with provided markdown content
curl -X POST http://localhost:8787/api/sync/projects \
  -H "Content-Type: application/json" \
  -d '{
    "content": "# Projects\n\n### Test Project\n**Status:** 📅 Backlog\n**Priority:** High\n\n**Description:**\nTest project from API\n",
    "direction": "to_d1",
    "dryRun": false
  }' | jq

# Get specific section content
curl -X GET http://localhost:8787/api/sync/protocols | jq

# Sync specific section
curl -X POST http://localhost:8787/api/sync/protocols | jq
```

### CORS Preflight
```bash
# Test CORS preflight
curl -X OPTIONS http://localhost:8787/api/projects \
  -H "Origin: http://localhost:3000" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: Content-Type" \
  -v
```

---

## Troubleshooting

### Common Issues

#### 1. Database Connection Errors
```
Error: D1 database not found
```
**Solution:**
```bash
# Verify wrangler.toml has correct database binding
[[d1_databases]]
binding = "DB"
database_name = "nexus-phase2"
database_id = "your-database-id"

# Run migrations
wrangler d1 migrations apply nexus-phase2
```

#### 2. CORS Errors in Browser
```
Access to fetch at 'http://localhost:8787/api/projects' from origin 
'http://localhost:3000' has been blocked by CORS policy
```
**Solution:**
- Verify `CORS_ORIGIN` environment variable is set correctly
- For development, set `CORS_ORIGIN = "*"` in wrangler.toml
- For production, set to your actual domain

#### 3. TypeScript Build Errors
```
error TS2345: Argument of type '...' is not assignable to parameter of type '...'
```
**Solution:**
```bash
# Rebuild TypeScript
cd nexus-phase2
npx tsc --noEmit

# Check for missing types
npm install --save-dev @cloudflare/workers-types
```

#### 4. Sync Failures
```
Sync failed: Failed to parse markdown
```
**Solution:**
- Verify PROJECTS.md format matches expected structure
- Check for malformed headers (###, ##)
- Ensure status/priority fields use valid values
- Review sync logs in D1 `sync_state` table

#### 5. Missing Environment Variables
```
Error: ENVIRONMENT not defined
```
**Solution:**
```bash
# Create .dev.vars for local development
echo 'ENVIRONMENT=development' > .dev.vars
echo 'API_VERSION=1.0.0' >> .dev.vars
echo 'CORS_ORIGIN=*' >> .dev.vars

# For production, set in Cloudflare dashboard
wrangler secret put ENVIRONMENT
wrangler secret put CORS_ORIGIN
```

### Debug Mode

Enable verbose logging:
```typescript
// In src/index.ts, add to the fetch handler
console.log(`[${new Date().toISOString()}] ${request.method} ${pathname}`);
```

### Check Database State

```bash
# Query projects
wrangler d1 execute nexus-phase2 --command="SELECT * FROM projects"

# Check sync state
wrangler d1 execute nexus-phase2 --command="SELECT * FROM sync_state"

# Check services
wrangler d1 execute nexus-phase2 --command="SELECT * FROM services"
```

### Reset Database

**WARNING: This will delete all data!**
```bash
# Run down migration
wrangler d1 migrations apply nexus-phase2 --local

# Or recreate database
wrangler d1 create nexus-phase2-new
# Update wrangler.toml with new database_id
wrangler d1 migrations apply nexus-phase2-new
```

### Testing Specific Endpoints

```bash
# Test with verbose output
curl -v http://localhost:8787/health

# Test with timing
curl -w "@curl-format.txt" http://localhost:8787/api/projects

# curl-format.txt:
# time_namelookup:  %{time_namelookup}\n
# time_connect:  %{time_connect}\n
# time_appconnect:  %{time_appconnect}\n#
 time_pretransfer:  %{time_pretransfer}\n
# time_redirect:  %{time_redirect}\n
# time_starttransfer:  %{time_starttransfer}\n
# time_total:  %{time_total}\n
```

### Performance Monitoring

```bash
# Run load test
ab -n 1000 -c 10 http://localhost:8787/api/projects

# Or use wrk
wrk -t12 -c400 -d30s http://localhost:8787/health
```

### Getting Help

1. Check Cloudflare Workers logs:
   ```bash
   wrangler tail
   ```

2. Enable debug mode in wrangler:
   ```bash
   wrangler dev --log-level debug
   ```

3. Check D1 query logs:
   ```bash
   wrangler d1 execute nexus-phase2 --command="SELECT * FROM sqlite_master"
   ```

4. Review deployment logs:
   ```bash
   wrangler deploy --dry-run
   ```
