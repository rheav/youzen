<div align="center">

<img src="extension/public/icons/icon128.png" alt="youZen logo" width="96" height="96" />

# youZen

**Your YouTube, but softer.**

A gentle Chrome extension that quiets YouTube. Hide Shorts, silence comments, block the chaos. Designed for focused, intentional watching.

[![License: MIT](https://img.shields.io/badge/license-MIT-A8C9A0?style=flat-square)](LICENSE)
[![Version](https://img.shields.io/badge/version-1.0.0-A8C9A0?style=flat-square)](extension/manifest.config.js)
[![Manifest V3](https://img.shields.io/badge/manifest-v3-7FA87F?style=flat-square)](https://developer.chrome.com/docs/extensions/mv3/intro/)
[![Tests](https://img.shields.io/badge/tests-223%20passing-7FA87F?style=flat-square)](extension/tests)
[![PRs welcome](https://img.shields.io/badge/PRs-welcome-A8C9A0?style=flat-square)](#-contributing)

[![Chrome](https://img.shields.io/badge/Chrome-supported-A8C9A0?style=flat-square&logo=googlechrome&logoColor=white)](#-install)
[![Edge](https://img.shields.io/badge/Edge-supported-A8C9A0?style=flat-square&logo=microsoftedge&logoColor=white)](#-install)
[![Brave](https://img.shields.io/badge/Brave-supported-A8C9A0?style=flat-square&logo=brave&logoColor=white)](#-install)
[![Arc](https://img.shields.io/badge/Arc-supported-A8C9A0?style=flat-square)](#-install)

[![Built with Astro](https://img.shields.io/badge/website-Astro-A8C9A0?style=flat-square&logo=astro&logoColor=white)](https://astro.build)
[![Built with React](https://img.shields.io/badge/sidepanel-React%2019-A8C9A0?style=flat-square&logo=react&logoColor=white)](https://react.dev)
[![Built with Vite](https://img.shields.io/badge/bundler-Vite-A8C9A0?style=flat-square&logo=vite&logoColor=white)](https://vite.dev)
[![Tailwind](https://img.shields.io/badge/styles-Tailwind%20v4-A8C9A0?style=flat-square&logo=tailwindcss&logoColor=white)](https://tailwindcss.com)

[![No tracking](https://img.shields.io/badge/no%20tracking-yes-7FA87F?style=flat-square)](#-privacy)
[![No accounts](https://img.shields.io/badge/no%20accounts-ever-7FA87F?style=flat-square)](#-privacy)
[![Open source](https://img.shields.io/badge/open%20source-yes-7FA87F?style=flat-square)](#-license)

[**Website**](https://youzen.app) · [**Docs**](https://youzen.app/docs) · [**Chrome Web Store**](#) (coming soon) · [**Report a bug**](https://github.com/rheav/youzen/issues/new)

</div>

---

## Why youZen

YouTube used to be a place you went. Now it's a place that pulls. Shorts you didn't ask for. Comments you didn't want to read. Up-next videos that turn a five-minute lookup into ninety minutes of "how did I get here".

**youZen is one sidepanel and a small pile of switches.** Flip what you want quiet. Block what you never want to see again. The video plays. Nothing else performs for your attention.

> Quiet on, quiet off.

---

## Highlights

- **Hide Shorts, everywhere** — homepage, sidebar, channel tabs, search, Subscriptions. One master toggle, or pick per-surface.
- **Declutter the homepage** — replace the algorithmic feed with a quick-links card, redirect to Subscriptions, or just leave it empty.
- **Silence the watch page** — comments, related sidebar, end-screen cards, autoplay, merch shelves, like / dislike counts. Each one a single switch.
- **Redirect Shorts** — opening a `/shorts/<id>` URL drops you on the regular watch page with full controls. No vertical-scroll cage.
- **Two-list blocklist** — keyword and channel rules, with substring / whole-word / regex modes. Right-click any selection on YouTube to add it.
- **Two pauses** — per-tab (right-click → "Pause on this tab") and a global kill-switch in the sidepanel header. Your settings stay intact while paused.
- **Light & dark theme** — sidepanel follows your OS by default; remembers any explicit choice.
- **Reset to defaults** — wipes every key, re-seeds the install defaults, one click.
- **Truly local** — no analytics, no telemetry, no remote configuration, no account, no sync. Settings live in `chrome.storage.local`.

Full reference of every toggle: **[youzen.app/docs](https://youzen.app/docs)**

---

## Install

### Chrome Web Store

[![Chrome Web Store](https://img.shields.io/badge/Chrome%20Web%20Store-coming%20soon-A8C9A0?style=for-the-badge&logo=googlechrome&logoColor=white)](#)

> Listing pending review. Star this repo to get notified when it ships.

### Manual install (developer mode)

Until the store listing is live, you can run a production build locally:

```bash
git clone https://github.com/rheav/youzen.git
cd youzen/extension
npm install
npm run build
```

Then in Chrome / Edge / Brave / Arc:

1. Open `chrome://extensions`
2. Toggle **Developer mode** (top-right)
3. Click **Load unpacked**
4. Pick the `extension/dist` folder you just built
5. Pin youZen to your toolbar — click the leaf to open the side panel

A signed `release/extension.zip` is also produced by the build for sideloading.

---

## The website

The marketing site at **[youzen.app](https://youzen.app)** lives in the same monorepo (`/website`). It's an Astro 5 + Tailwind 4 build with hand-rolled animations, a leaf burst on hover, and the full feature reference at [`/docs`](https://youzen.app/docs).

```bash
cd website
npm install
npm run dev      # local preview
npm run build    # static output to dist/
```

---

## Project structure

This repo is a small monorepo: the extension and the marketing site share nothing at runtime, but they share branding, tone, and a release cadence.

```
youzen/
├─ extension/                 # the Chrome extension (Manifest V3)
│  ├─ manifest.config.js      #   CRXJS manifest source
│  ├─ src/
│  │  ├─ background/          #   service worker, message router
│  │  ├─ content/             #   isolated-world content script + page handlers
│  │  ├─ sidepanel/           #   React 19 UI (Feeds / Watch / Blocklist tabs)
│  │  ├─ config/features.js   #   feature registry — single source of truth
│  │  ├─ styles/youtube.css   #   html[data-ytc-*] hiding rules
│  │  └─ utils/               #   blocklist matcher, logger, messaging, …
│  ├─ tests/                  #   223 unit + integration tests (vitest, jsdom)
│  ├─ public/icons/           #   icon.svg + 16 / 32 / 48 / 128 PNGs
│  └─ README.md               #   architecture deep-dive
│
├─ website/                   # youzen.app — Astro 5 + Tailwind 4
│  ├─ src/pages/              #   index.astro, docs.astro
│  ├─ src/components/         #   Hero, Scenarios, AppPreview, FeatureDemos, …
│  ├─ src/styles/global.css   #   leafy palette + reveal animation
│  └─ public/                 #   favicon (shared with extension), images/
│
└─ README.md                  # ← you are here
```

---

## Development

### Extension

```bash
cd extension
npm install
npm run dev      # Vite + CRXJS, hot reload
npm test         # Vitest, jsdom — 223 tests
npm run lint     # ESLint
npm run build    # writes dist/ + release/extension.zip
npm run icons    # regenerate PNG icons from public/icons/icon.svg
```

Load `extension/dist/` as an unpacked extension at `chrome://extensions`. While `npm run dev` is running, file changes hot-reload the side panel and trigger an extension reload for content / background changes.

See [`extension/README.md`](extension/README.md) for the full architecture, the feature-registry pattern, pause semantics, and how to add a new toggle.

### Website

```bash
cd website
npm install
npm run dev      # Astro dev server
npm run build    # static output
npm run preview  # serve the production build
```

### Stack at a glance

| Surface       | Stack                                                       |
| :------------ | :---------------------------------------------------------- |
| Extension     | Manifest V3 · CRXJS · Vite · React 19 · Vitest              |
| Side panel UI | React 19 + Tailwind 4 + Lucide                              |
| Content layer | Vanilla JS + a single CSS file keyed on `html[data-ytc-*]`  |
| Website       | Astro 5 · Tailwind 4 · Lucide                               |
| Icons         | Single master SVG → resvg → PNGs                            |

---

## Privacy

> **Nothing leaves your browser.**

- No analytics, no telemetry, no crash reporter, no error beacon
- No account, no sign-up, no remote configuration, no sync across devices
- Settings live in `chrome.storage.local`; per-tab pause in `chrome.storage.session`
- The only `host_permission` is `*://www.youtube.com/*` — youZen does not run on any other site
- The codebase is auditable; you can verify it makes zero network calls:

```bash
git grep -nE "fetch\(|XMLHttpRequest|sendBeacon|google-analytics" extension/src
# the only hit is chrome.runtime.getURL() loading bundled locale JSON
```

Read the full privacy section on the docs page: [youzen.app/docs#privacy](https://youzen.app/docs#privacy)

---

## Roadmap

- [x] Hide Shorts on every surface
- [x] Homepage replacement (empty / quick links / redirect)
- [x] Watch-page declutter (comments, related, action bar, …)
- [x] Two-list blocklist with substring / whole-word / regex
- [x] Per-tab + global pause with full state restoration
- [x] Light / dark theme
- [x] Marketing site + full docs
- [ ] Chrome Web Store listing
- [ ] Firefox port (MV3 parity is close)
- [ ] Per-rule effective dates ("block this until next Monday")
- [ ] Optional sync via a self-hosted backend (still no third parties)

Have an idea? [Open an issue](https://github.com/rheav/youzen/issues/new) — bugs and suggestions both go in the same place for now.

---

## Contributing

Contributions are welcome — especially bug reports, selector fixes when YouTube ships a redesign, and translations.

1. Fork the repo and create a feature branch.
2. Run `cd extension && npm install && npm test` before you start so you have a green baseline.
3. For new toggles, follow the recipe in [`extension/README.md`](extension/README.md#adding-a-new-feature-toggle) — every feature is one entry in the registry, one CSS rule (or one JS handler), and one test.
4. Run `npm test` and `npm run lint` before opening the PR.
5. Keep the description short — what changed, why.

For larger changes (new tab in the sidepanel, new pause semantics, etc.), open an issue first so we can sketch the shape together.

### Code style

- 2-space indent, semicolons, single quotes in JS / TS, double quotes in JSX
- Prettier + ESLint enforced via `npm run lint` and `npm run format`
- No new runtime dependencies in the extension without discussion
- New JS behaviors in the content script **must** gate on `isPausedNow()`

---

## Acknowledgements

- The countless people who have publicly journaled about leaving algorithmic feeds. The whole project is a love letter to that body of writing.
- [Lucide](https://lucide.dev) for the icon set.
- [Astro](https://astro.build), [Tailwind CSS](https://tailwindcss.com), and [CRXJS](https://crxjs.dev) for making the build a non-event.

---

## License

[MIT](LICENSE) — do whatever, just be kind.

---

<div align="center">

Made slowly, on purpose. 🍃

[Website](https://youzen.app) · [Docs](https://youzen.app/docs) · [Issues](https://github.com/rheav/youzen/issues) · [Releases](https://github.com/rheav/youzen/releases)

</div>
