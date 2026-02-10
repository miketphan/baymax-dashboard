# Nexus Phase 2 - Deployment Checklist

Use this checklist when deploying Nexus Phase 2 to production.

---

## Pre-Deployment

### 1. Prerequisites

- [ ] Node.js 18+ installed
- [ ] Cloudflare account with Workers enabled
- [ ] Wrangler CLI authenticated (`wrangler login`)
- [ ] D1 database created
- [ ] Database ID copied to `wrangler.toml`

### 2. Environment Setup

- [ ] `wrangler.toml` configured with:
  - [ ] `name` - Worker name
  - [ ] `database_id` - D1 database ID
  - [ ] `compatibility_date` - Set to recent date
  - [ ] `[vars]` section with production values
  - [ ] Environment-specific overrides (staging, production)

- [ ] Environment variables set:
  ```toml
  [vars]
  ENVIRONMENT = "production"
  API_VERSION = "v1"
  CORS_ORIGIN = "https://yourdomain.com"
  ```

- [ ] Secrets configured (if any):
  ```bash
  wrangler secret put API_KEY
  wrangler secret put WEBHOOK_SECRET
  ```

### 3. Dependencies

- [ ] Run `npm install` to install dependencies
- [ ] No vulnerable packages (`npm audit`)
- [ ] Lock file (`package-lock.json`) committed

### 4. Code Quality

- [ ] TypeScript compiles without errors (`npx tsc --noEmit`)
- [ ] No `console.log` statements in production code (or use proper logging)
- [ ] All TODO/FIXME comments resolved or documented
- [ ] Error handling in place for all async operations

### 5. Database

- [ ] Migrations applied:
  ```bash
  wrangler d1 migrations apply nexus-production
  ```
- [ ] Seed data verified:
  ```bash
  wrangler d1 execute nexus-production --command="SELECT COUNT(*) FROM services"
  wrangler d1 execute nexus-production --command="SELECT COUNT(*) FROM usage_limits"
  wrangler d1 execute nexus-production --command="SELECT COUNT(*) FROM sync_state"
  ```
- [ ] Indexes created (verify performance)
- [ ] Triggers functioning (auto-updated timestamps)

### 6. Testing

- [ ] Local development server runs (`npm run dev`)
- [ ] All API tests pass:
  ```bash
  ./tests/curl-tests.sh
  ```
- [ ] Pre-deployment validation passes:
  ```bash
  ./scripts/validate-deployment.sh
  ```
- [ ] CORS headers verified for production domain
- [ ] Error responses tested

---

## Deployment

### 1. Deploy Worker

```bash
# Deploy to Cloudflare Workers
npm run deploy

# Or with wrangler directly
wrangler deploy
```

### 2. Verify Deployment

- [ ] Worker responds to health check:
  ```bash
  curl https://your-worker.your-subdomain.workers.dev/health
  ```
- [ ] Database connection working
- [ ] No errors in Cloudflare dashboard

### 3. Database Verification

- [ ] Query projects table:
  ```bash
  wrangler d1 execute nexus-production --command="SELECT * FROM projects LIMIT 5"
  ```
- [ ] Verify services are seeded
- [ ] Verify usage_limits are seeded
- [ ] Verify sync_state is initialized

### 4. API Endpoints Test

Test all critical endpoints:

```bash
# Health check
curl https://your-worker.workers.dev/health

# Projects
curl https://your-worker.workers.dev/api/projects

# Services
curl https://your-worker.workers.dev/api/services

# Usage
curl https://your-worker.workers.dev/api/usage

# Sync status
curl https://your-worker.workers.dev/api/sync
```

### 5. Frontend Integration

- [ ] Frontend deployed (if applicable)
- [ ] API URL configured in frontend
- [ ] CORS origin set to frontend domain
- [ ] Frontend can reach API
- [ ] Authentication working (if implemented)

---

## Post-Deployment

### 1. Monitoring Setup

- [ ] Cloudflare Analytics enabled
- [ ] Error tracking configured (Sentry, etc.)
- [ ] Logpush configured (optional)
- [ ] Alerts set up for:
  - [ ] High error rates
  - [ ] Database connection failures
  - [ ] Rate limiting

### 2. Backup Strategy

- [ ] D1 database backups configured
- [ ] Export process documented
- [ ] Recovery procedure tested

### 3. Documentation

- [ ] API documentation updated
- [ ] Environment variables documented
- [ ] Runbook created for common issues

### 4. Security Review

- [ ] CORS origins restricted to production domains
- [ ] No sensitive data in logs
- [ ] Rate limiting enabled
- [ ] API keys/secrets rotated

---

## Rollback Procedure

If deployment fails:

1. **Identify the issue:**
   ```bash
   wrangler tail
   ```

2. **Revert to previous version:**
   ```bash
   git checkout <previous-commit>
   npm run deploy
   ```

3. **Or redeploy previous worker version:**
   - Go to Cloudflare Dashboard
   - Navigate to Workers & Pages
   - Find your worker
   - Rollback to previous deployment

4. **Verify rollback:**
   ```bash
   curl https://your-worker.workers.dev/health
   ```

---

## Environment Variables Reference

### Required

| Variable | Description | Example |
|----------|-------------|---------|
| `ENVIRONMENT` | Deployment environment | `production` |
| `API_VERSION` | API version string | `v1` |
| `CORS_ORIGIN` | Allowed CORS origin | `https://example.com` |

### Optional

| Variable | Description | Default |
|----------|-------------|---------|
| `MARKDOWN_BASE_URL` | Base URL for markdown files | - |
| `SENTRY_DSN` | Error tracking DSN | - |
| `LOG_LEVEL` | Logging level | `info` |

---

## Common Deployment Issues

### Issue: Database connection fails

**Solution:**
1. Verify `database_id` in `wrangler.toml`
2. Check database exists: `wrangler d1 list`
3. Verify migrations applied: `wrangler d1 migrations list nexus-production`

### Issue: CORS errors

**Solution:**
1. Check `CORS_ORIGIN` in `wrangler.toml`
2. Verify it matches your frontend domain
3. Test with browser dev tools

### Issue: TypeScript build errors

**Solution:**
1. Run `npx tsc --noEmit` locally
2. Fix all type errors
3. Ensure `@cloudflare/workers-types` is installed

### Issue: Worker timeout

**Solution:**
1. Check for infinite loops in code
2. Optimize database queries
3. Add caching for expensive operations
4. Consider splitting large operations

---

## Deployment Verification Commands

```bash
# Full test suite
API_URL=https://your-worker.workers.dev ./tests/curl-tests.sh

# Database connectivity
wrangler d1 execute nexus-production --command="SELECT 1"

# Worker logs
wrangler tail

# Worker status
wrangler status
```

---

## Sign-off

| Role | Name | Date | Signature |
|------|------|------|-----------|
| Developer | | | |
| QA Tester | | | |
| DevOps | | | |
| Product Owner | | | |

---

**Deployment Date:** _______________

**Deployed Version:** _______________

**Notes:**
