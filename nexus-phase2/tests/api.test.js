// Nexus Phase 2 - API Test Suite
// Run with: node tests/api.test.js
// Or: API_URL=http://localhost:8787 node tests/api.test.js

const BASE_URL = process.env.API_URL || 'http://localhost:8787';

class TestRunner {
  constructor() {
    this.tests = [];
    this.passed = 0;
    this.failed = 0;
    this.createdProjectIds = [];
  }

  test(name, fn) {
    this.tests.push({ name, fn });
  }

  async run() {
    console.log('\n🧪 Nexus Phase 2 - API Tests\n');
    console.log('='.repeat(50));

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

    console.log('='.repeat(50));
    console.log(`\nResults: ${this.passed} passed, ${this.failed} failed\n`);
    
    // Cleanup
    await this.cleanup();
    
    process.exit(this.failed > 0 ? 1 : 0);
  }

  assert(condition, message) {
    if (!condition) {
      throw new Error(message || 'Assertion failed');
    }
  }

  async fetch(path, options = {}) {
    const url = `${BASE_URL}${path}`;
    const response = await fetch(url, {
      headers: { 'Content-Type': 'application/json', ...options.headers },
      ...options,
    });
    
    let data = null;
    try {
      data = await response.json();
    } catch {
      // Not JSON response
    }
    
    return { response, data };
  }

  async cleanup() {
    console.log('🧹 Cleaning up test data...\n');
    for (const id of this.createdProjectIds) {
      try {
        await this.fetch(`/api/projects/${id}`, { method: 'DELETE' });
      } catch (error) {
        console.log(`   Warning: Failed to cleanup project ${id}`);
      }
    }
  }
}

const runner = new TestRunner();

// ============================================
// Health Check
// ============================================
runner.test('GET /health returns healthy status', async () => {
  const { response, data } = await runner.fetch('/health');
  runner.assert(response.status === 200, `Expected 200, got ${response.status}`);
  runner.assert(data?.status === 'healthy', 'Expected healthy status');
  runner.assert(data?.checks?.database === true, 'Database should be healthy');
});

// ============================================
// Projects API
// ============================================
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

  // Track for cleanup
  runner.createdProjectIds.push(data.data.id);
});

runner.test('GET /api/projects/:id returns project', async () => {
  // Create a project first
  const { data: createData } = await runner.fetch('/api/projects', {
    method: 'POST',
    body: JSON.stringify({
      title: 'Get Test ' + Date.now(),
      status: 'backlog',
      priority: 'medium',
    }),
  });

  const id = createData.data.id;
  runner.createdProjectIds.push(id);

  const { response, data } = await runner.fetch(`/api/projects/${id}`);
  runner.assert(response.status === 200, `Expected 200, got ${response.status}`);
  runner.assert(data?.data?.id === id, 'ID should match');
});

runner.test('PUT /api/projects/:id updates project', async () => {
  // Create
  const { data: createData } = await runner.fetch('/api/projects', {
    method: 'POST',
    body: JSON.stringify({
      title: 'Update Test',
      status: 'backlog',
      priority: 'low',
    }),
  });

  const id = createData.data.id;
  runner.createdProjectIds.push(id);

  // Update
  const { response, data } = await runner.fetch(`/api/projects/${id}`, {
    method: 'PUT',
    body: JSON.stringify({ title: 'Updated Title', status: 'in_progress' }),
  });

  runner.assert(response.status === 200, `Expected 200, got ${response.status}`);
  runner.assert(data?.data?.title === 'Updated Title', 'Title should be updated');
  runner.assert(data?.data?.status === 'in_progress', 'Status should be updated');
});

