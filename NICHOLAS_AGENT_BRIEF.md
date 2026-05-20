# Nicholas agent brief

How Nicholas (the second AI agent on the DigitalBuilders CRM) should use
the integrations API. Pair this with `INTEGRATION.md`, which is the full
endpoint reference — this doc is the *operating manual*.

Nicholas has the same surface as Hubert (same endpoints, same rate
limits, same project resolution). The only differences are the API key
used and the column his activities land in.

## Connection

```
BASE: https://digitalbuilders.ca/app/api
AUTH: Authorization: Bearer $NICHOLAS_API_KEY
      (or X-API-Key: $NICHOLAS_API_KEY — same value, either header works)
```

`NICHOLAS_API_KEY` lives on Nicholas's host as a secret. Never log it,
never put it in a request body, never bundle it into anything that ships
to a browser.

The server records which key it received and tags writes with the agent
name automatically. Concretely:

- Activities Nicholas posts default to `source: "nicholas"` and show up
  in the **Nicholas** column on the Tasks board.
- Tasks Nicholas claims default to `claimed_by: "Nicholas"`.
- Chat messages Nicholas posts have `sender: "Nicholas"`, regardless of
  what's in the request body.

## The work loop

Same as Hubert:

1. **List your tasks**
   ```
   GET /integrations/tasks?assignee=Nicholas
   ```
   Skip rows where `status === "done"`, or `claimed_by` is set to
   someone other than you. From what's left, pick the next task —
   priority desc, then `due_date` asc, then `created_at` asc.

2. **Claim it**
   ```
   POST /integrations/tasks/{id}/claim    body: {}
   ```
   Sets `status` to `in-progress` and stamps `claimed_by` to Nicholas.
   `409 Task already claimed` means another agent or human got there
   first — drop it, pick another.

3. **Do the work.** Use the task's `title` + `description` as the brief.
   `project_name` and `project_color` are there for downstream context.

4. **Complete it**
   ```
   POST /integrations/tasks/{id}/complete
   body: {
     "summary": "<one-line outcome>",      // becomes activity title
     "details": "<longer notes, links>",   // becomes activity description
     "result":  "success" | "failed"
   }
   ```
   Auto-writes a Nicholas activity row that the user sees in the
   Nicholas column. **Idempotent** on `external_ref="task-<id>"` —
   safe to retry. Use `result: "failed"` if you couldn't finish: the
   task status stays untouched (so a human can retriage) and the
   activity is marked `failed`.

## Cron / standalone work (no kanban task)

```
POST /integrations/activities
body: {
  "project":      "dirtlink",
  "title":        "Lead scrape complete",
  "description":  "<short summary>",
  "external_ref": "dirtlink-lead-scrape-2026-05-19",
  "metadata":     { "job": "lead_scrape", "count": 132 }
}
```

You don't need to set `source` — the server defaults it to `"nicholas"`
because of which API key you used. (You can override it if you have a
specific reason, but you usually shouldn't.)

**Always set a deterministic `external_ref`.** Pattern:
`<project>-<job>-<YYYY-MM-DD>`. Endpoint is idempotent on
`(project_id, external_ref)`, so a retry returns the original row.

## Chat — for roadblocks and instruction tweaks

The CRM has a team chat at `/api/integrations/messages`. This is the
canonical place for things that need a human to acknowledge —
roadblocks, ambiguity in a task, requests for permission, status
nudges. Don't use the activity feed for this — that's append-only and
not where humans look first.

```
POST /integrations/messages
body: { "text": "Permit scrape: site is gating with reCAPTCHA, need an updated approach." }
```

The `sender` is forced to `"Nicholas"` server-side. Keep messages
focused and end with a clear ask if you need one. To check for replies:

```
GET /integrations/messages?since=<last_seen_id>
```

(Use `since` to avoid re-processing the same messages on each poll.)

## Projects

```
GET /integrations/projects -> [{ id, name, slug, color }]
```

Cache for the duration of a run. Project resolution accepts:
- `project_id` (numeric, most stable)
- `project` exact name (`"DirtLink"`)
- `project` slug (`"dirtlink"`, `"realtors-platform"`, `"penned"`,
  `"digital-builders"`, `"other"`)

## Rules

- **Never write to `/api/tasks` (POST).** The kanban is human-managed.
- **Never claim or complete a task whose `assignee !== "Nicholas"`.**
  Hubert and Nicholas don't share a queue — each only handles tasks
  explicitly assigned to them.
- **One activity per task completion is automatic.** `complete` writes
  the activity. Don't also call `/integrations/activities` for the
  same task.
- **Treat `401` / `403` / `503` as fatal config errors.** `401` = wrong
  key. `403` = the server saw a key but couldn't map it to an agent
  identity (shouldn't normally happen). `503` = no agent keys
  configured on the server.
- **`429` means back off.** `Retry-After` header tells you for how
  many seconds. Shared budget: 60 req/min/IP across all
  `/api/integrations/*`.
- **No secrets, API keys, or PII in `title` / `description` / `metadata`
  / chat `text`.** All rendered as plain text in the UI.

## Health check

```
GET /integrations/activities?project=dirtlink&limit=1
```

Expect `200` with an array. Anything else = abort the run and alert.

## Status value reference

| Field                     | Allowed values                                |
| ------------------------- | --------------------------------------------- |
| **Task** `status`         | `todo`, `in-progress`, `done` (hyphen)        |
| **Activity** `status`     | `done`, `failed`, `in_progress`, `scheduled` (underscore) |
| **Complete** `result`     | `success`, `failed`                           |
