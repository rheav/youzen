<div align="center">

# PocketForms

**A self-hostable, FormSubmit-style HTML form backend powered by [PocketBase](https://pocketbase.io).**

One PocketBase JS hook + one tiny browser SDK = honeypot · time-trap · per-IP rate limit · content blacklist · optional Turnstile, all behind a `<form data-pocketforms="slug">` attribute.

[![License: MIT](https://img.shields.io/badge/license-MIT-A8C9A0?style=flat-square)](LICENSE)
[![Bundle](https://img.shields.io/badge/client%20bundle-~3KB%20gz-7FA87F?style=flat-square)](dist/)
[![PocketBase](https://img.shields.io/badge/PocketBase-%E2%89%A50.22-A8C9A0?style=flat-square)](https://pocketbase.io)
[![No CAPTCHA by default](https://img.shields.io/badge/no%20CAPTCHA-by%20default-7FA87F?style=flat-square)](docs/protection.md)
[![Turnstile ready](https://img.shields.io/badge/Cloudflare%20Turnstile-optional-A8C9A0?style=flat-square)](docs/protection.md#6-turnstile-optional)

[**Getting started**](docs/getting-started.md) · [**Form conventions**](docs/form-conventions.md) · [**Protection**](docs/protection.md) · [**API**](docs/api.md) · [**Examples**](examples/)

</div>

---

## Why

You want a contact form. You don't want:

- A third party storing your visitors' emails
- A CAPTCHA puzzle for every legitimate human
- Yet another monthly subscription
- A whole new backend just for one form

You already have a PocketBase. PocketForms turns it into the form backend.

```html
<form data-pocketforms="contact">
  <input type="email" name="email" required />
  <textarea name="message" required></textarea>
  <button>Send</button>
</form>
<script
  src="https://cdn.jsdelivr.net/npm/@pocketforms/client/dist/pocketforms.iife.js"
  data-pocketbase-url="https://pb.example.com"
></script>
```

That's the whole frontend. The SDK auto-injects the honeypot and time-trap, hijacks submit, and posts to the backend route. The PocketBase hook validates, persists, mails you, optionally fires a webhook.

## What you get

- 🪝 **Honeypot field** — auto-injected, three-way hidden, silent-success on trip.
- ⏱ **Time-trap** — record-on-render, refresh-on-interaction, server enforces ≥ 3 s.
- 🚦 **Per-IP rate limit** — per-minute and per-day windows, IPs hashed with a per-form salt.
- 🚫 **Content blacklist** — comma-separated phrases per form.
- 🌐 **Origin / Referer check** — per-form `allowedOrigins` allowlist.
- ☁️ **Optional Cloudflare Turnstile** — invisible 99 % of the time, off by default.
- ✉️ **Notification email** — via PocketBase's built-in mailer; reply-to follows `email` field.
- 🪢 **Optional webhook** — POST submission JSON to your URL on success.
- 🌓 **Two modes** — `classic` (303 redirect, zero-JS) and `ajax` (fetch + JSON).
- 🧹 **Auto-cleanup** — daily cron prunes spam/blocked rows after 30 days.
- 🔒 **No raw IPs stored** — only `sha256(ip + salt)`. No third-party calls unless you opt in.

## Architecture

```
                                   ┌──────────────────────────────┐
                                   │  PocketBase                  │
  <form data-pocketforms="...">    │                              │
        │                          │  pb_hooks/pocketforms.pb.js  │
        │ POST /api/pf/ajax/:slug  │   • routerAdd(submit, ajax)  │
        ├─────────────────────────►│   • origin → honeypot →      │
        │                          │     time-trap → rate-limit → │
        │                          │     blacklist → Turnstile    │
        │ 200 { success: true }    │   • $app.save(submission)    │
        │◄─────────────────────────│   • mailer + webhook         │
                                   │                              │
                                   │  pf_forms · pf_submissions   │
                                   │  · pf_rate_log               │
                                   └──────────────────────────────┘
```

Two routes, three collections, one hook file. No additional services.

## Install

### 1. Backend (PocketBase ≥ 0.22)

```bash
cp pocketforms/backend/pb_hooks/pocketforms.pb.js     ./pb_hooks/
cp pocketforms/backend/pb_migrations/*.js             ./pb_migrations/

./pocketbase migrate up
./pocketbase serve
```

Then in the admin UI, create a row in `pf_forms`:

| Field             | Example                                              |
| :---------------- | :--------------------------------------------------- |
| `slug`            | `contact`                                            |
| `enabled`         | ✅                                                    |
| `notifyEmail`     | `you@example.com`                                    |
| `allowedOrigins`  | `https://yoursite.example,http://localhost:4321`     |
| `subject`         | `New message from yoursite.example`                  |
| `redirect`        | `https://yoursite.example/thanks` (classic mode)     |
| `blacklist`       | `viagra, casino, t.me/`                              |

Full list of columns: see [`backend/README.md`](backend/README.md).

### 2. Client SDK

Either via npm:

```bash
npm i @pocketforms/client
```

```js
import PocketForms from "@pocketforms/client";
PocketForms.init({ pocketbaseUrl: "https://pb.example.com" })
  .attach("#contact", { slug: "contact", mode: "ajax" });
```

Or via a `<script>` tag with the auto-init bundle:

```html
<form data-pocketforms="contact">…</form>
<script
  src="https://cdn.jsdelivr.net/npm/@pocketforms/client/dist/pocketforms.iife.js"
  data-pocketbase-url="https://pb.example.com"
></script>
```

## Examples

| File                                                   | Mode    | Use case                                  |
| :----------------------------------------------------- | :------ | :---------------------------------------- |
| [`examples/classic-html.html`](examples/classic-html.html) | classic | Plain HTML form, native POST + redirect.  |
| [`examples/ajax-html.html`](examples/ajax-html.html)       | ajax    | No page reload, declarative state styling. |
| [`examples/astro-component.astro`](examples/astro-component.astro) | both | Reusable Astro component.                 |

## Form conventions (FormSubmit-compatible spirit)

Any field starting with `_pf_` is a control field, stripped from storage but read by the server:

| Field             | What it does                                                              |
| :---------------- | :------------------------------------------------------------------------ |
| `_pf_honey`       | Honeypot. Stay empty.                                                     |
| `_pf_t`           | Render timestamp (ms). Server rejects if too recent.                      |
| `_pf_redirect`    | Override the form's success redirect (classic mode, must be in allowlist).|
| `_pf_next`        | FormSubmit-compatible alias for `_pf_redirect`.                           |
| `_pf_subject`     | Per-submission email subject override.                                    |
| `_pf_replyto`     | Email Reply-To. Defaults to the `email` field if present.                 |
| `_pf_cc`          | Comma-separated extra CC list.                                            |
| `_pf_turnstile`   | Cloudflare Turnstile token (also accepted as `cf-turnstile-response`).    |

Full reference: [`docs/form-conventions.md`](docs/form-conventions.md).

## Build the SDK

```bash
cd pocketforms
npm install
npm run build       # → dist/pocketforms.{js,cjs,iife.js,d.ts}
```

esbuild only; no other build deps.

## Roadmap

- [x] Honeypot + time-trap auto-injection
- [x] Per-IP per-form rate limit (minute + day windows)
- [x] Content blacklist
- [x] Cloudflare Turnstile (optional, per-form)
- [x] Outbound webhook
- [x] PocketBase mailer integration
- [x] Daily cleanup cron
- [ ] First-class file uploads (currently metadata only)
- [ ] Admin UI panel inside PocketBase (form picker + recent submissions)
- [ ] One-shot signup flow ("POST to /api/pf/auto/<email>" → confirm via email → form is auto-created)
- [ ] React + Vue components in dedicated subpackages

## License

[MIT](LICENSE).

---

<div align="center">

Part of the [youZen](https://github.com/rheav/youzen) monorepo. Designed for sites that want a contact form without inviting a vendor home for dinner.

</div>
