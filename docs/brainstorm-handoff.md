# yt-cleanse — Brainstorm Handoff

> **Purpose of this file.** The user started brainstorming this project with Claude Code, hit token limits, and is continuing in Windsurf. This is the handoff. Read this top-to-bottom before doing anything. The user is `rheav7@gmail.com`. Date of handoff: 2026-04-19.

---

## 1. What we're building

**yt-cleanse** — a Chrome extension that declutters YouTube. Hides Shorts, comments, related videos, homepage feed, category chips, end-screen cards, and other noise. Also lets the user add a **keyword + channel blocklist** to hide matching video cards.

Aesthetic is already fully specified:
- `design-extension.md` — Rose-Water (light) / Midnight Cherry (dark) sidepanel design system. React 18 + Tailwind v4 + Lucide + Outfit font. Glass tiles, vision-gradient accents, 400–480 px side panel.
- `design-website.md` — future landing site (dark-first, atmospheric, `.shiny-cta` buttons). **Not in scope for now** — extension only.

---

## 2. Project context (what exists right now)

```
yt-cleanse/
├── design-extension.md            # Full UI design system (authoritative for visuals)
├── design-website.md              # Future website (ignore for now)
├── docs/
│   └── brainstorm-handoff.md      # THIS FILE
├── extension/                     # The user's personal Chrome extension template
└── sources of inspiration/        # 5 reference extensions, source included
```

### 2.1 The template (`extension/`)

Production-ready MV3 scaffold. React 19 + Vite 6 + Tailwind v4 + CRXJS. The user has poured work into this template — **follow its conventions, don't replace its patterns**. Key pieces:

- `src/background/index.js` — service-worker message router that composes handler modules (`handlers/storage.js`, etc.). Add a handler module per domain concern; it auto-wires.
- `src/content/` — MAIN world (`main-world.js`) + ISOLATED world (`isolated-world.js`) with a nonce-handshaked `postMessage` bridge. For a DOM-only declutter extension we can stay in ISOLATED.
- `src/sidepanel/` — React app with `Header`, `TabNav`, `Footer`, `SettingsMenu`, and tab panels under `components/tabs/`. Design-system components in `components/ui/` already match the Rose-Water/Midnight Cherry spec.
- Hooks: `useStorage` (reactive `chrome.storage.local` with cross-context sync), `useMessages`, `useTabInfo`.
- Utils: `storage.js`, `messaging.js`, `security.js`, `logger.js`, `analytics.js` (GA4, disabled by default).
- i18n via `public/_locales/`. Feature flags via `src/config/featureFlags.js` + Vite `define`.
- Tests with Vitest + jsdom.
- Currently targets `example.com` as the demo content-script match pattern — change to `*://www.youtube.com/*` + `*://m.youtube.com/*`.
- Has 3 demo tabs (Dashboard/DOM/Network) and their background handlers (`network.js`, `dom.js`) — these are demo content and should be stripped when we implement (see the template README section 5.11).

**Sidepanel design system components already available:** `Button`, `Card`, `Badge`, `Toggle`, `Skeleton`, `StatusMessage`, `TabNav`, `Header`, `Footer`, `OptionsDropdown` (settings menu), `ErrorBoundary`, plus `ThemeContext` and `ToastContext`. The design in `design-extension.md` also introduces a `GlassTile` pattern (3-up grid data chips) — not yet in the template, will need to be added.

### 2.2 Reference extensions — what each one does and what to borrow

Full source is in `sources of inspiration/`. Analysis:

1. **UnTrap** (`UnTrap-para-YouTube-…`) — the closest match to our scope. MV3. Ships per-YouTube-page handlers (`dynamicHomePage.js`, `dynamicVideoPage.js`, `dynamicShortsPage.js`, `dynamicSearchPage.js`, `dynamicChannelPage.js`) dispatched by a `MutationObserver` watching `location.href` on `document` (`dynamicOberver.js`). Uses a single runtime `<style data-runtime-styles>` element for dynamic CSS (`cssStyleManager.js`). Content filter (`ContentFilter/Desktop/contentFilterDesktop_blocker.js`) hides video cards by matching user rules against `textContent` / `[href]` / `[aria-label]` — uses the `MutationSummary` library to re-check as new cards stream in. Blocklist categories: `videos`, `channels`, `comments`, `posts`. Also: thumbnail filters (blur/grayscale), disable infinite-scroll shorts, context-menu "hide this channel" buttons on desktop, focus-session block screen that replaces `document.documentElement.innerHTML`. Borrow: the per-page handler pattern, the MutationObserver-on-URL pattern, the runtime-style manager, the content-filter approach. **Drop:** PRO/licensing, password protection, video summarization, scheduling — all out of scope for v1.

2. **Turn-Off-YouTube-Comments** — tiny, elegant. The whole extension is: (a) a popup with 3 checkboxes, (b) a minified background that sets defaults on install, (c) a single CSS file that uses HTML-attribute selectors on `<html>` (`cc_hide_chat=true`, `cc_hide_comments=true`, `cc_hide_comment_box=true`). The content script's only job is to read storage and set the attributes on `<html>`. **This is the cleanest possible engine for static on/off toggles** — zero JS runtime cost, no flicker if applied at `document_start`. **We should adopt this pattern as the baseline for all simple hide-toggles.**

