# DigitalBuilders CRM — Integrations API

A small, API-key-gated surface for external systems (OpenClaw / Hubert,
cron jobs, webhooks) to log work into the CRM and itemize it under the
correct project.

## Why a new "activities" concept (not just tasks)

The kanban Tasks board is human-managed. If every cron run wrote a
new task, the board would flood with thousands of `done` rows nobody
manages. Activities are an append-only feed scoped to a project —
timestamped, machine-friendly, and reviewable from the project drawer
without polluting the board.

Use the right shape for the job:

| When                                              | Use                          |
| ------------------------------------------------- | ---------------------------- |
| Cron / automated job finished a unit of work      | `POST /integrations/activities` |
| Something needs human triage / kanban visibility  | `POST /integrations/tasks`      |

You can do both for the same event if it warrants it (rare).

---

## Setup

Set the API key in the server's environment. Anything that runs the
server (systemd, PM2, docker, plain `node`) needs to expose it as an
env var:

```bash
OPENCLAW_API_KEY=<long random string>
```

If `OPENCLAW_API_KEY` is unset, all `/api/integrations/*` endpoints
return `503 Integration disabled`. The rest of the app continues to
work normally.

`.env.example` is checked in as a template. The actual `.env` is not
checked in — load it via `systemctl`'s `EnvironmentFile=`, PM2's
`env_file`, or your secret manager of choice.

---

## Authentication

Every integration request must carry the API key in **one** of:

```
Authorization: Bearer $OPENCLAW_API_KEY
X-API-Key: $OPENCLAW_API_KEY
```

Tokens are compared in constant time. Missing/wrong tokens return `401`.

## Rate limits

60 requests per minute per IP across `/api/integrations/*`. Over-limit
responses return `429` with a `Retry-After` header.

---

## Project resolution

You can identify a project three ways. They are tried in order:

1. `project_id` (numeric — most stable)
2. `project` exact name match (`"DirtLink"`)
3. `project` slug match — `"dirtlink"` resolves to `"DirtLink"`,
   `"realtors-platform"` to `"Realtors Platform"`, etc.
   Slug rule: lowercase, non-alphanumerics → `-`.

Current project slugs (as of writing):

| Project           | Slug               |
| ----------------- | ------------------ |
| DirtLink          | `dirtlink`         |
| Realtors Platform | `realtors-platform`|
| Penned            | `penned`           |
| Digital Builders  | `digital-builders` |
| Other             | `other`            |

If no match is found, the endpoint returns `404 Project not found`
rather than auto-creating one.

---

## Endpoints

### `POST /api/integrations/activities`

Log a unit of completed (or in-progress / failed / scheduled) work
under a project.

**Request body:**

| Field          | Type    | Required | Notes                                                              |
| -------------- | ------- | -------- | ------------------------------------------------------------------ |
| `project`      | string  | one of   | Name or slug                                                       |
| `project_id`   | number  | one of   | Numeric project id                                                 |
| `title`        | string  | yes      | Max 500 chars                                                      |
| `description`  | string  | no       | Max 5000 chars                                                     |
| `type`         | string  | no       | Free-form. Default `completed_task`. Suggested values below        |
| `status`       | string  | no       | One of `done`, `failed`, `in_progress`, `scheduled`. Default `done` |
| `source`       | string  | no       | E.g. `openclaw`. Default `integration`                             |
| `external_ref` | string  | no       | Stable id for idempotency (see below)                              |
| `completed_at` | ISO8601 | no       | Default = now                                                      |
| `metadata`     | object  | no       | Arbitrary JSON object (artifacts, run ids, etc.)                  |

Suggested `type` values: `completed_task`, `scheduled_run`,
`error`, `note`, `deploy`, `report_generated`. Free-form — the UI
just renders the string.

**Idempotency:** if `external_ref` is provided and a record with the
same `(project_id, external_ref)` already exists, the call is a no-op
and returns `200 { created: false, activity: <existing> }`. New
records return `201 { created: true, activity: <new> }`.

**Response:**

