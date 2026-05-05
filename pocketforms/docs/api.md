# API reference

## Endpoints

### `POST /api/pf/submit/:slug`

Classic form submission. Accepts `multipart/form-data` or `application/x-www-form-urlencoded`.

Response:

- `303 See Other` → resolved redirect URL (form config or `_pf_redirect`)
- `4xx` → small HTML error page

### `POST /api/pf/ajax/:slug`

AJAX form submission. Accepts the same content types; returns JSON.

Success response (HTTP 200):

```json
{ "success": true, "id": "kj4d23k4js2lkjd" }
```

Failure response (HTTP 400 / 403 / 404 / 429):

```json
{
  "success": false,
  "error": "too_fast",
  "message": "Submission was faster than minTimeMs."
}
```

## Errors

| HTTP | `error`               | Layer           | Notes                                         |
| :--- | :-------------------- | :-------------- | :-------------------------------------------- |
| 404  | `form_not_found`      | router          | No `pf_forms` row with that slug.             |
| 403  | `form_disabled`       | enable check    | `enabled = false`.                            |
| 403  | `origin_not_allowed`  | origin check    | Origin/Referer not in `allowedOrigins`.       |
| 200  | `success: true` (silent) | honeypot     | Bot tripped honeypot — logged as spam.        |
| 400  | `too_fast`            | time-trap       | Submitted before `minTimeMs` elapsed.         |
| 429  | `rate_limited`        | rate limit      | Per-min or per-day cap hit.                   |
| 400  | `blacklisted`         | content filter  | A phrase matched the blacklist.               |
| 400  | `turnstile_failed`    | Turnstile       | Required but missing/invalid.                 |

## SDK

```js
import PocketForms from "@pocketforms/client";

const pf = PocketForms.init({ pocketbaseUrl: "https://pb.example.com" });

pf.attach("#contact", {
  slug: "contact",
  mode: "ajax",            // or "classic"
  honeypotName: "_pf_honey", // override field name if you must
  minTimeMs: 3000,         // not enforced by the SDK; informational
  turnstileSiteKey: "0x4AA…",
  redirect: "/thanks",     // used in AJAX mode if no onSuccess given
  onSuccess(result, form) {
    console.log("submitted", result.id);
  },
  onError(err, form) {
    console.warn("rejected", err.error);
  },
});
```

`PocketForms.init` returns an object with `attach(target, opts)` and `detach(target)`.

`target` can be a CSS selector or an `HTMLFormElement`.

### Form state attribute

In AJAX mode the SDK sets `data-pocketforms-state` on the form:

```
""           → not yet submitted
submitting   → fetch in flight
success      → 200 received
error        → rejection (any 4xx/5xx) or network error
```

Style success / error blocks declaratively:

```css
form[data-pocketforms-state="success"] .ok { display: block; }
form[data-pocketforms-state="error"]   .err { display: block; }
```

## Auto-init (data-attribute API)

If you include the IIFE bundle, every `<form data-pocketforms="slug">` on the page is wired up automatically on `DOMContentLoaded`. Forms added later (SPA navigation, hydration, etc.) are picked up by a `MutationObserver`.

Per-form options:

| Attribute                          | Type     | Default      |
| :--------------------------------- | :------- | :----------- |
| `data-pocketforms`                 | string   | (required)   |
| `data-pocketforms-mode`            | string   | `ajax`       |
| `data-pocketforms-url`             | string   | from script  |
| `data-pocketforms-honeypot`        | string   | `_pf_honey`  |
| `data-pocketforms-min-time`        | number   | `3000`       |
| `data-pocketforms-turnstile`       | string   | (none)       |
| `data-pocketforms-redirect`        | string   | (none)       |

PocketBase URL discovery (in order):

1. `data-pocketbase-url` on the `<script>` tag
2. `window.POCKETFORMS_URL` global
3. `data-pocketforms-url` on the form
