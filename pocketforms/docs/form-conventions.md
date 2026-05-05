# Form conventions

Any field whose name starts with `_pf_` is a **control field**. Control fields are stripped from the saved payload but adjust how the server processes the submission.

These mirror FormSubmit's `_field` conventions where it makes sense.

## Control fields

| Field             | What it does                                                                                                  |
| :---------------- | :------------------------------------------------------------------------------------------------------------ |
| `_pf_honey`       | Honeypot. Must stay empty. Auto-injected by the SDK; bots fill it.                                            |
| `_pf_t`           | Render timestamp (ms). Auto-injected by the SDK. Server rejects if `now - t < minTimeMs` (default 3000).      |
| `_pf_redirect`    | Override the form's `redirect` config (classic mode). Allowed only if the URL's host is in `allowedOrigins`.  |
| `_pf_next`        | Alias for `_pf_redirect` (FormSubmit-compatible name).                                                        |
| `_pf_subject`     | Override the email subject for this submission.                                                               |
| `_pf_replyto`     | Set the email's Reply-To header. Defaults to the value of the `email` field if present.                       |
| `_pf_cc`          | Comma-separated CC list, appended to the form's default `ccEmails`.                                           |
| `_pf_turnstile`   | Cloudflare Turnstile token (also accepted as `cf-turnstile-response`).                                        |

## User fields

Everything that doesn't start with `_pf_` is a user field. They're stored verbatim in the `data` JSON column.

If the form record has `allowedFields` set (comma-separated whitelist), any non-listed user field is silently dropped. Useful for hardening against junk.

## File uploads

Add `enctype="multipart/form-data"` to your `<form>` and use `<input type="file">`. Files are accepted and forwarded to the PocketBase storage layer.

> v0.1 stores file metadata in `data` but does not yet attach the binary to the submission record. Tracking issue: file uploads end-to-end.

## Endpoint shapes

### Classic mode

```http
POST /api/pf/submit/{slug}
Content-Type: multipart/form-data
```

On success → `303 See Other` to the resolved redirect (form config or `_pf_redirect`).
On rejection → `4xx` with a small HTML error page.

### AJAX mode

```http
POST /api/pf/ajax/{slug}
Content-Type: multipart/form-data
Accept: application/json
```

Success:

```json
{ "success": true, "id": "kj4d…" }
```

Failure:

```json
{ "success": false, "error": "too_fast", "message": "…" }
```

`error` is one of:

| Code                  | Meaning                                                  |
| :-------------------- | :------------------------------------------------------- |
| `form_not_found`      | No `pf_forms` record with that slug.                     |
| `form_disabled`       | Form exists but `enabled` is false.                      |
| `origin_not_allowed`  | Request `Origin`/`Referer` not in `allowedOrigins`.      |
| `too_fast`            | Time-trap tripped (`_pf_t` too recent).                  |
| `rate_limited`        | Per-IP per-minute or per-day cap hit.                    |
| `blacklisted`         | A field matched a phrase in the form's `blacklist`.      |
| `turnstile_failed`    | Turnstile required but token missing or invalid.         |
| `network`             | Client couldn't reach the server.                        |
| `bad_response`        | Server returned non-JSON.                                |