```json
{
  "created": true,
  "activity": {
    "id": 42,
    "project_id": 1,
    "project_name": "DirtLink",
    "type": "completed_task",
    "title": "Weekly permit report generated",
    "description": "Generated latest Calgary permit report and emailed summary.",
    "status": "done",
    "source": "openclaw",
    "external_ref": "dirtlink-weekly-permit-report-2026-04-29",
    "completed_at": "2026-04-29T21:00:00.000Z",
    "metadata": { "job": "weekly_permit_report", "channel": "email" },
    "created_at": "2026-04-29T21:00:01.123Z"
  }
}
```

**Error codes:**

| Code | Meaning                                                |
| ---- | ------------------------------------------------------ |
| 400  | Validation failed (see `details` array in response)   |
| 401  | Missing or wrong API key                               |
| 404  | Project not found                                      |
| 429  | Rate limited                                           |
| 503  | `OPENCLAW_API_KEY` not configured on the server        |

### `GET /api/integrations/activities`

List activities. Same response shape as above (just the array).

Query params (all optional):

- `project` or `project_id` — filter to one project
- `source` — e.g. `openclaw`
- `type` — e.g. `completed_task`
- `limit` — default 100, max 500

### `DELETE /api/integrations/activities/:id`

Delete a single activity. Useful to clean up a bad cron run.

### `GET /api/integrations/tasks`

List tasks. Shape:

```json
[
  {
    "id": 12,
    "title": "Run nightly Penned audit",
    "description": "Check unsent reminders",
    "assignee": "Hubert",
    "status": "todo",
    "priority": "high",
    "due_date": "2026-05-03",
    "project_id": 3,
    "project_name": "Penned",
    "project_color": "#d68a23",
    "claimed_by": null,
    "claimed_at": null,
    "completed_at": null,
    "completion": null,
    "created_at": "2026-05-01T21:13:43.852Z"
  }
]
```

Query params: `assignee`, `status`, `project`, `project_id`. The
typical Hubert poll is `?assignee=Hubert`.

`status` values used by the kanban are `todo`, `in-progress`, `done`
(hyphen, not underscore — those are activity statuses).

### `GET /api/integrations/tasks/:id`

Same shape as a single row above, or `404` if missing.

### `POST /api/integrations/tasks/:id/claim`

Marks a task as `in-progress` and stamps `claimed_by` / `claimed_at`.
Body is optional; defaults to `{ "claimed_by": "Hubert" }`.

- `409 Task already claimed` if a different `claimed_by` already owns it
- `409 Task already complete` if the task is already `done`
- Re-claiming with the same `claimed_by` is a no-op (the original
  `claimed_at` is preserved)

### `POST /api/integrations/tasks/:id/complete`

Marks a task `done` and writes a single activity row to the Hubert
column. Body:

```json
{
  "summary": "Completed task summary",
  "details": "Optional detailed notes",
  "result": "success"
}
```

- `summary` — becomes the activity title. If omitted, falls back to
  `"Completed task: <task title>"`
- `details` — becomes the activity description (optional)
- `result` — `"success"` (default) or `"failed"`. `"failed"` writes a
  `failed` activity and leaves the task status untouched (so it can be
  retried)

**Idempotent** on `external_ref = "task-<id>"` — repeated calls return
the original activity rather than duplicating.

Response:

```json
{
  "task":     { /* shapeTask, see GET /tasks */ },
  "activity": { /* shapeActivity, see POST /activities */ }
}
```

### `GET /api/integrations/projects`

Returns the project list trimmed to what an integration needs:

```json
[
  { "id": 1, "name": "DirtLink", "color": "#7e57c2" },
  { "id": 3, "name": "Penned",   "color": "#d68a23" }
]
```

Use `color` to render activity entries with consistent per-project
colors. The same value is surfaced as `project_color` on every
activity returned by `GET /activities`.

### `POST /api/integrations/tasks`

