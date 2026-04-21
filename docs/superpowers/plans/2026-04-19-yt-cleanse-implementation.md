# yt-cleanse — Implementation Plan

> **Status:** Proposed. Not yet approved.
> **Date:** 2026-04-19
> **Design input:** `docs/superpowers/specs/2026-04-19-yt-cleanse-design.md`
> **Scope contract:** Spec §1 (in-scope) and §12 (out-of-scope).
> **Discipline:** Each phase ends with a **verification gate**. Do not proceed to the next phase until its gate passes. No code before Phase 0 is approved.

---

## Rules of execution

1. **Template discipline.** The existing template in `extension/` is production-ready. Follow its conventions (message router, `useStorage`, ToastContext, i18n, feature flags). Do not replace patterns; extend them.
2. **Single-source-of-truth reflex.** Any feature list change = edit `config/features.js` only. Any design-token change = edit the tokens file inherited from the template, never re-declare colors inline.
3. **Separation of engines.** CSS engine and JS engine are siblings, not parents of each other. If a feature can be CSS, it must be CSS. If it needs JS, the JS must not duplicate what CSS can do.
4. **No speculative features.** Every line of code must map to a feature in `FEATURES` or a spec section. If it doesn't, delete it.
5. **Test-first where cheap.** Unit tests for `FEATURES` integrity, matcher, and master-state land with the code that uses them, not afterward.
6. **Commit boundaries = phase boundaries.** Each phase is one commit (or a short series), reviewable in isolation.

---

## Phase 0 — Prep & housekeeping

Goal: clean slate on top of the template, ready to grow.

### Tasks

