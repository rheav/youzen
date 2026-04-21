# YouTube HTML fixtures — capture procedure

Integration tests in `tests/integration/youtube-css.test.js` (landing in **Phase 7**)
run the `src/styles/youtube.css` stylesheet against snapshotted YouTube DOMs
to confirm every CSS-kind feature actually hides what it's supposed to hide.

Because the live YouTube DOM changes under A/B tests, these snapshots must be
refreshed periodically — **any time a feature visibly stops working, re-capture
the relevant fixture first, then debug the selector against the fresh capture.**

## When to capture

- Before writing a new CSS rule for a YouTube surface we don't yet cover.
- When a test starts failing because YouTube changed markup.
- Each release cycle, as a routine refresh.

## Capture procedure

1. **Fresh Chrome profile** — one that is NOT logged into yt-cleanse (so the
   extension can't modify the DOM). An incognito window with the extension
   disabled also works.
2. **Log out of YouTube** — fixtures should reflect the anonymous-viewer state.
   Logged-in variants can be added later under `tests/fixtures/youtube/logged-in/`
   if we need them.
3. **Disable any other YouTube-modifying extensions** (ad blockers, SponsorBlock,
   Enhancer-for-YouTube, etc.) — they mutate the DOM and pollute fixtures.
4. **Let the page fully render** — scroll once so lazy-loaded shelves mount,
   then wait for the network to settle.
5. Open DevTools → Console and run:

   ```js
   copy(document.documentElement.outerHTML);
   ```

   This copies the full live HTML to clipboard.

6. Paste into the matching file under `tests/fixtures/youtube/` (create the
   directory when first capturing). Keep filenames stable:

   | URL pattern                                   | Fixture file                        |
   | --------------------------------------------- | ----------------------------------- |
   | `https://www.youtube.com/`                    | `home.html`                         |
   | `https://www.youtube.com/watch?v=…`           | `watch.html`                        |
   | `https://www.youtube.com/results?search_query=…` | `search.html`                    |
   | `https://www.youtube.com/shorts/…`            | `shorts.html`                       |
   | `https://www.youtube.com/feed/subscriptions`  | `subscriptions.html`                |
   | `https://www.youtube.com/@<handle>`           | `channel.html`                      |
   | `https://www.youtube.com/@<handle>/shorts`    | `channel-shorts-tab.html`           |

7. **Sanitize the fixture** before committing:
   - Remove any `<script>` content bodies (leave the tags; Vitest's jsdom
     won't execute them anyway, but the payload is noisy and may contain
     personal data).
   - Strip query strings carrying personal tokens (`?t=…`, `?pp=…`) from
     the first few `<meta>` tags if present.
   - Redact any visible account email / handle in `alt` / `aria-label` text.

   The fastest way is a quick regex sweep — a codemod script may land under
   `tests/integration/sanitize-fixture.mjs` when Phase 7 arrives.

8. Commit the fixture with a short note:

   ```
   test(fixtures): refresh home.html — YouTube dropped `is-shorts` attribute
   ```

## File format

Fixtures are raw HTML strings. Import via Vite's `?raw` loader:

```js
import homeFixture from './fixtures/youtube/home.html?raw';

document.documentElement.innerHTML = homeFixture;
// ... assertions against the DOM ...
```

The inline stylesheet (`src/styles/youtube.css`) is injected into the test DOM
via a helper (lives in the Phase 7 test harness), so the CSS runs against the
fixture DOM just like it would on a real page.

## What NOT to do

- **Don't** log in and capture — a logged-in homepage includes Continue
  Watching / Watch Later data tied to your account. Keep fixtures anonymous
  and reproducible.
- **Don't** shrink the HTML by hand. Keep it whole; gzip is cheap.
- **Don't** commit fixtures from mobile YouTube (`m.youtube.com`) — v1 does
  not support mobile. The spec §12.1 marks mobile as out of scope.
