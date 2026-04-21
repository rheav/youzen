# yt-cleanse — Design Specification

> **Status:** Approved design. Authoritative input to the implementation plan.
> **Date:** 2026-04-19
> **Handoff predecessor:** `docs/brainstorm-handoff.md`
> **Aesthetic contract:** `design-extension.md` (Rose-Water / Midnight Cherry)
> **Out-of-scope contract:** `design-website.md` (future landing site — not touched in v1)

---

## 0. Decisions recap

Locked during brainstorming, in order:

| #        | Question                    | Decision                                                                                                             |
| -------- | --------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| Q1       | Scope                       | **B** — declutterer + keyword/channel blocklist. Clean extension points but no v1.1 features built.                  |
| Q2       | Feature checklist           | Keep all 22 items.                                                                                                   |
| Q3       | Granularity of controls     | **C** — master toggle per concept + expand-to-customize sub-toggles.                                                 |
| Q4       | Defaults on fresh install   | **Hybrid** — safe items ON, destructive items OFF, blocklist empty.                                                  |
| Q5       | Sidepanel tab layout        | **3 tabs (Feeds / Watch / Blocklist) + settings dropdown** in the header.                                            |
| Q6       | Blocklist matching          | **2 lists** (Keywords + Channels), substring/case-insensitive default, per-rule Whole-word / Regex / Case-sensitive. |
| Q7       | Homepage-hidden replacement | **User-configurable dropdown** on the #1 toggle: `Empty` / `Quick links card` / `Redirect to Subscriptions`.         |
| Q8       | Kill-switch                 | **Global in settings + per-tab pause via `chrome.contextMenus`** (session-scoped).                                   |
| Q9       | Analytics                   | **Disabled.** Scaffolding kept; flag off; no UI.                                                                     |
| Approach | Engine                      | **Hybrid** — CSS-attribute baseline + thin per-page JS for redirects / blocklist / empty-state / pause.              |

---

## 1. Scope & feature inventory

**In scope (v1).** A Chrome MV3 extension that declutters YouTube on the desktop web and provides a user-managed keyword/channel blocklist.

**Out of scope (v1).** Player tweaks, transcription, AI, scheduling, focus-mode block screens, mobile-web full coverage, per-channel shortcut, thumbnail filters, `chrome.storage.sync`, import/export, analytics UI, landing website.

### 1.1 The 22 features mapped to tabs and masters

#### Tab: **Feeds**

- **Master: _Hide Shorts across YouTube_** — sub-toggles:
  - #2 Hide Shorts shelves on homepage
  - #5 Hide Shorts in left sidebar nav
  - #6 Hide Shorts tab on channel pages
  - #18 Hide Shorts in search results
  - #20 Hide Shorts in Subscriptions feed
- **Master: _Declutter homepage_** — sub-toggles:
  - #1 Hide homepage feed _(with dropdown: Empty / Quick links card / Redirect to Subscriptions)_
  - #3 Hide chip/category bar
  - #4 Hide "Breaking news" / featured shelves
- **Master: _Declutter search_** — sub-toggles:
  - #19 Hide "People also watched" / mixed shelves
- **Group (no master): _Navigation chrome_** — individual toggles:
  - #8 Hide left sidebar entirely
  - #9 Hide notification bell
  - #10 Hide trending / explore entries in sidebar

#### Tab: **Watch**

- **Master: _Hide comments area_** — sub-toggles:
  - #11 Hide comments
  - #12 Hide live chat
- **Master: _Declutter player surroundings_** — sub-toggles:
  - #13 Hide related videos sidebar
  - #14 Hide end-screen cards
  - #15 Hide "up next autoplay" toggle
  - #16 Hide merch / ticket shelves
  - #17 Collapse video description by default
- **Standalone:**
  - #7 Redirect `/shorts/*` → `/watch?v=…`

#### Tab: **Blocklist**

- #21 Keyword rules (matches video titles)
- #22 Channel rules (matches channel name text)

#### Settings gear popover (header)

- Global kill-switch (Toggle: _yt-cleanse is active_)
- Theme (auto / light / dark)
- Toggles: _Remember last tab_, _Compact mode_
- Reset to defaults
- Version / about

#### Context menu (right-click on any YouTube page)

- _Pause yt-cleanse on this tab_ ↔ _Resume yt-cleanse on this tab_ (session-scoped per tab)

### 1.2 Counts

22 features → 5 masters + 4 standalone in Feeds + 2 masters + 1 standalone in Watch + 2 lists in Blocklist. Sidepanel main surface shows ~11 visible rows with all masters collapsed.

---

## 2. Defaults & first-run

### 2.1 Default ON ("safe" declutter)

