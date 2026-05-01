# Hubert agent brief

How Hubert (the OpenClaw automation agent) should use the DigitalBuilders
CRM integrations API. Pair this with `INTEGRATION.md`, which is the full
endpoint reference — this doc is the *operating manual*.

## Connection

```
BASE: https://digitalbuilders.ca/app/api
AUTH: Authorization: Bearer $OPENCLAW_API_KEY
      (or X-API-Key: $OPENCLAW_API_KEY — same value, either header works)
```

`OPENCLAW_API_KEY` lives on the OpenClaw side as a secret. Never log it,
never put it in a request body, never bundle it into anything that ships
to a browser.

## The work loop

Run on whatever cadence makes sense (every 1–5 min is fine):

1. **List your tasks**
   ```
   GET /integrations/tasks?assignee=Hubert
   ```
   Skip rows where `status === "done"`, or `claimed_by` is set to
   someone other than you. From what's left, pick the next task —
   priority desc, then `due_date` asc, then `created_at` asc.

2. **Claim it**
   ```
   POST /integrations/tasks/{id}/claim    body: {}
   ```
   Sets `status` to `in-progress` and stamps `claimed_by` / `claimed_at`.
   `409 Task already claimed` means another agent beat you to it — drop
   the task, pick another. Re-claiming with the same `claimed_by` is a
   no-op, so a retry after a network blip is safe.

3. **Do the work.** Use the task's `title` + `description` as the brief.
   `project_name` and `project_color` are there if you need project
   context (e.g. for downstream messages).

4. **Complete it**
   ```
   POST /integrations/tasks/{id}/complete
   body: {
     "summary": "<one-line outcome>",      // becomes activity title
     "details": "<longer notes, links>",   // becomes activity description
     "result":  "success" | "failed"
   }
   ```
   This auto-writes a Hubert activity row that the user sees in the
   right-hand Hubert column. **Idempotent** on `external_ref="task-<id>"` —
   safe to retry. Use `result: "failed"` if you couldn't finish: the task
   status stays untouched (so a human can retriage) and the activity is
   marked `failed`.

## Cron / standalone work (no kanban task)

For recurring jobs that don't correspond to a kanban task — weekly
reports, scrapes, audits, deploys — post directly to the activity feed:

```
POST /integrations/activities
body: {
  "project":      "dirtlink",            // name or slug, or use project_id
  "title":        "Weekly permit report generated",
  "description":  "<short summary>",
  "source":       "hubert",
  "external_ref": "dirtlink-weekly-permit-report-2026-05-08",
  "metadata":     { "job": "weekly_permit_report", "channel": "email" }
}
```

**Always set a deterministic `external_ref`.** Pattern:
`<project>-<job>-<YYYY-MM-DD>`. The endpoint is idempotent on
`(project_id, external_ref)`, so a retry returns the original row instead
of duplicating. A randomly generated UUID per run defeats this — don't.

If a run errors, post `status: "failed"` with the error in `description`
and the stack/details under `metadata.error`.

## Projects

```
GET /integrations/projects -> [{ id, name, color }]
```

Cache this for the duration of a run. Project resolution accepts:
- `project_id` (numeric, most stable)
- `project` exact name (`"DirtLink"`)
- `project` slug (`"dirtlink"`, `"realtors-platform"`, `"penned"`,
  `"digital-builders"`, `"other"`)

`color` is the per-project hex used to render activity entries
consistently in the Hubert column.

## Rules

- **Never write to `/api/tasks` (POST).** The kanban is human-managed.
  The only writes Hubert makes to tasks are `claim` and `complete` on
  tasks a human already assigned to him.
- **Never claim or complete a task whose `assignee !== "Hubert"`.**
- **One activity per task completion is automatic.** `complete` already
  writes the activity. Don't also call `/integrations/activities` for
  the same task — you'll just clutter the feed.
- **Treat `401` / `503` as fatal config errors**, not retryable. `401`
  = wrong key; `503` = server has no `OPENCLAW_API_KEY` configured.
- **`429` means back off.** The `Retry-After` header tells you for how
  many seconds. Limit is 60 req/min/IP across all `/api/integrations/*`.
- **No secrets, API keys, or PII in `title` / `description` / `metadata`.**
  These are rendered as plain text in the UI.
- **Keep `title` short.** It's bold in the activity card. Stuff details
  into `description` and structured data into `metadata`.

## Health check

Cheap one-liner to verify network + auth before doing real work:

```
GET /integrations/activities?project=dirtlink&limit=1
```

Expect `200` with an array (possibly empty). Anything else = abort the
run and alert.

## Status value reference

There are two separate vocabularies — don't mix them:

| Field                     | Allowed values                                |
| ------------------------- | --------------------------------------------- |
| **Task** `status`         | `todo`, `in-progress`, `done` (hyphen)        |
| **Activity** `status`     | `done`, `failed`, `in_progress`, `scheduled` (underscore) |
| **Complete** `result`     | `success`, `failed`                           |
