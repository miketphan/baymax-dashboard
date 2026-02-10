# Nexus Phase 2 - Mike Action Items

> Steps that require your Cloudflare account, credentials, or human interaction
> Last Updated: 2026-02-10

---

## Required Actions (No Workaround)

### 1. Create D1 Database
**Command:**
```bash
cd nexus-phase2
npx wrangler d1 create nexus-production
```

**What it does:** Creates the D1 database in your Cloudflare account  
**Why I can't do it:** Requires Cloudflare authentication (your credentials)

**Output you'll see:**
```
✅ Successfully created DB 'nexus-production' with ID: <uuid-here>
```

---

### 2. Update wrangler.toml
**File:** `nexus-phase2/wrangler.toml`

**Replace this line:**
```toml
database_id = "<your-database-id-here>"
```

**With your actual database ID from step 1**

**Why I can't do it:** I don't know the UUID until you create it

---

### 3. Run Database Migrations
**Command:**
```bash
npx wrangler d1 execute nexus-production --file=./schema.sql
```

**What it does:** Creates all tables and seed data  
**Why I can't do it:** Requires authenticated access to your D1 database

---

### 4. Deploy to Cloudflare
**Command:**
```bash
npm run deploy
```

**What it does:** Deploys the Workers API to production  
**Why I can't do it:** Requires your Cloudflare account auth

---

### 5. Update Dashboard Config (Optional for Local Testing)
**File:** `nexus-phase2/dashboard/src/lib/api.ts`

If you want to test locally first, update:
```typescript
const API_BASE = 'http://localhost:8787'; // for local
// or
const API_BASE = 'https://nexus-api.your-subdomain.workers.dev'; // for prod
```

---

## Quick Reference: Full Setup Sequence

```bash
# 1. Navigate to project
cd nexus-phase2

# 2. Install dependencies
npm install

# 3. Create D1 database (you do this)
npx wrangler d1 create nexus-production
# Copy the database ID from output

# 4. Update wrangler.toml with your database ID
# (Edit file: database_id = "your-uuid-here")

# 5. Run migrations
npx wrangler d1 execute nexus-production --file=./schema.sql

# 6. Deploy API
npm run deploy

# 7. Test health endpoint
curl https://nexus-api.your-subdomain.workers.dev/health
```

---

## Testing Without Deploy (Local)

If you want to test locally before deploying:

```bash
# 1. Start local dev server
npm run dev

# 2. In another terminal, run migrations against local DB
npx wrangler d1 execute nexus-production --local --file=./schema.sql

# 3. Test locally
curl http://localhost:8787/health
```

---

## What I CAN Do (No Action Needed)

✅ Write all code (schema, API, frontend)  
✅ Create file structure  
✅ Write documentation  
✅ Test logic (if you provide temporary credentials)  
✅ Prepare all configs (except database_id)  

---

## What Requires YOU

❌ Create Cloudflare D1 database  
❌ Deploy to Cloudflare Workers  
❌ Run database migrations  
❌ Provide actual database IDs/API keys  

---

## Questions?

When you're back, just ask "what do I need to do?" and I'll reference this file.