- #2 Hide Shorts shelves on homepage
- #5 Hide Shorts in left sidebar nav
- #6 Hide Shorts tab on channel pages
- #7 Redirect `/shorts/*` → `/watch?v=…`
- #14 Hide end-screen cards
- #15 Hide "up next autoplay" toggle
- #16 Hide merch / ticket shelves
- #18 Hide Shorts in search results
- #20 Hide Shorts in Subscriptions feed

### 2.2 Default OFF ("destructive")

- #1 Hide homepage feed (`hideHomeFeedMode` defaults to `quickLinks`)
- #3 Hide chip/category bar
- #4 Hide "Breaking news" / featured shelves
- #8 Hide left sidebar entirely
- #9 Hide notification bell
- #10 Hide trending / explore
- #11 Hide comments
- #12 Hide live chat
- #13 Hide related videos sidebar
- #17 Collapse video description by default
- #19 Hide "People also watched" / mixed shelves
- #21, #22 Blocklist rules (empty lists)

### 2.3 First-run experience

- On `chrome.runtime.onInstalled` (reason === `install`), service worker seeds `chrome.storage.local` with defaults and registers the context menu.
- First time the user opens the sidepanel (or navigates to YouTube with the sidepanel open), the **Feeds** tab renders a one-time welcome Info strip — vivid variant from design spec §5.10:
  > _yt-cleanse is cleaning up your YouTube. Shorts, end-screens and merch are hidden by default. Flip the switches below to go further._
- Dismissible via `×`. Dismissal persisted as `flags.welcomeDismissed = true`. Not re-shown.
- No tour, modal, or multi-step wizard.

---

## 3. Sidepanel UI

### 3.1 Shell

Inherits the template's `App.jsx` pattern and design spec §4:

```
Header (logo + wordmark + settings gear) → TabNav → Tab body → Footer
```

- Outer frame: `border border-rich-rose-water` (light) / `border border-white/5` (dark) + `overflow-hidden`.
- Atmosphere: rose-water diagonal (light) / `.bg-dark-app` radial halo stack (dark) — design spec §3 verbatim.
- Panel width 380–480px; components cap at `max-w-[480px]`.

### 3.2 Header (§5.1 of design spec)

- 40px rounded-full logo with pink-glow shadow `shadow-lg shadow-core-pink/50`.
- Wordmark `yt-cleanse` in `.text-vision-gradient`, `font-extralight text-[28px] leading-none tracking-tight`.
- Fixed gear button top-right (§5.8) → settings popover.

### 3.3 TabNav (§5.2)

- Labels use code-bracket ornament: `<{Feeds} />`, `<{Watch} />`, `<{Blocklist} />`.
- Active tab: vision-gradient text-clip + animated gradient + `border-azure-sky/30 shadow-xl shadow-azure-sky/10`.
- Horizontal scroll-snap row, auto-centers active, supports 50px swipe between tabs.

### 3.4 Master + customize pattern

Implemented via the design spec's `Card` component (§5.3) with its built-in collapsible chevron.

```
┌─ Card ──────────────────────────────────────┐
│  Hide Shorts across YouTube        [Toggle] │  ← master header row
│  Everywhere, every shelf             ▾      │  ← subtitle + chevron
├─────────────────────────────────────────────┤
│  Homepage Shorts shelves         [Toggle]   │  ← sub-rows
│  Left sidebar nav                [Toggle]   │
│  Channel Shorts tab              [Toggle]   │
│  Search results                  [Toggle]   │
│  Subscriptions                   [Toggle]   │
└─────────────────────────────────────────────┘
```

**Semantics:**

- Master ON → all subs ON. Master OFF → all subs OFF.
- Flipping a single sub puts the master into **indeterminate** state (half-filled / striped track). Requires extending `Toggle` with an `indeterminate` prop (see §10.3).
- Clicking indeterminate master sets all subs ON.
- Chevron and master Toggle are separate affordances on the same row — chevron controls expansion only, Toggle controls state only.

**Sub-row shape:** `text-xs` label + right-aligned Toggle, `py-1.5 px-2`, hover `bg-bright-silver-lining/10`, no per-row border.

### 3.5 Feeds tab layout (top-to-bottom)

