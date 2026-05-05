# youZen

A Chrome extension for people who want YouTube to stop wasting their time. One
sidepanel, a pile of toggles, and a blocklist — kill Shorts, strip comments,
silence related videos, hide like/dislike numbers, and block any channel or
keyword that ever makes you groan.

**No tracking. No accounts. No sync.** Settings live in `chrome.storage.local`
and never leave your browser.

---

## Quick start

```bash
npm install
npm run dev      # vite + crxjs, hot reload
npm test         # vitest, jsdom
npm run build    # writes dist/ and release/extension.zip
npm run lint
```

Load `dist/` as an unpacked extension at `chrome://extensions` to test a
production build, or point Chrome at `dist/` while `npm run dev` is running.

---

## Architecture

Manifest V3, three contexts, one shared storage shape.

```
┌──────────────────────────┐    ┌─────────────────────────────┐
│  Background SW           │    │  Side panel (React)         │
│  src/background/index.js │◄──►│  src/sidepanel/             │
│   • storage seed/reset   │    │   • Feeds / Watch tabs      │
│   • context menus        │    │   • Blocklist editor        │
│   • per-tab pause        │    │   • Theme + reset           │
│   • YTC_WHO_AM_I bridge  │    └─────────────────────────────┘
└──────────────────────────┘                 ▲
            ▲                                │ chrome.storage
            │ chrome.runtime.sendMessage     ▼
┌──────────────────────────────────────────────────────────────┐
│  Content script (ISOLATED) — runs at document_start          │
│  src/content/isolated-world.js                               │
│   • pause-state    — combines globallyPaused + tabPaused:<id>│
│   • attribute-applier — sets html[data-ytc-*] from storage   │
│   • page-router    — home / shorts / watch handlers          │
│   • blocklist-filter — marks cards data-ytc-blocked          │
│  + src/styles/youtube.css keyed on html[data-ytc-*]          │
└──────────────────────────────────────────────────────────────┘
```

The CSS file does the heavy lifting for visual hiding. JS only steps in for
behaviors CSS cannot express: redirecting Shorts, swapping the home feed for
quick links, collapsing the description, and matching blocklist rules.

---

## How features work

`src/config/features.js` is the single source of truth.

Each feature entry declares:

- **`id`** — storage key (`hideShortsHome`, `hideComments`, …)
- **`tab`** — `feeds` or `watch` (which sidepanel tab renders it)
- **`group`** — group label inside the tab
- **`attr`** — `data-ytc-*` attribute toggled on `<html>` (CSS hook)
- **`default`** — install default
- **`kind`** — `css`, `js`, or `hybrid`
- **`extra`** — optional select control (e.g. `hideHomeFeedMode`)

The sidepanel renders directly from this registry; storage writes are picked
up by the content script via `chrome.storage.onChanged` and reflected on the
page without a reload.

### Pause semantics

There are two pause inputs:

- **`globallyPaused`** in `chrome.storage.local` — global kill-switch from
  the sidepanel.
- **`tabPaused:<tabId>`** in `chrome.storage.session` — per-tab pause from the
  YouTube context menu.

`src/content/modules/pause-state.js` derives a single `paused` boolean from
both. While paused:

- All `data-ytc-*` feature attributes are removed → CSS rules disengage.
- JS handlers (Shorts redirect, home redirect/quick-links, watch description
  collapse, blocklist scanner) become no-ops and undo their side-effects.

Unpausing rescans the page and re-applies state without a reload.

### Blocklist matching

`src/utils/blocklist-matcher.js` compiles user rules and supports:

- `substring` — case-insensitive default
- `wholeWord` — word-boundary match
- `regex` — falls back to "no match" if the pattern is invalid

Right-click any selected text on YouTube to block it as a keyword or channel.

---

## Project layout

```
extension/
├─ manifest.config.js              MV3 manifest (CRXJS)
├─ vite.config.js
├─ src/
│  ├─ background/
│  │  ├─ index.js                  message router + lifecycle
│  │  └─ handlers/
│  │     ├─ storage.js             defaults, seed, reset
│  │     ├─ content-bridge.js      YTC_WHO_AM_I (tab id lookup)
│  │     ├─ context-menu.js        block keyword/channel from selection
│  │     └─ tab-pause.js           per-tab pause toggle
│  ├─ content/
│  │  ├─ isolated-world.js         entry, runs at document_start
│  │  ├─ modules/
│  │  │  ├─ attribute-applier.js   html[data-ytc-*] sync
│  │  │  ├─ blocklist-filter.js    mark cards data-ytc-blocked
│  │  │  ├─ page-router.js         SPA-aware page handler dispatch
│  │  │  └─ pause-state.js         paused = global || per-tab
│  │  └─ pages/
│  │     ├─ home.js                empty / quick-links / redirect
│  │     ├─ shorts.js              redirect /shorts/:id → /watch?v=:id
│  │     └─ watch.js               collapse description on first paint
│  ├─ sidepanel/                   React 19 UI (Feeds / Watch / Blocklist)
│  ├─ config/
│  │  ├─ features.js               feature registry — edit here to add toggles
│  │  └─ featureFlags.js           build-time DEBUG_MODE flag
│  ├─ styles/youtube.css           html[data-ytc-*] hiding rules
│  └─ utils/                       blocklist-matcher, logger, messaging, …
└─ tests/                          vitest, jsdom, 220+ tests
```

---

## Adding a new feature toggle

1. Add an entry to `FEATURES` in `src/config/features.js` with a unique
   `id`, `attr`, `default`, `tab`, `group`, and `kind`.
2. If `kind` is `css` or `hybrid`, add a rule in `src/styles/youtube.css`
   keyed on `html[data-ytc-yourattr]`.
3. If `kind` is `js` or `hybrid`, gate the behavior on `isPausedNow()` from
   `pause-state.js` and consult `chrome.storage.local` for the toggle.
4. Add tests in `tests/integration/youtube-css.test.js` (CSS) and / or the
   relevant `tests/content/*.test.js` file.
5. Run `npm test`.

The sidepanel and storage seed update automatically from the registry.

---

## Privacy

youZen makes zero external network requests. The codebase contains no
analytics, telemetry, or remote-config endpoints — verify with:

```bash
git grep -nE "fetch\\(|XMLHttpRequest|sendBeacon|google-analytics" src
```

The only `fetch()` call is `chrome.runtime.getURL('_locales/.../messages.json')`
in `src/i18n/index.js`, which loads bundled locale files from the extension
itself.

---

## Licence

See repo root.
