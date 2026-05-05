# Spam & bot protection

PocketForms layers seven cheap, mostly invisible defences. Each layer is independently effective; together they catch ~99 % of automated spam without ever showing a CAPTCHA puzzle to a real human.

Order is cheapest-first. The pipeline short-circuits on the first failure.

## 1. Origin / Referer check

The server compares the request's `Origin` (falling back to `Referer`) against the form's `allowedOrigins` list. Anything from a different host is rejected with `origin_not_allowed`.

This stops the simplest attack — `curl` against a random PocketForms instance.

> If `allowedOrigins` is empty, the check is skipped (handy for local dev). Always populate it in production.

## 2. Honeypot

The SDK injects a hidden `<input name="_pf_honey">`. Real users never see it; bots that fill every field fill it too. When the server sees a non-empty `_pf_honey`, it returns `200 OK` to the bot but logs the submission as `status: spam` and never sends a notification.

The field is hidden three ways (CSS `display:none`, off-screen position, `aria-hidden`) so scrapers that ignore one technique still skip it.

## 3. Time-trap

The SDK records a timestamp in `_pf_t` when the form is rendered (and refreshes it on first user interaction so SPA routes don't trigger false negatives). The server rejects any submission where `now - t < minTimeMs` (default 3 s).

Bots POST instantly. Humans take well over 3 s to fill even a single-field form.

`minTimeMs` is configurable per form. Set it higher for forms with many fields.

## 4. Per-IP rate limit

Two windows tracked per (form, IP-hash):

- `rateLimitPerMin` (default `3` per 60 s)
- `rateLimitPerDay` (default `20` per 24 h)

IPs are hashed with `sha256(ip + form.ipSalt)` so the rate counters work without storing raw IP addresses anywhere.

## 5. Content blacklist

If `blacklist` is set on the form record, the server lowercases all user-field values and rejects the submission if any phrase matches.

For technical contact forms, a starter list might be: `viagra, casino, http://, https://, .ru/, telegram.me/, t.me/`. Tune to taste.

## 6. Turnstile (optional)

Set `requireTurnstile: true` and `turnstileSecret: <your-secret>` on the form record, and pass `data-pocketforms-turnstile="<your-site-key>"` on the form element. The SDK auto-loads Turnstile, mounts the widget, and includes the token in the submission. The server verifies the token against Cloudflare's siteverify endpoint.

Turnstile is invisible to humans 99 % of the time. Use it only when layers 1–5 are leaking — they almost never do.

## 7. Allowed-fields whitelist (optional)

If `allowedFields` is set, the server drops any field that isn't on the list before storing. Useful if you have a fixed schema and want to harden against junk.

## What you give up vs. an aggressive CAPTCHA

- A determined attacker willing to run a real browser (Puppeteer / Playwright / a Captcha-solving service) can defeat every layer above except Turnstile.
- For a contact form on a small site, that almost never happens — those resources go after high-value targets (auth, payments).
- If you ever start seeing real attacks: enable Turnstile per-form. It's a single switch.

## Privacy

- IPs are never stored as plain text.
- User agents are truncated to 300 chars.
- No third-party requests unless `requireTurnstile` is on (then: Cloudflare).
- 30-day TTL on spam/blocked rows via the cleanup cron.
