# Getting started

PocketForms is two pieces:

- **Backend** — a PocketBase JS hook + a migration (in `backend/`)
- **Client** — a tiny browser SDK that wires up bot/spam protection on any HTML form

You install both once, then create as many forms as you want from the PocketBase admin UI.

## 1. Set up the PocketBase backend

```bash
# In your PocketBase install:
cp pocketforms/backend/pb_hooks/pocketforms.pb.js     ./pb_hooks/
cp pocketforms/backend/pb_migrations/*.js              ./pb_migrations/

./pocketbase migrate up
./pocketbase serve
```

You should see two new routes registered:

```
POST /api/pf/submit/:slug
POST /api/pf/ajax/:slug
```

## 2. Create a form record

Open the PocketBase admin → `pf_forms` → **New record**.

Minimum required: a `slug` (the public id of your form, e.g. `contact`).

Recommended for production:

- `enabled`: ✅
- `notifyEmail`: where you want notification emails to go
- `allowedOrigins`: comma-separated list of frontend hosts, e.g.
  `https://youzen.app,http://localhost:4321`
- `subject`: default email subject line
- `redirect`: success URL for classic-mode forms

## 3. Build the client SDK (or use the CDN)

```bash
cd pocketforms
npm install
npm run build       # writes dist/pocketforms.iife.js
```

Or use the published bundle from jsDelivr:

```html
<script
  src="https://cdn.jsdelivr.net/npm/@pocketforms/client/dist/pocketforms.iife.js"
  data-pocketbase-url="https://pb.example.com"
></script>
```

## 4. Add a form to your page

The shortest possible form (AJAX mode):

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

That's it. The SDK injects a honeypot + time-trap, hijacks submit, sends the data via fetch, and fires success / error states on the form's `data-pocketforms-state` attribute.

For classic-mode (no JS required after first load), see [`form-conventions.md`](./form-conventions.md).

## 5. Verify it works

In a private browser window:

1. Open the form.
2. Submit it instantly (you'll trip the time-trap → 400 `too_fast`).
3. Wait 5 seconds, fill it out, submit again.
4. Check the PocketBase admin → `pf_submissions`. There should be a row with `status: received`.
5. Check the inbox you set as `notifyEmail`.

If anything's missing, check the PocketBase server logs — every rejection logs a row with `status: spam` or `status: blocked` and the reason in `spamReasons`.