3. **Enhancer for YouTube** — mature power-user extension. Strong on player tweaks, themes, keyboard shortcuts via manifest `commands`, pop-up player, speed/quality defaults. Different goal from ours but nice reference for: manifest `commands` (shortcut system), MAIN+ISOLATED split with `world: "MAIN"` in manifest, separate scripts per page type (`youtube-main.js`, `live-chat-main.js`, `shorts-isolated.js`, `embed-main.js`). Not directly copied.

4. **ProdYouTivity** (`Melhore-o-YouTube-e-Remova-Shorts-…`) — React-based, Vite-built. Uses two content-script groups: `document_start` group for `removeDistractions` / `removeDistractionsWithObserver` (beats the flash), `document_end` group for adding custom buttons into YouTube UI. Has a `pyt-quality.js` web-accessible-resource for MAIN-world quality control. Uses `scripting` + `contextMenus` permissions. Borrow: `document_start` CSS injection for flicker prevention.

5. **Transcription** — niche transcript tool. Not relevant to decluttering.

### 2.3 Patterns we will combine

**Hybrid engine:**

- **Baseline (CSS-attribute engine, borrowed from Turn-Off):** ship one static CSS file with selectors keyed on attributes we set on `<html>` at `document_start`. All simple on/off declutter toggles (hide shorts shelf, hide comments, hide related videos, etc.) use this path. Zero JS work per page, flicker-free.
- **Dynamic layer (borrowed from UnTrap):** for anything that needs JS — per-page redirects (`/shorts/*` → `/watch`), keyword/channel blocklist filtering of dynamically-streamed video cards, URL-change dispatch. Use a `MutationObserver` on `document` that watches `location.href`, plus `MutationSummary`-style re-checking for newly-added card elements.
- **Runtime style manager (borrowed from UnTrap):** single `<style data-runtime-styles>` injected into `<head>` for anything that needs per-user-config CSS (e.g. "hide this specific channel"). Rewrite `textContent` on config change.

---

## 3. Brainstorming progress (superpowers:brainstorming skill)

The skill is active. Its flow is:

1. ✅ Explore project context
2. ⏭️ Visual companion — **skipped** (design is already specified in `design-extension.md`; remaining questions are about feature scope and behavior, not visuals)
3. 🔄 Ask clarifying questions, one at a time (IN PROGRESS — stopped mid-Q2)
4. ⬜ Propose 2-3 implementation approaches with trade-offs
5. ⬜ Present sectioned design, get user approval section-by-section
6. ⬜ Write design spec to `docs/superpowers/specs/2026-04-19-yt-cleanse-design.md` and commit
7. ⬜ Spec self-review (placeholders / consistency / scope / ambiguity)
8. ⬜ User reviews written spec
9. ⬜ Invoke `superpowers:writing-plans` skill to produce the implementation plan

**HARD GATE:** Do not invoke any implementation skill, write any code, or scaffold anything until (a) the user approves the design and (b) they approve the written spec. This applies even if it feels trivial.

---

## 4. Decisions locked in so far

### 4.1 Scope (answered)

> **Q1 asked:** focused declutterer / + blocklist / full productivity suite / your own mix?
>
> **User chose: B — declutterer + keyword blocklist.** Later expansion to more features is a stated goal, so keep extension points clean but don't build them yet.

### 4.2 Feature checklist (awaiting answer — THIS IS WHERE WE STOPPED)

I proposed this 22-item list and asked the user to reply "keep all" or list numbers to drop / additions. User had not answered when we ran out of tokens.

**Homepage**
1. Hide the entire homepage feed (show empty state instead)
2. Hide Shorts shelves on homepage
3. Hide chip/category bar ("All / Music / Gaming / ...")
4. Hide "Breaking news" / featured shelves

**Everywhere**
5. Hide Shorts in the left sidebar nav
6. Hide Shorts tab on channel pages
7. Redirect any `/shorts/*` URL to the normal `/watch?v=` page
8. Hide the left sidebar entirely (or keep it collapsed)
9. Hide the "notification" bell button in the masthead
10. Hide trending / explore sections

**Video watch page**
11. Hide comments
12. Hide live chat
13. Hide related videos sidebar (the whole right column)
14. Hide end-screen cards
15. Hide "up next autoplay" toggle
16. Hide merch / ticket shelves below the video
17. Hide video description (collapsed by default)

**Search page**
18. Hide Shorts results in search
19. Hide "People also watched" / mixed shelves

**Subscriptions page**
20. Hide Shorts on the Subscriptions feed

**Blocklist tab**
21. Keyword blocklist — hide any video card whose title contains a word
22. Channel blocklist — hide any video by a blocked channel name

**Next action when the user resumes:** ask them to respond to this list.

---

## 5. Remaining questions to ask (in order, one at a time)

After Q2 is answered, these are the questions I'd plan to ask:

