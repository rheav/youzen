# PocketForms — backend (PocketBase)

Drop-in backend for the [PocketForms client SDK](../). Two files:

```
pb_hooks/pocketforms.pb.js              # all server logic (routes, mail, cron)
pb_migrations/1735000000_init_pocketforms.js  # collections schema
```

## Install

PocketBase ≥ 0.22 (JS hooks + JS migrations).

```bash
# from your PocketBase install directory
cp -r .../pocketforms/backend/pb_hooks/pocketforms.pb.js     ./pb_hooks/
cp -r .../pocketforms/backend/pb_migrations/*.js             ./pb_migrations/

# apply the migration
./pocketbase migrate up

# (re)start
./pocketbase serve
```

The migration creates three collections: `pf_forms`, `pf_submissions`, `pf_rate_log`. None of them is publicly readable — all writes happen through the custom routes registered by the hook.

## Create your first form (admin UI)

1. Open the PocketBase admin UI → `pf_forms` → **New record**.
2. Required: `slug` (lowercase, hyphenated; this is your public form id).
3. Recommended:
   - `enabled`: ✅
   - `notifyEmail`: where submission notifications go
   - `allowedOrigins`: comma-separated list of allowed origins (e.g. `https://youzen.app,http://localhost:4321`)
   - `subject`: default email subject
   - `redirect`: default success redirect (classic mode)
4. Tighten with whatever you need:
   - `blacklist`: comma-separated phrases to reject
   - `rateLimitPerMin` (default 3) / `rateLimitPerDay` (default 20)
   - `requireTurnstile` + `turnstileSecret` (server-side Turnstile secret, get a key at [dash.cloudflare.com](https://dash.cloudflare.com))
   - `allowedFields`: comma-separated whitelist (extra fields are dropped)
   - `webhookUrl`: optional outbound webhook on success
   - `ipSalt`: any random string; used to hash IPs (defaults to the form's id)

## Endpoints

```
POST /api/pf/submit/{slug}     classic — 303 redirect on success
POST /api/pf/ajax/{slug}       AJAX    — JSON
```

Both accept `multipart/form-data` and `application/x-www-form-urlencoded`.

## What gets stored

Every submission becomes a row in `pf_submissions`:

| Column         | What                                          |
| :------------- | :-------------------------------------------- |
| `form`         | relation to `pf_forms`                        |
| `data`         | JSON of accepted user fields                  |
| `ipHash`       | sha256(ip + form.ipSalt) — not the raw IP     |
| `userAgent`    | first 300 chars of the UA string              |
| `origin`       | request `Origin` / `Referer`                  |
| `status`       | `received` · `spam` · `blocked` · `error`     |
| `spamReasons`  | array, e.g. `["honeypot"]`, `["timing"]`, …   |
| `errorMessage` | on `error` rows                               |

## Maintenance

A cron job (`pocketforms_cleanup`) runs daily at 03:00 UTC and deletes:

- `pf_submissions` older than 30 days where `status != 'received'`
- `pf_rate_log` rows older than 30 days

Tweak the schedule or thresholds at the bottom of `pocketforms.pb.js`.

## Privacy

- Raw IPs are never stored — only `sha256(ip + salt)` for rate-limit grouping.
- No third-party network calls unless `requireTurnstile` is on.
- The hook makes outbound network calls only for: Turnstile verification (Cloudflare) and your own `webhookUrl` (if set).