For the rare case the integration wants something on the human kanban.
Same shape as `POST /api/tasks` (title, description, assignee, status,
priority, due_date) plus `project` / `project_id`. No idempotency —
every call creates a new task. Prefer the activity feed for automated
work; the kanban is reserved for human-managed tasks.

### `GET /api/activities` (unauthenticated, used by the UI)

The CRM's own Project drawer reads from this endpoint. Same query
params as the integrations GET. Local-only — do not expose this path
publicly without auth if you ever lock down the rest of the app.

---

## Example: curl

The Hubert worker loop is roughly: list → claim → do the work → complete.
A cron job that doesn't correspond to a kanban task just posts an activity
directly.

```bash
BASE=https://digitalbuilders.ca/app/api
AUTH="Authorization: Bearer $OPENCLAW_API_KEY"

# 1. Fetch tasks assigned to Hubert
curl -s "$BASE/integrations/tasks?assignee=Hubert" -H "$AUTH"

# 2. Claim a task (defaults to claimed_by=Hubert)
curl -s -X POST "$BASE/integrations/tasks/12/claim" \
  -H "$AUTH" -H "Content-Type: application/json" -d '{}'

# 3. Post a Hubert activity (cron / standalone work, no kanban task)
curl -s -X POST "$BASE/integrations/activities" \
  -H "$AUTH" -H "Content-Type: application/json" \
  -d '{
    "project": "dirtlink",
    "title": "Weekly permit report generated",
    "description": "Generated Calgary permit report and emailed summary.",
    "source": "hubert",
    "external_ref": "dirtlink-weekly-permit-report-2026-04-29",
    "metadata": { "job": "weekly_permit_report" }
  }'

# 4. Complete the kanban task (auto-writes a Hubert activity, idempotent)
curl -s -X POST "$BASE/integrations/tasks/12/complete" \
  -H "$AUTH" -H "Content-Type: application/json" \
  -d '{
    "summary": "Penned audit complete",
    "details": "Found 0 unsent reminders",
    "result": "success"
  }'
```

---

## Recommended OpenClaw usage in production

For a recurring cron-driven job (e.g. weekly permit report):

1. **Always set `external_ref`** to a deterministic, run-unique id —
   `<project>-<job>-<YYYY-MM-DD>` works well. Without it, retries and
   re-runs create duplicate entries.
2. **Use `status` correctly:**
   - `done` for successful completions
   - `failed` if the job errored — put the error in `description`
     and stack/details under `metadata.error`
   - `in_progress` if you log starts; same `external_ref` will be a
     no-op when the matching `done` arrives, so prefer to log only
     terminal events
3. **Stuff identifying detail into `metadata`** rather than the
   description — run id, channel, artifact paths, downstream URLs.
   Keep `title` short and human-readable; the drawer renders it bold.
4. **Don't write secrets into descriptions or metadata.** The activity
   feed is rendered to the local UI as plain text.
5. **Server-side only.** Never put `OPENCLAW_API_KEY` in any
   browser-bundled code. Keep all calls inside OpenClaw's backend.
6. **Health-check pattern:** A simple GET against
   `/api/integrations/activities?project=dirtlink&limit=1` with the
   key verifies network + auth in one request — useful at the start
   of a cron run before doing real work.

A reasonable Python snippet on OpenClaw's side:

```python
import os, requests
from datetime import datetime, timezone

def log_activity(project, title, *, status="done", description=None,
                 external_ref=None, metadata=None, type="completed_task"):
    requests.post(
        "https://digitalbuilders.ca/app/api/integrations/activities",
        headers={"Authorization": f"Bearer {os.environ['OPENCLAW_API_KEY']}"},
        json={
            "project": project,
            "title": title,
            "status": status,
            "description": description,
            "external_ref": external_ref,
            "metadata": metadata or {},
            "type": type,
            "source": "openclaw",
            "completed_at": datetime.now(timezone.utc).isoformat(),
        },
        timeout=10,
    ).raise_for_status()
```

---

## Migration notes

No data migration is required. The `activities` collection is created
empty on next server start (or auto-added to existing `data.json`).
Existing tasks/events/projects are untouched.