runner.test('PATCH /api/projects/:id/status updates status', async () => {
  // Create
  const { data: createData } = await runner.fetch('/api/projects', {
    method: 'POST',
    body: JSON.stringify({
      title: 'Status Test',
      status: 'backlog',
      priority: 'medium',
    }),
  });

  const id = createData.data.id;
  runner.createdProjectIds.push(id);

  // Update status
  const { response, data } = await runner.fetch(`/api/projects/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status: 'done' }),
  });

  runner.assert(response.status === 200, `Expected 200, got ${response.status}`);
  runner.assert(data?.data?.status === 'done', 'Status should be done');
});

runner.test('DELETE /api/projects/:id removes project', async () => {
  // Create
  const { data: createData } = await runner.fetch('/api/projects', {
    method: 'POST',
    body: JSON.stringify({
      title: 'Delete Test',
      status: 'backlog',
      priority: 'low',
    }),
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

// ============================================
// Services API
// ============================================
runner.test('GET /api/services returns services', async () => {
  const { response, data } = await runner.fetch('/api/services');
  runner.assert(response.status === 200, `Expected 200, got ${response.status}`);
  runner.assert(data?.success === true, 'Expected success=true');
  runner.assert(Array.isArray(data?.data?.services), 'Expected services array');
  runner.assert(typeof data?.data?.summary === 'object', 'Expected summary object');
});

runner.test('GET /api/services/:id returns specific service', async () => {
  const { response, data } = await runner.fetch('/api/services/google_calendar');
  runner.assert(response.status === 200, `Expected 200, got ${response.status}`);
  runner.assert(data?.data?.id === 'google_calendar', 'Should return google_calendar service');
});

// ============================================
// Usage API
// ============================================
runner.test('GET /api/usage returns metrics', async () => {
  const { response, data } = await runner.fetch('/api/usage');
  runner.assert(response.status === 200, `Expected 200, got ${response.status}`);
  runner.assert(data?.success === true, 'Expected success=true');
  runner.assert(Array.isArray(data?.data?.metrics), 'Expected metrics array');
});

runner.test('GET /api/usage/:category returns specific metric', async () => {
  const { response, data } = await runner.fetch('/api/usage/llm_tokens');
  runner.assert(response.status === 200, `Expected 200, got ${response.status}`);
  runner.assert(data?.data?.category === 'llm_tokens', 'Should return llm_tokens metric');
});

// ============================================
// Sync API
// ============================================
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

runner.test('POST /api/sync/projects accepts markdown content', async () => {
  const markdownContent = `# Projects

### API Test Project
**Status:** 🔄 In Progress
**Priority:** High

**Description:**
Test project created via API sync

**Key Deliverables:**
- Test feature 1
- Test feature 2
`;

  const { response, data } = await runner.fetch('/api/sync/projects', {
    method: 'POST',
    body: JSON.stringify({
      content: markdownContent,
      direction: 'to_d1',
      dryRun: true,
    }),
  });

  runner.assert(response.status === 200, `Expected 200, got ${response.status}`);
  runner.assert(data?.success === true, 'Expected success=true');
  runner.assert(typeof data?.data?.summary === 'object', 'Expected summary');
});

runner.test('GET /api/sync/:section returns section content', async () => {
  const { response, data } = await runner.fetch('/api/sync/protocols');
  runner.assert(response.status === 200, `Expected 200, got ${response.status}`);
  runner.assert(data?.success === true, 'Expected success=true');
  runner.assert(data?.data?.section === 'protocols', 'Should return protocols section');
});

// ============================================
// Error Handling
// ============================================
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

runner.test('PUT /api/projects/:id returns 404 for unknown ID', async () => {
  const { response } = await runner.fetch('/api/projects/nonexistent-id-12345', {
    method: 'PUT',
    body: JSON.stringify({ title: 'Test' }),
  });

  runner.assert(response.status === 404, `Expected 404, got ${response.status}`);
});

runner.test('GET /api/usage/:category returns 404 for unknown category', async () => {
  const { response } = await runner.fetch('/api/usage/unknown_category');
  runner.assert(response.status === 404, `Expected 404, got ${response.status}`);
});

runner.test('Invalid JSON returns 400', async () => {
  const { response } = await runner.fetch('/api/projects', {
    method: 'POST',
    body: 'not valid json',
    headers: { 'Content-Type': 'application/json' },
  });

  runner.assert(response.status === 400, `Expected 400, got ${response.status}`);
});

// ============================================
// CORS Tests
// ============================================
runner.test('OPTIONS request returns CORS headers', async () => {
  const response = await fetch(`${BASE_URL}/api/projects`, {
    method: 'OPTIONS',
    headers: {
      'Origin': 'http://localhost:3000',
      'Access-Control-Request-Method': 'POST',
    },
  });

  runner.assert(response.status === 204, `Expected 204, got ${response.status}`);
  runner.assert(response.headers.get('access-control-allow-origin'), 'Should have CORS origin header');
  runner.assert(response.headers.get('access-control-allow-methods'), 'Should have CORS methods header');
});

// ============================================
// Run tests
// ============================================
runner.run().catch((error) => {
  console.error('Test runner failed:', error);
  process.exit(1);
});
