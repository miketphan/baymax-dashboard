# Nexus Phase 2 API

Cloudflare Workers + D1 backend for the Nexus dashboard.

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Create D1 Database

```bash
npx wrangler d1 create nexus-production
```

This will output a database ID. Copy it and update `wrangler.toml`:

```toml
[[d1_databases]]
binding = "DB"
database_name = "nexus-production"
database_id = "your-database-id-here"
```

### 3. Apply Migrations

```bash
npx wrangler d1 migrations apply nexus-production
```

Or seed directly:

```bash
npx wrangler d1 execute nexus-production --file=./schema.sql
```

### 4. Run Locally

```bash
npm run dev
```

### 5. Deploy

```bash
npm run deploy
```

## API Endpoints

### Health Check
- `GET /health` - Check API and database health

### Projects
- `GET /api/projects` - List all projects
- `GET /api/projects/:id` - Get a single project
- `POST /api/projects` - Create a new project
- `PUT /api/projects/:id` - Update a project
- `PATCH /api/projects/:id/status` - Quick status update
- `DELETE /api/projects/:id` - Delete a project

### Services
- `GET /api/services` - List all services
- `GET /api/services/:id` - Get a single service
- `POST /api/services/:id/refresh` - Trigger service check
- `POST /api/services` - Refresh all services

### Usage & Limits
- `GET /api/usage` - Get all usage metrics
- `GET /api/usage/:category` - Get specific category
- `POST /api/usage/:category/sync` - Sync usage data
- `POST /api/usage` - Sync all usage data

## Example Requests

### Create a Project

```bash
curl -X POST http://localhost:8787/api/projects \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Build Nexus API",
    "description": "Cloudflare Workers + D1 backend",
    "status": "in_progress",
    "priority": "high"
  }'
```

### Update Project Status

```bash
curl -X PATCH http://localhost:8787/api/projects/proj_abc123/status \
  -H "Content-Type: application/json" \
  -d '{"status": "done"}'
```

### Get Services

```bash
curl http://localhost:8787/api/services
```

### Refresh Service

```bash
curl -X POST http://localhost:8787/api/services/google_calendar/refresh
```

### Get Usage Metrics

```bash
curl http://localhost:8787/api/usage
```

## Project Structure

```
nexus-phase2/
├── wrangler.toml           # Cloudflare Workers config
├── package.json            # Dependencies and scripts
├── tsconfig.json           # TypeScript config
├── schema.sql              # Full schema with seed data
├── migrations/
│   └── 001_initial.sql     # Migration file
└── src/
    ├── index.ts            # Main entry point
    ├── types/
    │   └── index.ts        # TypeScript types
    ├── lib/
    │   ├── db.ts           # Database queries
    │   └── utils.ts        # Utility functions
    └── routes/
        ├── projects.ts     # Projects API
        ├── services.ts     # Services API
        └── usage.ts        # Usage & Limits API
```

## Database Schema

### projects
- Core project management table for Kanban board
- Supports: backlog, in_progress, done, archived

### services
- Connected services status monitoring
- Tracks: google_calendar, auto_backups, health_monitor, system_updates, security_audit

### usage_limits
- Usage tracking for: llm_tokens, brave_search, api_calls
- Supports cost estimates and threshold warnings

### sync_state
- Tracks last sync times for bidirectional sync with markdown files

## Environment Variables

Set in `wrangler.toml`:

- `ENVIRONMENT` - production, staging, or development
- `API_VERSION` - API version string
- `CORS_ORIGIN` - Allowed CORS origin

## Development Notes

- The API uses D1's SQLite dialect
- All timestamps are ISO 8601 format
- JSON fields are stored as strings and parsed on retrieval
- Auto-incrementing triggers maintain `updated_at` timestamps
