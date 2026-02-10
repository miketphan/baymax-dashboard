# Nexus Phase 2 - API Documentation

Complete API reference for the Nexus Phase 2 backend.

**Base URL:** `https://your-worker.your-subdomain.workers.dev`

**Authentication:** Currently no authentication required (add Cloudflare Access or API keys for production).

---

## Table of Contents

1. [Response Format](#response-format)
2. [Health Check](#health-check)
3. [Projects API](#projects-api)
4. [Services API](#services-api)
5. [Usage & Limits API](#usage--limits-api)
6. [Sync API](#sync-api)
7. [Notifications API](#notifications-api)
8. [Sync Health API](#sync-health-api)
9. [Error Codes](#error-codes)
10. [Rate Limits](#rate-limits)

---

## Response Format

All API responses follow a consistent format:

### Success Response

```json
{
  "success": true,
  "data": { ... },
  "meta": {
    "timestamp": "2026-02-10T12:00:00.000Z",
    "requestId": "optional-request-id"
  }
}
```

### Error Response

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "details": { ... }
  },
  "meta": {
    "timestamp": "2026-02-10T12:00:00.000Z"
  }
}
```

---

## Health Check

### GET /health

Check the health status of the API and database connection.

**Response:**

```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "version": "v1",
    "environment": "production",
    "timestamp": "2026-02-10T12:00:00.000Z",
    "checks": {
      "database": true
    }
  },
  "meta": {
    "timestamp": "2026-02-10T12:00:00.000Z"
  }
}
```

**Status Codes:**
- `200` - API is healthy
- `503` - API is unhealthy (database connection failed)

---

## Projects API

### GET /api/projects

List all projects.

**Query Parameters:**
- None

**Response:**

```json
{
  "success": true,
  "data": {
    "projects": [
      {
        "id": "proj_abc123",
        "title": "Build Nexus API",
        "description": "Cloudflare Workers + D1 backend",
        "status": "in_progress",
        "priority": "high",
        "sort_order": 1,
        "created_at": "2026-02-10T10:00:00.000Z",
        "updated_at": "2026-02-10T11:00:00.000Z",
        "metadata": {
          "tags": ["backend", "api"],
          "linkedTasks": ["task_123"]
        }
      }
    ]
  }
}
```

**Status Codes:**
- `200` - Success

---

### GET /api/projects/:id

Get a single project by ID.

**Path Parameters:**
- `id` (string, required) - Project ID

**Response:**

```json
{
  "success": true,
  "data": {
    "id": "proj_abc123",
    "title": "Build Nexus API",
    "description": "Cloudflare Workers + D1 backend",
    "status": "in_progress",
    "priority": "high",
    "sort_order": 1,
    "created_at": "2026-02-10T10:00:00.000Z",
    "updated_at": "2026-02-10T11:00:00.000Z",
    "metadata": {
      "tags": ["backend", "api"]
    }
  }
}
```

**Status Codes:**
- `200` - Success
- `404` - Project not found

---

### POST /api/projects

Create a new project.

**Request Body:**

```json
{
  "title": "New Project",
  "description": "Optional description",
  "status": "backlog",
  "priority": "medium",
  "sort_order": 0,
  "metadata": {
    "tags": ["tag1", "tag2"]
  }
}
```

**Field Descriptions:**

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `title` | string | Yes | - | Project title (max 200 chars) |
| `description` | string | No | - | Project description |
| `status` | string | No | `backlog` | One of: `backlog`, `in_progress`, `done`, `archived` |
| `priority` | string | No | `medium` | One of: `low`, `medium`, `high` |
| `sort_order` | number | No | 0 | Sort position within status column |
| `metadata` | object | No | - | Arbitrary metadata object |

**Response:**

```json
{
  "success": true,
  "data": {
    "id": "proj_def456",
    "title": "New Project",
    "description": "Optional description",
    "status": "backlog",
    "priority": "medium",
    "sort_order": 0,
    "created_at": "2026-02-10T12:00:00.000Z",
    "updated_at": "2026-02-10T12:00:00.000Z",
    "metadata": {
      "tags": ["tag1", "tag2"]
    }
  }
}
```

**Status Codes:**
- `200` - Created successfully
- `400` - Invalid JSON
- `422` - Validation error (missing title, invalid status/priority)

---

### PUT /api/projects/:id

Update an existing project.

**Path Parameters:**
- `id` (string, required) - Project ID

**Request Body:**

```json
{
  "title": "Updated Title",
  "description": "Updated description",
  "status": "in_progress",
  "priority": "high",
  "sort_order": 5,
  "metadata": {
    "tags": ["updated"]
  }
}
```

**Notes:**
- Only include fields you want to update
- All fields are optional

**Response:**

```json
{
  "success": true,
  "data": {
    "id": "proj_def456",
    "title": "Updated Title",
    "description": "Updated description",
    "status": "in_progress",
    "priority": "high",
    "sort_order": 5,
    "created_at": "2026-02-10T12:00:00.000Z",
    "updated_at": "2026-02-10T13:00:00.000Z",
    "metadata": {
      "tags": ["updated"]
    }
  }
}
```

**Status Codes:**
- `200` - Updated successfully
- `400` - Invalid JSON
- `404` - Project not found
- `422` - Validation error

---

### PATCH /api/projects/:id/status

Quick status update for a project.

**Path Parameters:**
- `id` (string, required) - Project ID

**Request Body:**

```json
{
  "status": "done"
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "id": "proj_def456",
    "title": "Updated Title",
    "status": "done",
    ...
  }
}
```

**Status Codes:**
- `200` - Updated successfully
- `400` - Invalid JSON
- `404` - Project not found
- `422` - Invalid status value

---

### DELETE /api/projects/:id

Delete a project.

**Path Parameters:**
- `id` (string, required) - Project ID

**Response:**

```json
{
  "success": true,
  "data": {
    "deleted": true,
    "id": "proj_def456"
  }
}
```

**Status Codes:**
- `200` - Deleted successfully
- `404` - Project not found

---

## Services API

### GET /api/services

List all connected services with status summary.

**Response:**

```json
{
  "success": true,
  "data": {
    "services": [
      {
        "id": "google_calendar",
        "name": "google_calendar",
        "display_name": "📅 Google Calendar",
        "status": "online",
        "last_check": "2026-02-10T11:55:00.000Z",
        "next_check": "2026-02-10T12:00:00.000Z",
        "check_interval_minutes": 5,
        "details": {
          "next_event": "Team Sync at 4:00 PM",
          "events_today": 3,
          "oauth_status": "connected"
        },
        "created_at": "2026-02-10T10:00:00.000Z",
        "updated_at": "2026-02-10T11:55:00.000Z"
      }
    ],
    "summary": {
      "online": 4,
      "attention": 1,
      "offline": 0
    }
  }
}
```

**Status Codes:**
- `200` - Success

---

### GET /api/services/:id

Get a specific service by ID.

**Path Parameters:**
- `id` (string, required) - Service ID (e.g., `google_calendar`, `auto_backups`)

**Response:**

```json
{
  "success": true,
  "data": {
    "id": "google_calendar",
    "name": "google_calendar",
    "display_name": "📅 Google Calendar",
    "status": "online",
    "last_check": "2026-02-10T11:55:00.000Z",
    "next_check": "2026-02-10T12:00:00.000Z",
    "check_interval_minutes": 5,
    "details": {
      "next_event": "Team Sync at 4:00 PM",
      "events_today": 3,
      "oauth_status": "connected"
    },
    "created_at": "2026-02-10T10:00:00.000Z",
    "updated_at": "2026-02-10T11:55:00.000Z"
  }
}
```

**Status Codes:**
- `200` - Success
- `404` - Service not found

---

### POST /api/services

Refresh all services.

**Response:**

```json
{
  "success": true,
  "data": {
    "services": [ ... ],
    "summary": {
      "online": 5,
      "attention": 0,
      "offline": 0
    },
    "refreshed_at": "2026-02-10T12:00:00.000Z"
  }
}
```

**Status Codes:**
- `200` - Success

---

### POST /api/services/:id/refresh

Refresh a specific service.

**Path Parameters:**
- `id` (string, required) - Service ID

**Response:**

```json
{
  "success": true,
  "data": {
    "service": { ... },
    "refreshed_at": "2026-02-10T12:00:00.000Z"
  }
}
```

**Status Codes:**
- `200` - Success
- `404` - Service not found

---

## Usage & Limits API

### GET /api/usage

Get all usage metrics.

**Response:**

```json
{
  "success": true,
  "data": {
    "metrics": [
      {
        "id": "llm_tokens_monthly",
        "category": "llm_tokens",
        "display_name": "LLM Tokens (Monthly)",
        "current_value": 45000,
        "limit_value": 100000,
        "period": "monthly",
        "unit": "tokens",
        "cost_estimate": {
          "currency": "USD",
          "current_cost": 2.25,
          "projected_cost": 5.50
        },
        "progress_percent": 45,
        "status": "normal",
        "last_updated": "2026-02-10T11:00:00.000Z",
        "metadata": {
          "threshold_warning": 70,
          "threshold_danger": 90
        }
      }
    ],
    "refreshed_at": "2026-02-10T12:00:00.000Z"
  }
}
```

**Status Codes:**
- `200` - Success

---

### GET /api/usage/:category

Get a specific usage category.

**Path Parameters:**
- `category` (string, required) - Category name (`llm_tokens`, `brave_search`, `api_calls`, `llm_tokens_session`)

**Response:**

```json
{
  "success": true,
  "data": {
    "id": "llm_tokens_monthly",
    "category": "llm_tokens",
    "display_name": "LLM Tokens (Monthly)",
    "current_value": 45000,
    "limit_value": 100000,
    "period": "monthly",
    "unit": "tokens",
    "progress_percent": 45,
    "status": "normal",
    "last_updated": "2026-02-10T11:00:00.000Z"
  }
}
```

**Status Codes:**
- `200` - Success
- `404` - Category not found

---

### POST /api/usage

Sync all usage metrics.

**Response:**

```json
{
  "success": true,
  "data": {
    "metrics": [ ... ],
    "synced_at": "2026-02-10T12:00:00.000Z"
  }
}
```

**Status Codes:**
- `200` - Success

---

### POST /api/usage/:category/sync

Sync a specific usage category.

**Path Parameters:**
- `category` (string, required) - Category name

**Response:**

```json
{
  "success": true,
  "data": {
    "metric": { ... },
    "synced_at": "2026-02-10T12:00:00.000Z"
  }
}
```

**Status Codes:**
- `200` - Success
- `404` - Category not found

---

## Sync API

### GET /api/sync

Get sync status for all sections.

**Response:**

```json
{
  "success": true,
  "data": {
    "sections": [
      {
        "section": "projects",
        "status": "fresh",
        "last_sync": "2026-02-10T11:50:00.000Z",
        "stale_after_minutes": 10,
        "stale": false,
        "error": null
      },
      {
        "section": "services",
        "status": "stale",
        "last_sync": "2026-02-10T11:30:00.000Z",
        "stale_after_minutes": 5,
        "stale": true,
        "error": null
      }
    ],
    "overall_status": "stale",
    "timestamp": "2026-02-10T12:00:00.000Z"
  }
}
```

**Status Codes:**
- `200` - Success

---

### POST /api/sync

Trigger universal sync for all sections.

**Request Body:**

```json
{
  "direction": "bidirectional",
  "dryRun": false,
  "conflictResolution": "prefer_d1"
}
```

**Field Descriptions:**

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `direction` | string | No | `bidirectional` | One of: `to_d1`, `to_file`, `bidirectional` |
| `dryRun` | boolean | No | `false` | If true, only report what would happen |
| `conflictResolution` | string | No | `prefer_d1` | One of: `prefer_d1`, `prefer_file`, `manual` |

**Response:**

```json
{
  "success": true,
  "data": {
    "success": true,
    "duration_ms": 1250,
    "results": {
      "projects": { ... },
      "services": { ... }
    },
    "timestamp": "2026-02-10T12:00:00.000Z"
  }
}
```

**Status Codes:**
- `200` - Success
- `500` - Sync failed

---

### GET /api/sync/projects

Get projects as markdown (D1 → File).

**Response:**

```json
{
  "success": true,
  "data": {
    "success": true,
    "direction": "to_file",
    "project_count": 5,
    "markdown": "# Projects\n\n### Project Name\n**Status:** 🔄 In Progress\n...",
    "message": "Generated markdown from D1."
  }
}
```

**Status Codes:**
- `200` - Success

---

### POST /api/sync/projects

Sync projects with markdown content (File → D1).

**Request Body:**

```json
{
  "content": "# Projects\n\n### New Project\n**Status:** 📅 Backlog\n**Priority:** High\n\n**Description:**\nProject description here\n",
  "direction": "to_d1",
  "dryRun": false
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "success": true,
    "direction": "to_d1",
    "summary": {
      "created": 1,
      "updated": 0,
      "deleted": 0,
      "conflicts": 0,
      "unchanged": 4
    },
    "details": {
      "created": ["proj_new123"],
      "updated": [],
      "deleted": [],
      "conflicts": []
    },
    "errors": [],
    "timestamp": "2026-02-10T12:00:00.000Z"
  }
}
```

**Status Codes:**
- `200` - Success

---

### GET /api/sync/:section

Get specific section content.

**Path Parameters:**
- `section` (string, required) - Section name: `protocols`, `processes`, `features`, `projects`

**Response:**

```json
{
  "success": true,
  "data": {
    "section": "protocols",
    "format": "markdown",
    "sync_state": {
      "section": "protocols",
      "last_sync": "2026-02-10T11:00:00.000Z",
      "stale_after_minutes": 60
    },
    "message": "Content available in source markdown file"
  }
}
```

**Status Codes:**
- `200` - Success
- `400` - Invalid section

---

### POST /api/sync/:section

Sync a specific section.

**Path Parameters:**
- `section` (string, required) - Section name

**Request Body:**

```json
{
  "content": "markdown content here...",
  "dryRun": false
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "success": true,
    "section": "protocols",
    "message": "protocols sync state updated.",
    "timestamp": "2026-02-10T12:00:00.000Z"
  }
}
```

**Status Codes:**
- `200` - Success
- `400` - Invalid section

---

## Notifications API

### GET /api/notifications

List all notifications.

**Query Parameters:**
- `unread` (boolean, optional) - Filter to unread notifications only
- `limit` (number, optional) - Maximum number of results (default: 50)

**Response:**

```json
{
  "success": true,
  "data": {
    "notifications": [
      {
        "id": "notif_abc123",
        "type": "baymax_alert",
        "title": "System Alert",
        "message": "High memory usage detected",
        "source_id": "proj_123",
        "source_type": "project",
        "status": "unread",
        "created_at": "2026-02-10T11:00:00.000Z",
        "read_at": null,
        "metadata": {}
      }
    ]
  }
}
```

**Status Codes:**
- `200` - Success

---

### GET /api/notifications/count

Get notification counts.

**Response:**

```json
{
  "success": true,
  "data": {
    "count": {
      "total": 10,
      "unread": 3
    }
  }
}
```

**Status Codes:**
- `200` - Success

---

### POST /api/notify

Create a new notification (Trigger Baymax).

**Request Body:**

```json
{
  "type": "baymax_alert",
  "title": "Alert Title",
  "message": "Alert message",
  "source_id": "proj_123",
  "source_type": "project",
  "metadata": {}
}
```

**Field Descriptions:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `type` | string | No | One of: `baymax_alert`, `system`, `project_update` (default: `baymax_alert`) |
| `title` | string | Yes | Notification title |
| `message` | string | No | Notification message |
| `source_id` | string | No | Related entity ID |
| `source_type` | string | No | Related entity type |
| `metadata` | object | No | Additional metadata |

**Response:**

```json
{
  "success": true,
  "data": {
    "success": true,
    "notification": { ... },
    "message": "Notification sent to Baymax"
  }
}
```

**Status Codes:**
- `200` - Success
- `422` - Validation error (missing title)

---

### POST /api/notify/project/:id

Create a project-specific notification.

**Path Parameters:**
- `id` (string, required) - Project ID

**Request Body:**

```json
{
  "message": "Custom project alert message"
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "success": true,
    "notification": { ... },
    "message": "Project alert sent to Baymax"
  }
}
```

**Status Codes:**
- `200` - Success

---

### PATCH /api/notifications/:id/read

Mark a notification as read.

**Path Parameters:**
- `id` (string, required) - Notification ID

**Response:**

```json
{
  "success": true,
  "data": {
    "id": "notif_abc123",
    "status": "read",
    "read_at": "2026-02-10T12:00:00.000Z",
    ...
  }
}
```

**Status Codes:**
- `200` - Success
- `404` - Notification not found

---

### POST /api/notifications/read-all

Mark all notifications as read.

**Response:**

```json
{
  "success": true,
  "data": {
    "success": true,
    "message": "All notifications marked as read"
  }
}
```

**Status Codes:**
- `200` - Success

---

### DELETE /api/notifications/:id

Delete a notification.

**Path Parameters:**
- `id` (string, required) - Notification ID

**Response:**

```json
{
  "success": true,
  "data": {
    "deleted": true,
    "id": "notif_abc123"
  }
}
```

**Status Codes:**
- `200` - Success
- `404` - Notification not found

---

## Sync Health API

### GET /api/sync/health

Get detailed staleness information for all sections.

**Response:**

```json
{
  "success": true,
  "data": {
    "sections": [
      {
        "section": "projects",
        "isStale": false,
        "lastSync": "2026-02-10T11:50:00.000Z",
        "staleAfterMinutes": 10,
        "minutesSinceSync": 5,
        "display": {
          "text": "5 minutes ago",
          "color": "#10b981",
          "icon": "✓",
          "shouldRefresh": false
        },
        "message": "5 minutes ago"
      }
    ],
    "overall_status": "fresh",
    "timestamp": "2026-02-10T12:00:00.000Z"
  }
}
```

**Status Codes:**
- `200` - Success

---

### GET /api/sync/health/:section

Get staleness for a specific section.

**Path Parameters:**
- `section` (string, required) - Section name

**Response:**

```json
{
  "success": true,
  "data": {
    "section": "projects",
    "isStale": false,
    "lastSync": "2026-02-10T11:50:00.000Z",
    "staleAfterMinutes": 10,
    "minutesSinceSync": 5,
    "display": {
      "text": "5 minutes ago",
      "color": "#10b981",
      "icon": "✓",
      "shouldRefresh": false
    },
    "message": "5 minutes ago",
    "timestamp": "2026-02-10T12:00:00.000Z"
  }
}
```

**Status Codes:**
- `200` - Success

---

## Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `NOT_FOUND` | 404 | Resource not found |
| `BAD_REQUEST` | 400 | Invalid request format |
| `VALIDATION_ERROR` | 422 | Validation failed |
| `METHOD_NOT_ALLOWED` | 405 | HTTP method not allowed |
| `INTERNAL_ERROR` | 500 | Internal server error |

---

## Rate Limits

The API implements rate limiting via Cloudflare Workers:

- **Default:** 100 requests per minute per IP
- **Configurable:** via `wrangler.toml` `[limits]` section

**Rate Limit Response:**

```json
{
  "success": false,
  "error": {
    "code": "RATE_LIMITED",
    "message": "Too many requests"
  }
}
```

---

## CORS

The API supports Cross-Origin Resource Sharing (CORS):

**Preflight Request:**
```bash
curl -X OPTIONS https://api.example.com/api/projects \
  -H "Origin: http://localhost:3000" \
  -H "Access-Control-Request-Method: POST"
```

**Response Headers:**
```
Access-Control-Allow-Origin: *
Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS
Access-Control-Allow-Headers: Content-Type, Authorization, X-Request-ID
Access-Control-Max-Age: 86400
```

Configure the allowed origin in `wrangler.toml`:

```toml
[vars]
CORS_ORIGIN = "*"  # Or your specific domain
```