1. **Info strip** (plain): _"Clean up feeds, search results, and navigation."_
2. **Card: Hide Shorts across YouTube** — master + 5 subs.
3. **Card: Declutter homepage** — master + 3 subs. The #1 row has an inline 3-option select for Empty / Quick links card / Redirect to Subscriptions (shown only when #1 is enabled).
4. **Card: Declutter search** — master + 1 sub (#19).
5. **Card: Navigation chrome** — no master; holds 3 standalone toggles (#8, #9, #10).

### 3.6 Watch tab layout

1. **Info strip** (plain): _"Clean up the video watch page."_
2. **Card: Hide comments area** — master + 2 subs.
3. **Card: Declutter player surroundings** — master + 5 subs.
4. **Standalone row** — _Redirect Shorts to normal video page_ (#7), with a small `Redirect` icon.

### 3.7 Blocklist tab layout

1. **Info strip** (plain): _"Hide any video by keyword or channel."_
2. **Card: Keyword rules** — header shows `Badge` with rule count. Body:
   - Add row: text input + primary `Add` button. Submit on Enter.
   - Rule rows: `[Toggle enabled] [rule text] [⚙ advanced] [× delete]`. Disabled rows use `opacity: 0.55` + strikethrough.
   - `⚙` opens an inline expanded area with Mode radios (Substring / Whole word / Regex), Case-sensitive checkbox, optional live preview.
   - Empty state: _"No rules yet. Try adding `mrbeast` or `shorts recap`."_
3. **Card: Channel rules** — identical structure.
4. Muted footer note (`text-[10px]`): _"Substring, case-insensitive unless Whole-word or Regex is enabled per rule."_

### 3.8 Settings gear popover (§5.8)

Sections, in order:

1. **Master kill-switch** — Toggle labeled _yt-cleanse is active_. Writes `globallyPaused`.
2. **Theme** — Sun/Moon pair, active uses vision-gradient fill.
3. **Toggles** — _Remember last tab_, _Compact mode_.
4. **Reset** — dashed-outline secondary button. Two-step confirm.
5. **Version / about** — muted footer line.

Removed vs the template's default sections: Visible Tabs, Default Tab, Region, Auto-refresh.

### 3.9 Context menu

Entry: _Pause yt-cleanse on this tab_ ↔ _Resume yt-cleanse on this tab_. Registered for `documentUrlPatterns: ['*://*.youtube.com/*']`. State session-scoped per tab.

### 3.10 Toasts

Use the template's `ToastContext`:

- "Settings reset" (1500ms)
- "Paused on this tab" / "Resumed" (1500ms)
- "Rule added" / "Rule removed" (1500ms)

### 3.11 Loading & error

Each tab is `React.lazy` + `<Suspense fallback={LoadingSkeleton}>` with the vision-gradient animated `loading` word. `ErrorBoundary` keyed by `activeTab` — per template.

---

## 4. Feature data model (`src/config/features.js`)

Single source of truth. One flat array of feature entries + a groups index. Used by the sidepanel UI (to render Cards + toggles) and by the content script's attribute-applier (to drive `html[data-ytc-*]` attributes from storage).

### 4.1 Entry shape

```ts
type FeatureKind = "css" | "js" | "hybrid";

type Feature =
  | {
      id: string; // unique; also storage key for its on/off flag
      tab: "feeds" | "watch";
      group: string | null; // groups[tab][?].id or null for loose/standalone
      label: string;
      description?: string;
      attr: string; // `data-ytc-*` — set on <html> when storage[id] is true
      default: boolean;
      kind: FeatureKind;
      extra?: FeatureExtra; // optional secondary control
    }
  | {
      id: string;
      tab: "feeds" | "watch";
      isMaster: true;
      label: string;
      description?: string;
      subs: string[]; // feature ids; master state derives from these
    };

type FeatureExtra = {
  kind: "select";
  key: string; // separate storage key for the select value
  default: string;
  options: Array<{ value: string; label: string }>;
  // Applier also writes data-ytc-{id}-mode="<value>" on <html>.
};
```

### 4.2 Groups index

```ts
export const GROUPS = {
  feeds: [
    { id: "hideShorts", title: "Hide Shorts across YouTube", hasMaster: true },
    { id: "declutterHome", title: "Declutter homepage", hasMaster: true },
    { id: "declutterSearch", title: "Declutter search", hasMaster: true },
    { id: "navChrome", title: "Navigation chrome", hasMaster: false },
  ],
  watch: [
    { id: "commentsArea", title: "Hide comments area", hasMaster: true },
    {
      id: "declutterWatch",
      title: "Declutter player surroundings",
      hasMaster: true,
    },
    { id: null, title: null, hasMaster: false, loose: true },
  ],
};
```

### 4.3 Full feature entries

See implementation time for the exact array. Authoritative list (id → attr → kind → default):

| id                     | tab   | group           | attr                       | kind   | default |
| ---------------------- | ----- | --------------- | -------------------------- | ------ | ------- |
| hideHomeShorts         | feeds | hideShorts      | `data-ytc-home-shorts`     | css    | true    |
| hideNavShorts          | feeds | hideShorts      | `data-ytc-nav-shorts`      | css    | true    |
| hideChannelShortsTab   | feeds | hideShorts      | `data-ytc-channel-shorts`  | css    | true    |
| hideSearchShorts       | feeds | hideShorts      | `data-ytc-search-shorts`   | css    | true    |
| hideSubsShorts         | feeds | hideShorts      | `data-ytc-subs-shorts`     | css    | true    |
| hideHomeFeed           | feeds | declutterHome   | `data-ytc-home-feed`       | hybrid | false   |
| hideChipBar            | feeds | declutterHome   | `data-ytc-chip-bar`        | css    | false   |
| hideBreakingShelves    | feeds | declutterHome   | `data-ytc-breaking`        | css    | false   |
| hideSearchMixedShelves | feeds | declutterSearch | `data-ytc-search-mixed`    | css    | false   |
| hideLeftSidebar        | feeds | navChrome       | `data-ytc-left-sidebar`    | css    | false   |
| hideNotificationBell   | feeds | navChrome       | `data-ytc-notif-bell`      | css    | false   |
| hideTrending           | feeds | navChrome       | `data-ytc-trending`        | css    | false   |
| hideComments           | watch | commentsArea    | `data-ytc-comments`        | css    | false   |
| hideLiveChat           | watch | commentsArea    | `data-ytc-live-chat`       | css    | false   |
| hideRelatedVideos      | watch | declutterWatch  | `data-ytc-related`         | css    | false   |
| hideEndScreenCards     | watch | declutterWatch  | `data-ytc-end-cards`       | css    | true    |
| hideAutoplayToggle     | watch | declutterWatch  | `data-ytc-autoplay-toggle` | css    | true    |
| hideMerchShelves       | watch | declutterWatch  | `data-ytc-merch`           | css    | true    |
| hideDescription        | watch | declutterWatch  | `data-ytc-collapse-desc`   | hybrid | false   |
| redirectShorts         | watch | null            | `data-ytc-redirect-shorts` | js     | true    |

Masters (synthetic entries):

| id              | tab   | subs                                                                                         |
| --------------- | ----- | -------------------------------------------------------------------------------------------- |
| hideShorts      | feeds | hideHomeShorts, hideNavShorts, hideChannelShortsTab, hideSearchShorts, hideSubsShorts        |
| declutterHome   | feeds | hideHomeFeed, hideChipBar, hideBreakingShelves                                               |
| declutterSearch | feeds | hideSearchMixedShelves                                                                       |
| commentsArea    | watch | hideComments, hideLiveChat                                                                   |
| declutterWatch  | watch | hideRelatedVideos, hideEndScreenCards, hideAutoplayToggle, hideMerchShelves, hideDescription |

Extra:

```js
{ id: 'hideHomeFeed', ..., extra: {
    kind: 'select',
    key: 'hideHomeFeedMode',
    default: 'quickLinks',
    options: [
      { value: 'empty',      label: 'Empty' },
      { value: 'quickLinks', label: 'Quick links card' },
      { value: 'redirect',   label: 'Redirect to Subscriptions' }
    ]
}}
```

### 4.4 Adding a feature

1. Add entry to `FEATURES`. 2. Add one CSS rule (if `kind` uses CSS). 3. Add to the right master's `subs` array (if grouped under a master). Done.

---

## 5. CSS-attribute engine

### 5.1 Manifest

```jsonc
"content_scripts": [{
  "matches": ["*://www.youtube.com/*", "*://m.youtube.com/*"],
  "run_at": "document_start",
  "js":  ["src/content/isolated-world.js"],
  "css": ["src/styles/youtube.css"]
}]
```

### 5.2 Attribute-applier

Lives at `src/content/modules/attribute-applier.js`. On boot (and on every `chrome.storage.onChanged`):

```js
async function applyAttributes() {
  const [local, session] = await Promise.all([
    chrome.storage.local.get(null),
    chrome.storage.session.get(`tabPaused:${currentTabId}`),
  ]);
  const paused = local.globallyPaused || session[`tabPaused:${currentTabId}`];
  const html = document.documentElement;

  if (paused) {
    for (const f of FEATURES) if (f.attr) html.removeAttribute(f.attr);
    html.setAttribute("data-ytc-paused", "");
    return;
  }

  html.removeAttribute("data-ytc-paused");
  for (const f of FEATURES) {
    if (f.isMaster || f.kind === "js") continue;
    if (local[f.id]) html.setAttribute(f.attr, "");
    else html.removeAttribute(f.attr);
    if (f.extra?.kind === "select") {
      html.setAttribute(
        `${f.attr}-mode`,
        local[f.extra.key] ?? f.extra.default,
      );
    }
  }
}
```

`currentTabId` is obtained via a one-shot message to the service worker (`{ type: 'YTC_WHO_AM_I' }` → replies with `sender.tab.id`), cached for the script's lifetime.

### 5.3 Stylesheet (`src/styles/youtube.css`)

One hand-written rule per CSS-kind feature, keyed on `html[data-ytc-*]`. Conventions:

- Use semantic custom element names (`ytd-rich-shelf-renderer`, `ytd-comments`) over generated classes.
- Prefer attribute selectors (`[is-shorts]`, `[aria-label="Shorts"]`, `[href*="/shorts/"]`) over visual position.
- `:has()` allowed — baseline Chrome ≥ 105.
- Group related selectors in one rule so one YouTube rename breaks one feature, not five.
- Blocklist hidden cards share one rule: `[data-ytc-blocked] { display: none !important; }`.

### 5.4 Pause mechanics

Pause is expressed as: "all `data-ytc-*` feature attributes removed + `data-ytc-paused` set". CSS rules no longer match → YouTube renders vanilla. JS modules read `data-ytc-paused` to short-circuit.

### 5.5 What does NOT live here

- Per-user dynamic CSS (reserved for `runtime-style-manager.js`, a scaffold for v1.1).
- Blocklist filtering — JS (§6.3).
- Empty-state card visuals — inlined by the content-script page handler.

---

## 6. JS layer

All modules live in the ISOLATED world. No MAIN-world bridge needed for v1.

### 6.1 Page router (`src/content/modules/page-router.js`)

One shared `MutationObserver` watching `document` for `location.href` changes. On change, `detectPage(url)` maps the URL to one of `home | watch | shorts | search | subs | channel`. Lazy-imports the matching module from `./pages/*`, calls `enter()`, retains an optional `cleanup()` for leaving.

Page detection patterns:

- `/` → `home`
- `/watch` → `watch`
- `/shorts/*` → `shorts`
- `/results` → `search`
- `/feed/subscriptions` → `subs`
- `/@*` or `/channel/*` → `channel`

Re-dispatches on `chrome.storage.onChanged` events that affect JS-kind features so toggling immediately applies without page reload.

Short-circuits to a no-op when `document.documentElement.hasAttribute('data-ytc-paused')`.

### 6.2 Page handlers (`src/content/modules/pages/`)

- **`shorts.js`** — if `redirectShorts` enabled, `location.replace('/watch?v=' + videoId)` preserving the query string.
- **`home.js`** — if `hideHomeFeed` enabled: reads `hideHomeFeedMode`; `redirect` → navigates to `/feed/subscriptions`; `quickLinks` → injects the empty-state card (§10.3); `empty` → no JS action (pure CSS).
- **`watch.js`** — implements `#17 collapse description` (the CSS-only clamp is unreliable because YouTube manages expanded/collapsed state on the DOM).
- **`search.js`, `subs.js`, `channel.js`** — empty placeholders in v1.

### 6.3 Blocklist filter (`src/content/modules/blocklist-filter.js`)

Cross-page. Activated when either `blocklistKeywords` or `blocklistChannels` is non-empty. Short-circuits when `data-ytc-paused`.

- Target selectors: `ytd-rich-item-renderer`, `ytd-video-renderer`, `ytd-compact-video-renderer`, `ytd-grid-video-renderer`, `ytd-reel-item-renderer`.
- Text extraction: title from `#video-title` / `a#video-title` / `yt-formatted-string#video-title`; channel from `ytd-channel-name a`.
- Match by rule mode (§8.3). Set `data-ytc-blocked` on matching card (don't remove from DOM).
- One shared `MutationObserver` on `<body>` with `{ subtree: true, childList: true }`. On added node: single-card test if it matches a card selector, otherwise sweep the subtree.
- Initial pass: `sweep(document)`.
- Re-sweep on `blocklistKeywords` / `blocklistChannels` change.
- `safeRegex()` wraps `new RegExp` in try/catch; invalid → rule skipped + `invalid` state written to storage for UI error badge.
- Target performance: < 5ms per batch on a 50-card home feed.

### 6.4 Runtime style manager (`src/content/modules/runtime-style-manager.js`)

Owns `<style data-ytc-runtime>` in `<head>`. Exposes `setRuntimeCSS(sections: Record<string, string>)` that rewrites `textContent` atomically. Not used by any v1 feature; shipped as a scaffold for v1.1 (per-channel hide, schedules).

### 6.5 Script boot order (`src/content/isolated-world.js`)

1. Import `attribute-applier` at `document_start` (flicker-free CSS baseline).
2. Lazy-import `page-router` and `blocklist-filter` on `DOMContentLoaded`.

---

## 7. Kill-switch & per-tab pause

### 7.1 Global kill-switch

- Storage: `globallyPaused: boolean` in `chrome.storage.local`, default `false`.
- UI: Toggle in settings gear popover (§3.8), labeled _yt-cleanse is active_.
- Propagation: `chrome.storage.onChanged` → `attribute-applier` → every YouTube tab clears attributes.
- Persistence: survives browser restart.

### 7.2 Per-tab pause

- Storage: `chrome.storage.session` key `tabPaused:{tabId}`. Session-scoped; cleared on browser close or tab close.
- UI: context menu item on `*://*.youtube.com/*` pages. Toggles between _Pause_ and _Resume_ labels; label kept in sync via `chrome.tabs.onActivated`.
- Handler: `src/background/handlers/tab-pause.js` creates the menu on `onInstalled`, toggles on click, sends `{ type: 'YTC_PAUSE_CHANGED' }` to the tab, removes storage entry on `tabs.onRemoved`.
- Content script: `chrome.runtime.onMessage` listener re-runs `applyAttributes()` when it receives the message.

### 7.3 Manifest permissions

```jsonc
"permissions":      ["storage", "contextMenus", "tabs"],
"host_permissions": ["*://www.youtube.com/*", "*://m.youtube.com/*"]
```

### 7.4 Paused-state side effects

- CSS rules don't match (attributes removed) → YouTube renders vanilla.
- Blocklist filter `sweep()` early-returns; observer keeps running but marks nothing.
- Page router dispatches become no-ops.
- Sidepanel: when `globallyPaused`, tabs render with `opacity: 0.55` + `pointer-events: none` and show an Info-strip _"Paused. Flip the switch in settings to resume."_ Settings gear remains enabled. Per-tab pause does NOT affect sidepanel rendering.
- Storage is not cleared. Badge is not set.

---

## 8. Blocklist model

### 8.1 Rule shape

```ts
type BlocklistRule = {
  id: string; // nanoid-style, stable
  text: string; // what the user typed
  mode: "substring" | "wholeWord" | "regex"; // default 'substring'
  caseSensitive: boolean; // default false
  enabled: boolean; // default true
  createdAt: number; // epoch ms
  invalid?: { reason: "regex-syntax" | "empty"; message: string };
};
```

### 8.2 Storage

```js
chrome.storage.local: {
  blocklistKeywords: BlocklistRule[],  // matches video titles
  blocklistChannels: BlocklistRule[]   // matches channel name text
}
```

Array membership implies scope. No cross-list mixing in v1.

### 8.3 Matching semantics

- **Substring (default):** `target.toLowerCase().includes(rule.text.toLowerCase())` (or case-sensitive if flag set). Matches partial words.
- **Whole-word:** `new RegExp('\\b' + escape(rule.text) + '\\b', rule.caseSensitive ? '' : 'i')`.
- **Regex:** `new RegExp(rule.text, rule.caseSensitive ? '' : 'i')`. Invalid → rule skipped + `invalid: { reason: 'regex-syntax', message }` written back to storage.
- Empty `text` → `invalid: { reason: 'empty' }`, never matches.
- Disabled rules are skipped entirely.

### 8.4 UI interactions

See §3.7. Summary: add via text input + Enter; row shows enable-Toggle, text, ⚙ advanced, × delete. Advanced expands inline (not a modal) for Mode radios + Case-sensitive. Delete is instant with a 5-second Undo toast. No inline edit in v1 — delete + re-add.

### 8.5 Channel rules

Match against channel name text only (trim + collapse whitespace before comparing). URL/handle matching deferred to v1.1.

### 8.6 Import / export

Out of scope for v1.

---

## 9. Storage schema

### 9.1 `chrome.storage.local`

```js
{
  schemaVersion: 1,

  // Feature flags — one boolean per CSS/JS/hybrid feature id:
  hideHomeShorts: true,         hideNavShorts: true,
  hideChannelShortsTab: true,   hideSearchShorts: true,
  hideSubsShorts: true,         redirectShorts: true,
  hideEndScreenCards: true,     hideAutoplayToggle: true,
  hideMerchShelves: true,
  hideHomeFeed: false,          hideChipBar: false,
  hideBreakingShelves: false,   hideSearchMixedShelves: false,
  hideLeftSidebar: false,       hideNotificationBell: false,
  hideTrending: false,          hideComments: false,
  hideLiveChat: false,          hideRelatedVideos: false,
  hideDescription: false,

  // Extras:
  hideHomeFeedMode: 'quickLinks',  // 'empty' | 'quickLinks' | 'redirect'

  // Blocklist:
  blocklistKeywords: [],
  blocklistChannels: [],

  // App state:
  globallyPaused: false,
  appTheme: 'auto',       // 'auto' | 'light' | 'dark'
  language: null,         // null = browser default
  compactMode: false,

  // Flags:
  flags: { welcomeDismissed: false },

  // Analytics:
  analytics: { enabled: false }   // kept disabled in v1; no UI
}
```

### 9.2 `chrome.storage.session`

```js
{ 'tabPaused:{tabId}': true }   // presence = paused; removed on tab close
```

### 9.3 `chrome.storage.sync`

Not used in v1.

### 9.4 Seeding

On `chrome.runtime.onInstalled` (reason === `install`), handler writes defaults computed from `FEATURES` + extras + app state + flags + analytics.

### 9.5 Migrations

`schemaVersion: 1` from v1. Future versions add migration steps keyed by target version in `handlers/storage.js`. No migrations in v1.

### 9.6 Reset-to-defaults

Two-step confirm → `chrome.storage.local.clear()` → re-seed → broadcast message to YouTube tabs to re-apply attributes → toast. Does not clear session storage.

### 9.7 Cross-context sync

Uses the template's `useStorage` hook and `chrome.storage.onChanged` listeners. No new plumbing.

---

## 10. Theming integration

### 10.1 Verbatim inheritance from `design-extension.md`

- Color tokens (§2.1) — both palettes.
- Semantic tokens (§2.2).
- Root atmospheres (§3) — rose-water diagonal + `.bg-dark-app`.
- Outer frame.
- Typography scale (§4).
- Components: `Card`, `Toggle`, `Button`, `Badge`, `SettingsMenu`, `Footer`, `TabNav`, `Header`.
- Motion tokens (150/200/350ms with the two curves).
- 7px pink-gradient scrollbar.
- Info strip (§5.10) both plain and vivid variants.
- Compact mode (§4).
- Vision gradient utility.

### 10.2 Deviations

| #   | Item                  | yt-cleanse version                                                                                                                                              |
| --- | --------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Wordmark text         | `yt-cleanse` replaces `vtexSnitch`. All other wordmark attributes identical.                                                                                    |
| 2   | Footer text           | `yt-cleanse · v{manifest.version}`                                                                                                                              |
| 3   | TabNav labels         | `<{Feeds} />`, `<{Watch} />`, `<{Blocklist} />`                                                                                                                 |
| 4   | SettingsMenu sections | Kill-switch (added), Theme (kept), Toggles {Remember last tab, Compact mode} (trimmed), Reset (kept). Removed: Visible Tabs, Default Tab, Region, Auto-refresh. |
| 5   | Per-tab Info strip    | One plain strip per tab (compliant with §5.10). Vivid variant used once for the welcome banner.                                                                 |

### 10.3 `GlassTile` + `Toggle(indeterminate)` new primitives

- `GlassTile` (design spec §5.4) — not shipped in any v1 tab, built into `components/ui/GlassTile.jsx` for reuse + exercised by tests. Its visual recipe is also applied (via inline-styled DOM, no React) to the homepage empty-state card in the content script.
- `Toggle` gains an `indeterminate` prop. Track renders a diagonal-stripe fill (`repeating-linear-gradient` at low opacity) when indeterminate. Thumb sits at the midpoint.

### 10.4 Homepage empty-state card (injected DOM)

Rendered by `pages/home.js` when `hideHomeFeed && hideHomeFeedMode === 'quickLinks'`. Inline-styled using CSS variables that match YouTube's own theme (read from `<html dark>`):

- Container: `rgba(255,255,255,0.40)` light / `rgba(255,255,255,0.08)` dark; `backdrop-filter: blur(12px)`; `border: 1px solid rgba(161,170,183,0.30)`; `border-radius: 8px`; `padding: 24px`.
- Content: 24px pink `Sparkles` icon (or `Eraser`) + `text-[13px] font-semibold` headline _"Homepage hidden."_ + `text-[11px] text-storm-cloud-grey` subline _"Go straight to what matters."_ + row of two buttons: primary **Open Subscriptions →** and secondary **Search**.
- Theme observer: `MutationObserver` on `<html>` attributes to re-sync on YouTube theme change.

### 10.5 Assets

- **Logo:** pink-to-azure vision-gradient glyph (placeholder: Lucide `sparkles` or `eraser` at 20px stroke-1.25) inside a 40px rounded-full with pink-glow shadow.
- **Extension icons:** 16/32/48/128 PNG in `public/icons/`.
- **Font:** `@fontsource-variable/outfit` (offline-safe).

### 10.6 Compliance checklist

All 11 items of design spec §9 satisfied; item 6 (copy-anywhere) is preserved via the template but not exercised by any v1 feature.

---

## 11. Testing strategy

### 11.1 Unit tests (Vitest + jsdom)

- **`features.test.js`** — FEATURES integrity: required fields, unique IDs + attrs, master subs reference real IDs, every feature belongs to a group.
- **`attribute-applier.test.js`** — storage → attribute mapping; pause clears everything + sets `data-ytc-paused`; `extra.kind === 'select'` writes the mode attribute.
- **`blocklist-filter.test.js`** — substring / whole-word / regex each match correctly; case-sensitive flag respected; invalid regex skipped with validation state; disabled rules inert.
- **`master-state.test.js`** — derived state: all-on / all-off / mixed indeterminate; indeterminate click sets all on.
- **`storage-seed.test.js`** — seeding on install matches schema; nothing overwritten on update.
- **`blocklist-crud.test.js`** — add / delete / enable-toggle / advanced update operations.

### 11.2 Integration tests — selector fixtures

Fixtures (snapshotted YouTube HTML) in `tests/fixtures/youtube/`:

- `home.html`, `watch.html`, `search.html`, `shorts.html`, `subscriptions.html`, `channel.html`, `channel-shorts-tab.html`.

Capture procedure documented in `docs/testing-fixtures.md`. Re-capture when features visibly break.

Per fixture × per CSS-kind feature that touches it: one positive test (feature on → element hidden) + one negative test (feature off → element visible). Roughly 25–30 tests.

Blocklist integration: run `sweep()` over the home fixture with sample rules; assert that marked cards match the rules.

### 11.3 Manual checklist

Lives in `docs/manual-test-checklist.md`. Covers install/first-run, every feature toggle, master+customize semantics, Shorts redirect, home dropdown modes, blocklist CRUD + matching modes, kill-switch, per-tab pause, tab UX, theme switch, compact mode, reset.

Noted: `m.youtube.com` is included in the match pattern but the mobile DOM is not supported in v1 — selectors won't match. Manual checklist runs on desktop only.

### 11.4 CI

GitHub Actions runs `pnpm lint`, `pnpm test`, `pnpm build`. No real-browser e2e in v1.

### 11.5 Release gate

1. All tests pass.
2. Manual checklist completed on a clean Chrome profile.
3. Bundle under 500KB gzipped.
4. No CSP warnings in service worker console.

---

## 12. Out of scope (v1) / v1.1 candidates

### 12.1 Non-goals

- Mobile YouTube (`m.youtube.com`) full coverage.
- YouTube Music / Kids / TV / Studio.
- Player controls / quality defaults / shortcuts.
- Transcription / AI / summarization.
- Focus sessions / timers / usage limits / password protection.
- Per-channel context-menu "hide this channel" shortcut.
- Thumbnail treatments (blur / grayscale / hide thumbnail).
- Blocklist inline edit, import/export.
- `chrome.storage.sync`.
- Analytics UI.
- `/shorts/*` whitelist.
- Scheduling.
- Landing website.

### 12.2 v1.1 shortlist (ranked)

1. Per-channel "hide this channel" context-menu shortcut.
2. Blocklist inline edit.
3. JSON import/export of blocklist.
4. Mobile-web selector coverage.
5. `chrome.storage.sync` opt-in.
6. Per-video "hide this one" button.

### 12.3 Known limitations (for `docs/limitations.md` + store listing)

- Desktop YouTube only.
- Selectors may break when YouTube updates.
- Blocklist matches visible text (titles / channel names), not descriptions / tags / handles.
- Per-tab pause is session-scoped.
- No data leaves the user's browser.

---

## 13. Directory shape (target)

```
extension/src/
├── background/
│   ├── index.js
│   └── handlers/
│       ├── storage.js           # existing — add seeding + reset
│       └── tab-pause.js         # NEW: context menu + session state
├── content/
│   ├── isolated-world.js        # entry @ document_start
│   └── modules/
│       ├── attribute-applier.js
│       ├── page-router.js
│       ├── pages/
│       │   ├── home.js
│       │   ├── shorts.js
│       │   ├── watch.js
│       │   ├── search.js
│       │   ├── subs.js
│       │   └── channel.js
│       ├── blocklist-filter.js
│       └── runtime-style-manager.js
├── sidepanel/
│   ├── App.jsx
│   └── components/
│       ├── ui/
│       │   └── GlassTile.jsx    # NEW: reusable primitive
│       └── tabs/
│           ├── FeedsTab.jsx
│           ├── WatchTab.jsx
│           └── BlocklistTab.jsx
├── styles/
│   ├── global.css
│   └── youtube.css              # NEW: html[data-ytc-*] rules
└── config/
    └── features.js              # NEW: FEATURES + GROUPS
```

Demo content to remove (per template §5.11): `handlers/network.js`, `handlers/dom.js`, `components/tabs/DashboardTab.jsx`, `components/tabs/DomTab.jsx`, `components/tabs/NetworkTab.jsx` (if present under those names), and any matching manifest entries.

---

## 14. Implementation plan handoff

This spec is the input to `superpowers:writing-plans`. The plan skill will produce the step-by-step implementation plan. Do not begin coding until the plan is produced and approved.