1. **Branch** `feat/yt-cleanse` off `main`.
2. **Manifest updates** (`extension/public/manifest.json` or equivalent — use the template's source of truth):
   - `name` → `yt-cleanse`
   - `description` → product one-liner (write it: _"Declutter YouTube. Hide Shorts, comments, related videos, and anything you don't want to see."_)
   - `permissions` → `["storage", "contextMenus", "tabs"]`
   - `host_permissions` → `["*://www.youtube.com/*", "*://m.youtube.com/*"]`
   - `content_scripts` → single entry: matches above, `run_at: "document_start"`, `js: ["src/content/isolated-world.js"]`, `css: ["src/styles/youtube.css"]`.
   - `side_panel` entry preserved.
   - `action` icon preserved (placeholder until Phase 7).
3. **Strip template demo content** (per template README §5.11):
   - Delete `background/handlers/network.js`, `background/handlers/dom.js`.
   - Delete `sidepanel/components/tabs/DashboardTab.jsx`, `DomTab.jsx`, `NetworkTab.jsx` (use actual filenames discovered in the repo).
   - Remove their imports from `background/index.js` and `sidepanel/App.jsx`.
   - Delete their tests.
4. **Font swap**: add `@fontsource-variable/outfit` to `package.json`; replace any `@import` Google Fonts reference in `global.css` with the fontsource import.
5. **Wordmark swap**: in the template's `Header` component, change hardcoded `vtexSnitch` → `yt-cleanse`. Keep every other style token.
6. **Footer swap**: change footer pill content → `yt-cleanse · v{manifest.version}` (read via `chrome.runtime.getManifest().version`).

### Verification gate 0

- `pnpm build` succeeds.
- Extension loads in Chrome (Developer mode → Load unpacked) without errors.
- Side panel opens. Header shows `yt-cleanse` wordmark in vision gradient.
- No demo tabs visible. TabNav still renders (it will show only placeholder tabs or an empty state; we replace in Phase 4).
- `pnpm test` passes (demo tests removed).

---

## Phase 1 — Foundation primitives

Goal: the data model and UI primitives every later phase depends on.

### Tasks

1. **`src/config/features.js`** — author the full `FEATURES` array + `GROUPS` index per spec §4. Export both. Add JSDoc types for `Feature`, `BlocklistRule`, etc. (or add a `types.ts`/`types.d.ts` if the template uses TypeScript).
2. **Unit test `features.test.js`** covering integrity rules from spec §11.1 target 1. Land this with the config; it stays green forever.
3. **Extend `Toggle` component** (in `components/ui/Toggle.jsx`) with an `indeterminate?: boolean` prop:
   - When `indeterminate`, render track with `repeating-linear-gradient(45deg, var(--accent) 0 4px, transparent 4px 8px)` at `opacity: 0.45`.
   - Thumb sits at `left: 10px` (midpoint between `2px` off and `18px` on).
   - `aria-checked="mixed"` on the button.
   - Clicking an indeterminate Toggle calls `onChange(true)` (sets ALL on, per spec §3.4).
4. **New `GlassTile` component** (`components/ui/GlassTile.jsx`) built per design spec §5.4: 3-up grid item with icon + label row, value below, hover-reveals Copy icon, 1200ms Check flash on click. Exported but not used in any tab in v1. Includes a lightweight test verifying the copy→check→copy cycle.
5. **Shared helpers** (`src/utils/features.js`):
   - `getMasterState(masterId, storage) → 'on' | 'off' | 'indeterminate'`
   - `setMasterState(masterId, value, storage) → Partial<Storage>` (returns the patch; caller persists)
6. **Unit test `master-state.test.js`** for the two helpers.

### Verification gate 1

- `FEATURES` integrity test passes.
- `Toggle indeterminate` renders correctly in a dev story/sandbox (verify visually).
- `getMasterState` / `setMasterState` tests pass.
- No runtime regressions in the template.

---

## Phase 2 — CSS-attribute engine

Goal: the flicker-free baseline lands. Toggling any CSS-kind feature via storage actually hides/shows the right YouTube elements.

### Tasks

1. **`src/content/isolated-world.js`** — entry point. Imports `attribute-applier` synchronously, lazy-imports router/filter on `DOMContentLoaded` (stub for now; Phase 3 populates).
2. **`src/content/modules/attribute-applier.js`** — implements spec §5.2 algorithm exactly:
   - One-shot message `{ type: 'YTC_WHO_AM_I' }` to the service worker; cache `tabId`.
   - `applyAttributes()` reads both `chrome.storage.local.get(null)` and `chrome.storage.session.get('tabPaused:' + tabId)`.
   - Pause → clear all feature attrs + set `data-ytc-paused`.
   - Otherwise → iterate `FEATURES`, set/remove `data-ytc-*` per boolean; for `extra.kind === 'select'`, also set `{attr}-mode` attribute.
   - Subscribes to `chrome.storage.onChanged` and to `chrome.runtime.onMessage` for `YTC_PAUSE_CHANGED`.
3. **Background handler for `YTC_WHO_AM_I`** — minimal addition to `background/index.js` (or a new `handlers/content-bridge.js`): replies with `sender.tab?.id`.
4. **Storage seeding** — extend the existing `handlers/storage.js`:
   - On `chrome.runtime.onInstalled` (reason === `'install'`), compute defaults from `FEATURES` + app-state defaults (per spec §9.1) and `chrome.storage.local.set(defaults)`.
   - Export a `resetToDefaults()` function: `clear()` + re-seed. (Used by Phase 4 reset button.)
5. **Unit test `storage-seed.test.js`** — spec §11.1 target 5.
6. **Unit test `attribute-applier.test.js`** — spec §11.1 target 2.
7. **`src/styles/youtube.css`** — author one rule per CSS-kind feature. Use the table in spec §4.3 as a checklist; consult actual YouTube selectors via the captured fixtures (captured in Phase 7.2 ahead of Phase 7 integration tests — capture them NOW to write accurate selectors). Include:
   - A no-op placeholder rule for `html[data-ytc-paused]` (comment only — pause works by attribute removal).
   - `[data-ytc-blocked] { display: none !important; }` for the blocklist (used in Phase 5).
   - `html[data-ytc-home-feed][data-ytc-home-feed-mode="empty"] …` for the Empty mode.
8. **Capture YouTube fixtures** early (spec §11.2): home, watch, search, shorts, subs, channel, channel-shorts-tab. Commit under `tests/fixtures/youtube/`. Document capture procedure in `docs/testing-fixtures.md`.

### Verification gate 2

- `attribute-applier.test.js` and `storage-seed.test.js` pass.
- Manual: load extension; visit `https://www.youtube.com/`; open DevTools → `document.documentElement` should show the default-ON `data-ytc-*` attributes.
- Manual: flip `hideHomeShorts` off via `chrome.storage.local.set` in DevTools console → `data-ytc-home-shorts` attribute disappears; homepage Shorts shelves reappear.
- Manual: flip `globallyPaused: true` in storage → all attributes vanish, `data-ytc-paused` appears; reverts on `false`.
- No console errors.

---

## Phase 3 — JS layer (page router, handlers, blocklist scaffold)

Goal: the JS-kind features work. Blocklist wiring is in place but exercised in Phase 5 once UI exists to add rules.

### Tasks

1. **`src/content/modules/page-router.js`** — per spec §6.1:
   - `detectPage(url)`
   - Shared `MutationObserver` watching `document` for `location.href` changes (use `new MutationObserver` on `document` with subtree + childList, compare `location.href` to cached value).
   - Dispatch: if `data-ytc-paused`, no-op; else lazy-import matching page module and call `enter()`.
   - Re-dispatch on `chrome.storage.onChanged` events that affect JS-kind features (`redirectShorts`, `hideHomeFeed`, `hideHomeFeedMode`, `hideDescription`).
2. **`src/content/modules/pages/shorts.js`** — `#7 redirect` per spec §6.2. Test manually: visit `/shorts/<id>` → URL replaces to `/watch?v=<id>`.
3. **`src/content/modules/pages/home.js`** — per spec §6.2:
   - `redirect` mode → `location.replace('/feed/subscriptions')`.
   - `quickLinks` mode → `injectQuickLinksCard()`:
     - `MutationObserver` on `ytd-browse[page-subtype="home"] #contents`, disconnect after first match.
     - Create a `<div data-ytc-empty-card>` with inline `<style>` carrying the GlassTile-mimic CSS from spec §10.4.
     - Content: pink Sparkles icon (inline SVG, not Lucide runtime — no React in content scripts) + headline + subline + two buttons. Primary links to `/feed/subscriptions`; secondary focuses the YouTube search input (`document.querySelector('input#search')?.focus()`).
     - Observe `<html>` attribute mutations for theme sync (`dark` attribute).
     - Return cleanup that removes the node and disconnects observers.
   - `empty` mode → no JS action.
4. **`src/content/modules/pages/watch.js`** — implements `#17 collapse description`: if `hideDescription`, watch for the expander button and click it on first paint; if user re-expands later, respect that (don't fight them).
5. **`src/content/modules/pages/search.js`, `subs.js`, `channel.js`** — empty modules exporting `enter() {}` so the router's dynamic-import succeeds.
6. **`src/content/modules/blocklist-filter.js`** — scaffold per spec §6.3:
   - `init()` public entry. No-op if both lists empty.
   - `sweep()`, `testAndMark()`, matcher helpers (`testRule`, `safeRegex`, `escapeRegExp`).
   - `MutationObserver` on `<body>` subtree/childList.
   - Subscribes to `chrome.storage.onChanged` for blocklist keys → clear existing `data-ytc-blocked` and re-sweep.
   - Short-circuits on `data-ytc-paused`.
7. **`src/content/modules/runtime-style-manager.js`** — scaffold with the signature from spec §6.4. Not called in v1.
8. **Wire up `isolated-world.js` bootstrap** per spec §6.5.
9. **Unit test `blocklist-filter.test.js`** — spec §11.1 target 3. Use the home fixture captured in Phase 2.

### Verification gate 3

- Manual: `/shorts/<id>` redirects to `/watch?v=<id>` with `redirectShorts` on; does not redirect when off.
- Manual: set `hideHomeFeed=true, hideHomeFeedMode='quickLinks'` → glass card appears on `/`. Click "Open Subscriptions" → navigates. Theme-switch YouTube → card's light/dark swaps.
- Manual: set `hideHomeFeedMode='redirect'` → `/` lands on subscriptions.
- Manual: set `hideHomeFeedMode='empty'` → `/` shows blank (CSS-only).
- Manual: `hideDescription=true` → description collapses on watch pages.
- `blocklist-filter.test.js` passes (exercises matching; UI wiring comes in Phase 5).
- No console errors on any YouTube page.

---

## Phase 4 — Sidepanel UI

Goal: users can see and flip every non-blocklist feature from the sidepanel. Settings reshape complete.

### Tasks

1. **Replace `App.jsx` tab registration**: remove demo tabs; add `FeedsTab`, `WatchTab`, `BlocklistTab` (lazy). Labels `<{Feeds} />`, `<{Watch} />`, `<{Blocklist} />`.
2. **`components/tabs/FeedsTab.jsx`**:
   - Reads `FEATURES` + `GROUPS.feeds`.
   - Renders Info strip (plain) + groups as Cards with collapsible chevron per spec §3.5.
   - Inside each Card: master row (if `hasMaster`) with derived indeterminate state + chevron, followed by sub-rows for each feature where `f.group === group.id`.
   - For `hideHomeFeed` only: render its `extra.select` control inline as a compact dropdown using the design spec's form tokens.
   - Group `navChrome` (no master) renders as a Card with a title header and loose sub-rows.
3. **`components/tabs/WatchTab.jsx`** — same pattern. Loose standalone row for `redirectShorts` at the bottom, with `Redirect` Lucide icon and the description text.
4. **`components/tabs/BlocklistTab.jsx`** — stub that says "Coming in Phase 5" (or hide the tab temporarily via TabNav if cleaner). Tab shell lands now; CRUD comes in Phase 5.
5. **Welcome Info strip** on `FeedsTab`: reads `flags.welcomeDismissed`; renders the vivid variant per spec §3.3 with an `×` that writes `flags.welcomeDismissed = true`. Copy from spec §2.3.
6. **Settings gear popover reshape** (`components/SettingsMenu.jsx` or equivalent):
   - Add top row: `Toggle` labeled _yt-cleanse is active_, bound to `!globallyPaused` (flipping off writes `globallyPaused: true`).
   - Keep Theme section (Sun/Moon).
   - Trim Toggles section to: _Remember last tab_, _Compact mode_.
   - Keep Reset section with a dashed-outline secondary button → confirm (two-step via Button → Toast undo pattern).
   - Remove Visible Tabs, Default Tab, Region, Auto-refresh sections.
7. **Sidepanel paused state**: when `globallyPaused`, wrap tab body in a muted overlay (`opacity: 0.55; pointer-events: none`) and prepend an Info-strip _"Paused. Flip the switch in settings to resume."_
8. **i18n**: extract all user-visible strings (Card titles, tab labels, Info strip copy, SettingsMenu labels, etc.) into `public/_locales/en/messages.json`. Also seed `pt-BR` with placeholders if the template shows both.

### Verification gate 4

- All Feeds and Watch features render as Cards with correct groupings.
- Flipping a master toggles all its subs; flipping a sub from an all-on state puts master into indeterminate.
- Flipping master when indeterminate sets all subs on.
- Card chevron expands/collapses body with the 350ms max-height transition.
- Welcome Info strip appears on first open; `×` dismisses and persists.
- Settings popover shows kill-switch; flipping it globally pauses all YouTube tabs (verify on a second Chrome window).
- Sidepanel shows paused overlay when globally paused.
- Reset button clears storage, re-seeds defaults, restores the UI to defaults; toast confirms.
- `pnpm test` passes.

---

## Phase 5 — Blocklist

Goal: keyword and channel rules work end-to-end.

### Tasks

1. **`BlocklistTab.jsx`**:
   - Two Cards (Keywords, Channels), each with rule count Badge in the title row.
   - Add-row: controlled text input + primary Add button, Enter submits.
   - Rule row: enable-Toggle, text (with strikethrough when disabled), ⚙ icon toggling an inline "Advanced" area, × icon deleting.
   - Advanced area: Mode radios (Substring / Whole word / Regex), Case-sensitive checkbox.
   - Empty state copy per spec §3.7.
   - Muted footer note per spec §3.7.
2. **Rule CRUD helpers** (`src/utils/blocklist.js`):
   - `addRule(listKey, text)` → appends with defaults; returns new id.
   - `deleteRule(listKey, id)` → removes by id.
   - `updateRule(listKey, id, patch)` → merges partial update.
   - All read-modify-write against `chrome.storage.local` via a single transaction (avoid races).
3. **Delete-with-undo**: use the template's ToastContext; on delete, show toast with Undo button (5s timeout). Undo restores the rule at its original index.
4. **Validation surfacing**: when the content-script filter writes `rule.invalid`, the UI renders an `error` Badge with tooltip showing `invalid.message`.
5. **Hook up `blocklist-filter.js`** to actually run (it's been scaffolded in Phase 3). Update `isolated-world.js` to call `blocklist-filter.init()` alongside `page-router.init()`.
6. **Unit test `blocklist-crud.test.js`** — spec §11.1 target 6.
7. **Integration test `blocklist-integration.test.js`** per spec §11.2 using the home fixture.

### Verification gate 5

- Add a keyword rule "mrbeast" → cards with titles containing that string disappear on the YouTube homepage.
- Toggle a rule off → cards reappear.
- Delete → toast with Undo. Undo restores.
- Whole-word rule "cat" does not hide "category" cards.
- Invalid regex → error badge on the rule; other rules still work.
- Reset-to-defaults does NOT preserve blocklist (per spec §9.6: clear + re-seed, lists reset to empty).
- All new tests pass.

---

## Phase 6 — Per-tab pause & context menu

Goal: right-click on a YouTube page toggles pause for that tab. Sidepanel unaffected.

### Tasks

1. **`src/background/handlers/tab-pause.js`** — per spec §7.2:
   - On `onInstalled`: `chrome.contextMenus.create(...)` with `documentUrlPatterns`.
   - `onClicked`: flip session flag, send message to tab, update menu title.
   - `onActivated`: sync menu title to focused tab's pause state.
   - `onRemoved`: clean up session flag.
2. **Register the handler** in `background/index.js` (follow the template's handler-composition pattern).
3. **Content-script listener** for `YTC_PAUSE_CHANGED` (already scaffolded in `attribute-applier.js`, Phase 2). Verify it re-runs `applyAttributes()`.
4. **Unit coverage**: tests for the session-flag lifecycle (install → click → click → tab-close).

### Verification gate 6

- Right-click on YouTube → context menu shows "Pause yt-cleanse on this tab".
- Click → tab renders vanilla YouTube; other tabs unaffected. Menu label becomes "Resume…".
- Click again → resumes.
- Close and reopen the tab → pause state reset (session-scoped).
- Global kill-switch remains independent.

---

## Phase 7 — Testing hardening

Goal: every fixture-testable feature has a regression test.

### Tasks

1. **Integration test `youtube-css.test.js`** — spec §11.2: per fixture × per CSS-kind feature, positive + negative test. Use `inject-youtube-css.js` helper that reads `src/styles/youtube.css` and applies it to the test DOM.
2. **Update `tests/fixtures/` capture docs** and refresh fixtures if YouTube's DOM has drifted since Phase 2.
3. **Manual test checklist** — author `docs/manual-test-checklist.md` with the list in spec §11.3.
4. **Limitations doc** — author `docs/limitations.md` from spec §12.3.
5. **Lint pass** — `pnpm lint` clean. Fix or suppress (with explanation) any warnings.
6. **Bundle audit** — run `pnpm build`; confirm output under 500KB gzipped (per spec §11.5).

### Verification gate 7

- `pnpm test` green, including all new integration tests.
- `pnpm lint` clean.
- `pnpm build` succeeds, bundle under budget.
- Manual checklist executed end-to-end on a clean Chrome profile.

---

## Phase 8 — Release prep

Goal: store-ready artifact.

### Tasks

1. **Icons**: generate 16/32/48/128 PNG icons of the chosen glyph in pink on transparent. Drop in `public/icons/`. Update `manifest.json` action + 128px listing icon.
2. **Logo in Header**: replace placeholder glyph with final.
3. **Store listing copy** (drafted in the repo at `docs/store-listing.md`, not published yet): short description (spec §1 reworded), detailed description, screenshots (capture from a clean profile), promotional tile.
4. **Privacy declaration** for the Chrome Web Store: _no data collected, no telemetry, no external requests_. Privacy policy URL can point to a short page in the future landing site or a GitHub Pages doc.
5. **Versioning**: tag `v0.1.0`. Update `manifest.json` + `package.json` to match.
6. **CI green**: one final workflow run, all green.

### Verification gate 8

- Icons ship; extension icon renders at all Chrome zoom levels.
- Clean install on a fresh profile yields the expected first-run state.
- All tests pass. Lint clean. Build succeeds.
- Branch ready for merge.

---

## Dependency graph (at a glance)

```
Phase 0  ─┬─ Phase 1 ──┬─ Phase 2 ──┬─ Phase 3 ──┬─ Phase 4 ─── Phase 5
          │            │            │            │
          │            │            │            └────────────── Phase 6
          │            │            │
          └─ fixtures  └─ tests     └─ tests
                                                                  │
                                                          Phase 7 ─── Phase 8
```

Phase 6 is independent of Phase 5 and could be done in parallel; doing it after 5 is convenient because it touches `attribute-applier` and `background/index.js` which are stable by then.

---

## Risk register

| Risk                                                                | Mitigation                                                                                                      |
| ------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| YouTube DOM changes break selectors                                 | Fixtures + integration tests catch regressions; selectors prefer stable semantic elements (§5.5).               |
| `:has()` selector unsupported                                       | Effective Chrome floor ≥ 105 (§5.3); noted in store listing.                                                    |
| Blocklist perf degrades on infinite-scroll feeds                    | `MutationObserver` only processes added subtrees; sweep bounded to card selectors; benchmark in Phase 7.        |
| Per-tab pause race: menu title out of sync after fast tab-switching | `onActivated` handler re-reads session flag on every switch (§7.2).                                             |
| Reset wipes blocklist unexpectedly                                  | Documented behavior (§9.6). UX: two-step confirm required.                                                      |
| Users confused by indeterminate master state                        | Striped track + aria-checked="mixed" + tooltip on first hover (future enhancement if user-tested as confusing). |

---

## Exit criteria for v1

- All 22 features from spec §1 work per the manual checklist.
- Global kill-switch + per-tab pause work per spec §7.
- Blocklist matches and hides per spec §8.
- No console errors on any YouTube page with any combination of toggles.
- All tests pass. Bundle under budget. Store-ready artifacts prepared.
- `docs/brainstorm-handoff.md`, the design spec, and this plan accurately reflect what shipped. Any drift is documented.

---

## Approval gate

Do not start Phase 0 until this plan is user-approved. Once approved, proceed phase-by-phase, stopping at each verification gate for user sign-off before continuing.

---

## Current status (2026-04-19, 15:03 UTC-03:00) — handoff snapshot

### Phases complete & gated

| Phase                           | Status   | Tests                                                                                                                                 | Notes                                                                                                                   |
| ------------------------------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| Phase 0 — Prep                  | ✅ Gated | —                                                                                                                                     | Template stripped, manifest renamed, Outfit font.                                                                       |
| Phase 1 — Foundation primitives | ✅ Gated | `features.test.js`, `master-state.test.js`                                                                                            | `FEATURES` / `GROUPS` authored; Toggle has `indeterminate`; GlassTile built.                                            |
| Phase 2 — CSS-attribute engine  | ✅ Gated | `attribute-applier.test.js`, `storage-seed.test.js`                                                                                   | `isolated-world.js` + `youtube.css` live. Fixtures NOT yet captured (deferred to Phase 7).                              |
| Phase 3 — JS layer              | ✅ Gated | `page-router.test.js`, `shorts-handler.test.js`, `home-handler.test.js`, `watch-handler.test.js`, `blocklist-filter.test.js`          | Page router + all page modules + blocklist scaffold shipped.                                                            |
| Phase 4 — Sidepanel UI          | ✅ Gated | `Toggle.test.jsx` (8), `FeaturePanel.test.jsx` (8)                                                                                    | FeedsTab + WatchTab data-driven from `FEATURES`. `FeaturePanel` + `Card` + `FeatureRow` + `Select` + `useStorageState`. |
| Phase 5 — Blocklist             | ✅ Gated | `rule-id.test.js` (2), `RuleCard.test.jsx` (7), `AddRuleDialog.test.jsx` (8), `BlocklistTab.test.jsx` (4), `context-menu.test.js` (8) | Two-section BlocklistTab with add/edit/delete, invalid-regex highlight, context-menu "Block 'X'" wiring.                |

**Total suite: 20 test files · 171 tests · all green.** `npm run build` green at ~70.82 KB gzipped. `npm run lint` 0 errors, 4 pre-existing template-inherited warnings (unrelated to this work).

### Active work — **visual pivot (IN PROGRESS, must finish before Phase 6)**

The user rejected the PostHog direction that was briefly discussed and has asked to pivot the UI to the **unfunnelizer palette** (see `unfunnelizer.md`). Critical user direction:

> _"I want the brute yellow, red etc the default for both light and dark theme."_

That is, unlike unfunnelizer's original design (which uses **cool accents in light / warm accents in dark**), yt-cleanse uses **warm accents (brute-red → brute-yellow) in BOTH themes**. Surfaces still switch per theme, but the gradient stays warm everywhere.

#### Palette (implemented in `src/styles/global.css`)

```
Brand colors (both themes, @theme)
  --color-smart-blue: #3c7cfc
  --color-smart-cyan: #59c0e8
  --color-brute-red:  #ff4d4d
  --color-brute-yellow: #f9cb28

Accent gradient endpoints (identical in both themes)
  --color-accent-from: #ff4d4d   (brute-red)
  --color-accent-to:   #f9cb28   (brute-yellow)
  --accent:            var(--color-accent-from)
```

Light surfaces: `#f8fafc` / `#ffffff` / `#f1f5f9` with `#1e293b` text and `#e2e8f0` borders.
Dark surfaces: `#0f0f14` / `#16161d` / `#1c1c25` with `#e4e4e7` text and `#2a2a35` borders.

Theme switching continues to use `[data-theme='dark']` on `<html>` (unchanged from template). The `ThemeContext` does not need changes.

#### ✅ Already completed on this pivot

1. `src/styles/global.css` — entire token block rewritten. Rose-Water / Midnight-Cherry palette removed. Unfunnelizer palette + warm accent gradient installed. Atmospheres (`.bg-light-app` / `.bg-dark-app`) updated. Scrollbar updated. Selection colors updated. Sidepanel frame border now uses `var(--border)`.
2. New utility class **`.text-accent-gradient`** added. **`.text-vision-gradient`** kept as a legacy alias (identical output) so old JSX class usages don't break during migration.
3. New utility class **`.bg-accent-gradient`** added (135° `--color-accent-from` → `--color-accent-to`) for primary surfaces like the ADD button.
4. `src/sidepanel/components/ui/Header.jsx` — logo chip background and wordmark gradient migrated to `--color-accent-from` / `--color-accent-to` and `.text-accent-gradient`.

#### 🔲 REMAINING pivot work (next agent must finish this BEFORE Phase 6)

The following files still contain direct references to removed tokens (`--color-core-pink`, `--color-azure-sky`, `--color-rose-water`, etc.) and must be migrated. Run `grep -r "core-pink\|azure-sky\|rose-water\|midnight-cherry\|vision-gradient" src/` from `extension/` to see them all.

Files with direct references still to migrate:

- `src/sidepanel/components/ui/TabNav.jsx` — 1 match (likely the active-tab indicator color or `.text-vision-gradient` className). Replace class with `text-accent-gradient`.
- `src/sidepanel/components/ui/GlassTile.jsx` — 2 matches. Replace `var(--color-core-pink)` / `var(--color-azure-sky)` with `var(--color-accent-from)` / `var(--color-accent-to)`.
- `src/sidepanel/App.jsx` — 3 matches. These are the `bg-dark-app` / `bg-light-app` body class toggles; those classes still exist so JSX does NOT need to change, BUT double-check the grep hits — there may also be an inline accent reference.
- `src/sidepanel/components/blocklist/RuleCard.jsx` — 6 matches. Invalid-regex red border (`rgba(247, 25, 99, ...)` / `var(--color-core-pink)`) should switch to `var(--color-brute-red)` and `rgba(255, 77, 77, ...)`. The mode badge color `var(--color-azure-sky)` should become `var(--color-accent-from)` (brute-red) or `var(--color-smart-blue)` if a cool accent reads better — user's call; default to `var(--color-accent-from)` to stay consistent with the "warm everywhere" direction.
- `src/sidepanel/components/blocklist/AddRuleDialog.jsx` — 4 matches. Invalid-regex inline error and the "selected mode" highlight (currently azure-sky). Migrate both to accent-from.
- `src/sidepanel/components/blocklist/RuleList.jsx` — 1 match. The ADD button has `linear-gradient(135deg, var(--color-core-pink) 0%, var(--color-azure-sky) 100%)`. Replace with `linear-gradient(135deg, var(--color-accent-from) 0%, var(--color-accent-to) 100%)` or simply use `className="bg-accent-gradient"`. Also update the `box-shadow` rgba values from pink to `rgba(255, 77, 77, 0.25)`.
- `src/content/pages/home.js` — the quick-links glass card injected on the YouTube homepage has an inline `<style>` string with accent colors hardcoded. Grep `core-pink\|azure-sky\|f71963\|0366d6` inside this file and migrate to `#ff4d4d` / `#f9cb28` (content scripts can't use CSS variables defined in the sidepanel context unless injected; keep hardcoded hex).
- `src/styles/global.css:311` — there's a pre-existing lint warning about `scrollbar-width` browser support. **Leave it alone** — it's not a blocker, just noise.

**Verification after migration:**

1. `npm test` — all 171 tests must still pass (theme changes should not affect tests).
2. `npm run build` — must succeed.
3. `npm run lint` — must stay at 0 errors (the 4 template warnings are acceptable).
4. Manual sanity: `npm run dev` or load unpacked, check that:
   - Header logo + wordmark use the warm red→yellow gradient.
   - Active tab indicator uses the warm gradient (not pink/azure).
   - Blocklist ADD button is warm.
   - Invalid-regex state flashes red with the brute-red color.
   - Dark theme uses `#0f0f14` background and `#e4e4e7` text.
   - Light theme uses `#f8fafc` background and `#1e293b` text.
   - Scrollbar is red→yellow.
5. Once confirmed, **remove `.text-vision-gradient` alias from `global.css`** and rename all remaining usages to `.text-accent-gradient` for cleanliness. This is not blocking; the alias is a migration aid.

Optional cleanup if time permits: audit `src/content/pages/home.js` and any other content-script injected UI for hardcoded pink/azure hex values and bring them in line.

### Phases not yet started

- **Phase 6 — Per-tab pause & context menu** (do after visual pivot is finished and gated). Context-menu _infrastructure_ already exists in `src/background/handlers/context-menu.js` (from Phase 5 for "Block selection as keyword/channel"). Phase 6 adds a _separate_ menu item for pausing the current tab, plus the session-storage flag + `YTC_PAUSE_CHANGED` broadcast. `attribute-applier.js` already listens for this message (scaffolded in Phase 2), so the content-side work is minimal.
- **Phase 7 — Testing hardening** (fixtures, integration tests, lint pass, bundle audit).
- **Phase 8 — Release prep** (icons, store listing, version tag).

### Guardrails for the next agent

1. **Do NOT touch test files** during the visual pivot — none of the existing tests assert specific hex values or gradient strings. If a test starts failing, it's a real bug.
2. **Do NOT change `ThemeContext` or theme-toggle behavior.** The switch between light/dark still works on `[data-theme='dark']`; the pivot only swaps token values.
3. **Do NOT re-introduce inline `rgba(247, 25, 99, …)` values.** Every color should route through a token. Allowed direct hex: `#ff4d4d`, `#f9cb28`, `#3c7cfc`, `#59c0e8`, `#ffffff`, `#000000` (and neutral surface hexes already declared in `:root`).
4. **Respect the user's "warm as default for both themes" rule.** Do not conditionally swap accents between light and dark. Only surfaces + text colors switch.
5. **Single-source-of-truth still applies.** If you find yourself typing `#ff4d4d` in more than one JSX file, step back and reach for `var(--color-accent-from)` instead.
6. **Run build + tests + lint after the last file is migrated.** That's the visual-pivot gate.