- **Q3 — Granularity of controls.** Do they want *one master toggle* per category (e.g. "Hide all Shorts") or *fine-grained* toggles (separate controls for Shorts-on-home, Shorts-in-search, Shorts-in-subs, etc.)? Fine-grained means more UI but more power. My gut: master toggle per concept + a "customize" affordance.
- **Q4 — Default-on vs default-off.** Ship with everything decluttered by default, or start empty and let the user opt in? Default-on is more opinionated (brand-aligned with the design spec's "confident, a little mischievous" tone) but more disruptive on first install.
- **Q5 — Tab layout in the sidepanel.** The design spec implies multiple tabs via `TabNav`. Proposal: **Clean** (all the hide-toggles grouped by page), **Blocklist** (keyword + channel rules), **Settings** (theme, region, reset). Confirm or adjust.
- **Q6 — Blocklist matching behavior.** Case-sensitive? Substring vs whole-word? Regex allowed (UnTrap supports it)? Apply to channel name, title, or both?
- **Q7 — Empty-state design for hidden homepage.** If they keep item #1, what should replace the feed? UnTrap shows nothing; ProdYouTivity shows a focus message. Given the design language, I'd propose a vision-gradient empty state with a quick link to Subscriptions.
- **Q8 — Extension on/off master switch.** Where does it live? The design spec's Settings menu has a "Disable" toggle; confirm we want one global kill-switch.
- **Q9 — Analytics / telemetry.** Template has GA4 scaffolding (disabled by default). Keep disabled for v1? Yes = ship minimal, no = we wire it up.

Don't ask these all at once. One per turn.

---

## 6. Architecture sketch (tentative — do not commit to a spec yet)

This is my current mental model. The design section 5 will refine it. Not approved yet.

```
extension/src/
├── background/
│   ├── index.js                      # Existing router — unchanged
│   └── handlers/
│       └── storage.js                # Existing — kept
│       (network.js, dom.js — delete per template §5.11; demo only)
├── content/
│   ├── isolated-world.js             # Entry point at document_start
│   └── modules/
│       ├── attribute-applier.js      # Reads storage, sets html[data-ytc-*] attributes
│       ├── page-router.js            # location.href watcher → dispatches per-page handlers
│       ├── pages/
│       │   ├── home.js               # e.g. redirect home to subscriptions (if configured)
│       │   ├── shorts.js             # redirect /shorts/* → /watch
│       │   ├── video.js              # video-page-specific behaviors
│       │   └── search.js
│       ├── blocklist-filter.js       # MutationSummary-style card filter for keyword/channel rules
│       └── runtime-style-manager.js  # Single <style data-ytc-runtime> injection helper
├── sidepanel/
│   ├── App.jsx                       # Tab shell (existing pattern)
│   └── components/
│       ├── ui/                       # Existing + new GlassTile
│       └── tabs/
│           ├── CleanTab.jsx          # Categorised toggles for the 20 declutter features
│           ├── BlocklistTab.jsx      # Keyword + channel rules
│           └── (no Dashboard/DOM/Network — deleted)
├── styles/
│   ├── global.css                    # Sidepanel theme (existing, update to Rose-Water tokens)
│   └── youtube.css                   # Injected into YouTube — html[data-ytc-*] selectors
├── config/
│   └── features.js                   # Single source of truth: feature list with id/label/default/selector-group
└── (existing: hooks, utils, i18n, config)
```

Key ideas:

- `config/features.js` is the single source of truth — one array of objects like `{ id: 'hideHomeShorts', label: 'Hide Shorts on homepage', default: true, attr: 'data-ytc-home-shorts' }`. Both the sidepanel UI and the content-script attribute applier consume it.
- `youtube.css` is written by hand once, with one CSS rule per feature keyed on the attribute. Adding a feature = 1 entry in `features.js` + 1 CSS rule.
- Content script run order: `document_start` → inject CSS link (already via manifest) + read storage + set all `data-ytc-*` attributes on `<html>`. Then on storage change, update attributes reactively.
- Blocklist and URL redirects are the only things that need actual JS.

---

## 7. Resumption checklist for the next Claude

1. **Read this file end-to-end before doing anything.**
2. Read `design-extension.md` for visual language (already read and summarised above, but refer back for component-level specifics like the GlassTile recipe).
3. If the user has answered Q2, acknowledge their edits and move to **Q3 (granularity)**.
4. If the user has not answered, ask Q2 again (copy the list from §4.2).
5. Continue the brainstorming skill flow: finish clarifying questions → propose approaches → present sectioned design → write spec → self-review → user review → **then** invoke `superpowers:writing-plans` (not any other skill).
6. **Do not start implementation.** No code changes to `extension/` until the spec is approved.

---

## 8. Memory note for Claude

- This is a greenfield project; `extension/` is the user's personal template and should be preserved/respected, not rewritten.
- The user cares deeply about design polish — the two `.md` design specs are not suggestions, they are the contract. Follow them exactly.
- User prefers B scope (declutter + blocklist). Expansion is welcome later but not in v1.
