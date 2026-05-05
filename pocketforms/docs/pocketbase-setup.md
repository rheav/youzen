# PocketBase setup

PocketForms uses two PocketBase features that arrived in v0.22:

- **JS migrations** (`pb_migrations/*.js`) — for the collection schema
- **JS hooks** (`pb_hooks/*.pb.js`) — for the request handlers, mailer, and cron

If you're on an older PocketBase, upgrade first. There are no other requirements.

## Files to copy

```
pocketforms/backend/pb_hooks/pocketforms.pb.js              → ./pb_hooks/
pocketforms/backend/pb_migrations/1735000000_init_pocketforms.js  → ./pb_migrations/
```

## Apply the migration

```bash
./pocketbase migrate up
```

This creates three collections:

- `pf_forms` — admin-managed form definitions
- `pf_submissions` — received payloads
- `pf_rate_log` — per-IP rate-limit counters

All three are non-public (no list/view access via the standard API). All writes happen through the custom routes registered by the hook.

## Configure the mailer

PocketForms uses PocketBase's built-in mailer (`$app.newMailClient()`). Configure it once in the admin UI:

- **Settings → Mail settings**: SMTP host, port, username, password, sender address & name.

If SMTP isn't configured, submissions still get stored — only the notification email will fail (logged as a warning, never surfaced to the user).

## Verify routes

After restart, you should see in the logs:

```
Server started at http://0.0.0.0:8090
GET /_/                          → admin UI
POST /api/pf/submit/:slug        → PocketForms classic
POST /api/pf/ajax/:slug          → PocketForms AJAX
```

Test:

```bash
curl -X POST https://pb.example.com/api/pf/ajax/contact \
  -H "Origin: https://allowed.example" \
  -F "email=test@example.com" \
  -F "message=hello" \
  -F "_pf_honey=" \
  -F "_pf_t=$(($(date +%s%3N) - 5000))"
```

(That's `now - 5 s` so the time-trap passes.)

## Allowing your frontend's origin

In the admin UI, set `allowedOrigins` on the form record to a comma-separated list:

```
https://youzen.app,https://www.youzen.app,http://localhost:4321
```

Leave it empty during local dev to skip the check entirely (insecure for production).

## CORS

PocketBase already allows cross-origin requests by default. If you've tightened that, make sure your frontend's origin is allowlisted in **Settings → Application → CORS**.

## Cron job

A cron `pocketforms_cleanup` runs daily at `0 3 * * *` (03:00 UTC) and deletes:

- `pf_submissions` older than 30 d where `status != 'received'`
- `pf_rate_log` older than 30 d

Edit the schedule at the bottom of `pocketforms.pb.js` if your retention policy differs.
