# Transcript Panel Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A free transcript panel inside the YouTube watch page, next to the video, with phrase-level yellow karaoke, search, translation, copy, export and inline edits.

**Architecture:** A MAIN-world script captures the player's own timedtext URL/body (it carries the `pot` token) and the player response; the ISOLATED content script turns that into cues, owns the player button and moves a shadow-root host into the right slot for the layout; a lazily imported React app renders the panel inside that shadow root with plain Nord CSS.

**Tech Stack:** MV3, Vite 6 + @crxjs/vite-plugin 2.4, React 19, lucide-react, vitest + jsdom. No new dependencies.

**Spec:** `docs/superpowers/specs/2026-11-04-transcript-panel-design.md`

## Global Constraints

- Paths below are relative to `extension/`. Run commands from `extension/`.
- No new npm dependencies. No network calls except `https://www.youtube.com/api/timedtext`.
- Karaoke yellow `#ffc75f` (dark). Light mode: marker background `#ffc75f` at ~45% behind dark text.
- Search highlight sky `#8ecae6` (current match solid, others ~20%).
- Blocks: merge cues until ≥160 chars and the text ends a sentence (`/[.!?…]["'”’)\]]*$/`), or ≥260 chars.
- Timedtext link is fresh when `expire` (seconds) is missing or more than 60 s in the future.
- CC button: at most 5 attempts per video, never while `#movie_player.ad-showing`; always restore `aria-pressed` to its starting value.
- Edits: key `transcriptEdits:<videoId>|<lang>|<kind>`, index key `transcriptEditsIndex`, keep the 60 most recent.
- Settings keys: `transcriptPanel` (default true, missing = true), `transcriptLang`, `transcriptTranslateLang`, `transcriptShowTime` (default true), `transcriptAutoScroll` (default true).
- UI strings in English (youZen is English-only).
- Nothing heavy on page load: React panel only via dynamic `import()` on first open.
- `npm test` and `npm run build` green before every commit. Commits use Conventional Commits, no AI attribution.

## Review Focus

- Video with no captions at all (`captions` missing): panel shows "No transcript for this video", no CC clicking loop. → Task 3 test `resolves noCaptions when the player has no tracks`.
- Navigating to the next video with the panel open: old cues must not flash under the new title; state resets per videoId. → Task 5 test `resets when videoId changes`.
- User's CC preference: after loading, the CC button ends in the state it started (on stays on, off stays off). → Task 3 test `restores the CC button state`.
- Text with `<`, `&amp;`, emoji or RTL: rendered as text, never as HTML; entities decoded once. → Task 1 test `decodes entities and keeps markup as text`.
- Cue timing gaps (silence between cues) and seeking backwards: active cue is the last cue whose `start <= t`, or none before the first cue. → Task 1 test `findActiveCue handles gaps, before-first and seeking back`.

---

## File Structure

| File | Responsibility |
|---|---|
| `src/content/transcript/captions.js` | Pure: json3 parse, clean, blocks, active cue, track list, URL build/freshness |
| `src/content/transcript/exporters.js` | Pure: TXT/SRT/VTT/clipboard text, file name |
| `src/content/transcript/search.js` | Pure: accent/case fold with index map, match ranges |
| `src/content/transcript/edits.js` | chrome.storage edits per track, LRU 60 |
| `src/content/page-hooks.js` | MAIN world: fetch/XHR wrap for timedtext, player-response answer |
| `src/content/transcript/source.js` | ISOLATED: talks to page-hooks, CC toggle, loads a track |
| `src/content/transcript/placement.js` | Layout detection, anchors, slot sizing, fullscreen |
| `src/content/transcript/index.js` | Router handler: feature flag, pause, player button, open state, host, lazy mount |
| `src/content/transcript/mount.jsx` | Shadow root + CSS + fonts + React root |
| `src/content/transcript/Panel.jsx` (+ small components in the same folder) | The UI |
| `src/content/transcript/panel.css` | Panel styles (Nord, `:host` tokens, dark/light) |
| `src/theme/visual.css` | Copy of `~/Code/libs/nord-theme/visual.css` 1.2.0, header line naming the source |
| `src/assets/fonts/geist-latin.woff2` | Geist variable font (from loomGetter) |
| `src/config/features.js`, `src/styles/youtube.css`, `manifest.config.js`, `src/content/isolated-world.js` | Wiring |

---

### Task 1: Caption logic (pure)

**Files:**
- Create: `src/content/transcript/captions.js`
- Test: `tests/content/transcript-captions.test.js`

**Interfaces:**
- Produces:
  - `parseJson3(text: string) => Cue[]` where `Cue = { start: number /*s*/, end: number, text: string }`
  - `cleanText(raw: string) => string` (entities decoded via `DOMParser`/textarea, `[...]`, `>>`, `♪` removed, whitespace collapsed)
  - `mergeBlocks(cues: Cue[]) => Block[]` where `Block = { start, end, from: number, to: number /*inclusive cue indexes*/ }`
  - `findActiveCue(cues: Cue[], t: number) => number` (-1 before first)
  - `listTracks(captionTracks: any[]) => Track[]` where `Track = { lang, label, auto: boolean, params: { kind, name, variant } }` (params read from the track's `baseUrl`), one per language, manual preferred over `asr`
  - `buildTrackUrl(baseUrl: string, track: Track, tlang?: string|null) => string` (sets `lang`, the three params or deletes them, `fmt=json3`; `tlang` only when it differs from the track language ignoring region)
  - `isLinkFresh(url: string, now = Date.now()) => boolean`
  - `trackKey(url: string) => string` = `v|lang|kind|name|variant|tlang` from the URL

- [ ] **Step 1: Write failing tests** — `parses json3 events, skips aAppend and empty`, `end is next start, last end is start+dur`, `decodes entities and keeps markup as text` (`'&lt;b&gt; Tom &amp; Jerry'` → `'<b> Tom & Jerry'`), `removes [Music], >> and ♪`, `mergeBlocks closes at sentence end after 160 chars and forces at 260`, `findActiveCue handles gaps, before-first and seeking back`, `listTracks prefers manual over asr`, `buildTrackUrl sets lang/kind/tlang/fmt`, `isLinkFresh respects the 60 s margin`.
- [ ] **Step 2:** `npx vitest run tests/content/transcript-captions.test.js` → FAIL (module missing).
- [ ] **Step 3:** Implement. `findActiveCue` = binary search on `start`.
- [ ] **Step 4:** Same command → PASS.
- [ ] **Step 5:** Commit `feat(transcript): caption parsing and block logic`.

### Task 2: Export, search and edits (pure + storage)

**Files:**
- Create: `src/content/transcript/exporters.js`, `src/content/transcript/search.js`, `src/content/transcript/edits.js`
- Test: `tests/content/transcript-exporters.test.js`, `tests/content/transcript-search.test.js`, `tests/content/transcript-edits.test.js`

**Interfaces:**
- Consumes: `Cue`, `Block` from Task 1.
- Produces:
  - `textOf(cues, edits) => (i) => string` (edit wins over cue text; `edits` = `{ [startMs]: string }`)
  - `buildTxt({ blocks, cues, text, translations?, time: boolean }) => string` — one paragraph per block, `m:ss` (or `h:mm:ss`) line before it when `time`, translation paragraph under it when given, blank line between blocks
  - `buildSrt({ cues, text, translations? }) => string`, `buildVtt(...)` (starts `WEBVTT\n\n`); timestamps `HH:MM:SS,mmm` / `HH:MM:SS.mmm`; translation on the next line of the same cue when given
  - `safeFileName(title: string) => string` (removes `/\\?%*:|"<>`, collapses spaces, fallback `transcript`)
  - `fold(text: string) => { folded: string, map: number[] }` (NFD, strip `\p{M}`, lowercase; `map[i]` = index in original)
  - `findMatches(text: string, query: string) => Array<[start, end]>` (original indexes; query < 2 letters → `[]`)
  - `editKey(videoId, lang, kind) => string`, `loadEdits(key) => Promise<Record<string,string>>`, `saveEdits(key, edits) => Promise<void>` (empty → removes key; index keeps 60 newest), `formatTime(seconds) => string` (`m:ss` / `h:mm:ss`)

- [ ] **Step 1: Write failing tests** — `buildTxt with time and translation`, `buildSrt numbering and comma millis`, `buildVtt header and dot millis`, `edits replace cue text in exports`, `safeFileName strips illegal chars`, `fold ignores accents and case` (`findMatches('Café com AÇÚCAR', 'acucar')` → one range covering `AÇÚCAR`), `findMatches returns [] under 2 letters`, `saveEdits keeps the 60 most recent and removes empty`.
- [ ] **Step 2:** Run the three test files → FAIL.
- [ ] **Step 3:** Implement.
- [ ] **Step 4:** Run → PASS.
- [ ] **Step 5:** Commit `feat(transcript): export, search and edit storage`.

### Task 3: Caption source (page hooks + content side)

**Files:**
- Create: `src/content/page-hooks.js` (replace the spike stub), `src/content/transcript/source.js`
- Modify: `manifest.config.js` (MAIN-world entry already added by the spike; keep it)
- Test: `tests/content/transcript-source.test.js`

**Interfaces:**
- Messages (window.postMessage, `source: 'yz-hooks'` from the page, `source: 'yz-content'` to the page):
  - page → content `{ type: 'timedtext', url, body: string|null }`
  - content → page `{ type: 'player-request', id }`; page → content `{ type: 'player-response', id, value: { videoId, title, author, lengthSeconds, captionTracks, translationLanguages, playability } | null }`
- Produces (`source.js`):
  - `createCaptionSource({ win = window, doc = document, fetchFn = fetch, sleep }) => { getPlayer(videoId) => Promise<PlayerData|null>, loadTrack(videoId, { lang, kind, tlang }) => Promise<{ cues: Cue[] } | { error: 'noCaptions'|'rateLimited'|'noLink'|'network' }>, dispose() }`
  - Uses the captured body when `trackKey` matches (no fetch). HTTP 429 → wait 3 s, retry once, then `rateLimited`.

- [ ] **Step 1: Write failing tests** with jsdom + fake `postMessage`/`fetch`: `uses the player's body when lang/kind/tlang match`, `fetches json3 with the base URL params otherwise`, `clicks CC to get a link and restores the CC button state`, `does not click CC during an ad`, `stops after 5 attempts`, `resolves noCaptions when the player has no tracks`, `maps HTTP 429 twice to rateLimited`.
- [ ] **Step 2:** Run → FAIL.
- [ ] **Step 3:** Implement `source.js`; `page-hooks.js` = IIFE wrapping `fetch` and `XMLHttpRequest.prototype.open` (listen `loadend`, read `responseText`), answering `player-request` from `document.getElementById('movie_player')?.getPlayerResponse?.()`.
- [ ] **Step 4:** Run → PASS. `npm run build` → `dist/manifest.json` has the MAIN-world entry.
- [ ] **Step 5:** Commit `feat(transcript): capture the player's caption requests`.

### Task 4: Feature flag, player button, placement

**Files:**
- Create: `src/content/transcript/placement.js`, `src/content/transcript/index.js`
- Modify: `src/config/features.js` (loose watch entry), `src/content/isolated-world.js` (register handler), `src/styles/youtube.css` (related rules gated on `:not([data-yz-transcript-open])` + `#related` hidden when open)
- Test: `tests/content/transcript-placement.test.js`, `tests/config/features.test.js` (new entry)

**Interfaces:**
- Feature entry: `{ id: 'transcriptPanel', tab: 'watch', group: null, label: 'Transcript panel next to the video', description: 'Button in the player; click a line to jump there', attr: 'data-ytc-transcript', default: true, kind: 'js' }`
- Produces:
  - `detectLayout(flexy: Element) => 'theater'|'columns'|'single'`
  - `placeHost(host: HTMLElement, doc = document) => 'theater'|'columns'|'single'|null` (moves host into the anchor, sets its inline size; `null` = no anchor or fullscreen → host hidden)
  - `makeTranscriptHandler(ch = chrome) => PageHandler` (`id: 'transcript'`, `/watch` only): reads flag + pause, injects the button into `.ytp-right-controls-left` before `.ytp-subtitles-button` (fallback: before `.ytp-fullscreen-button`'s group), toggles open state (`sessionStorage['yz-transcript-open']`), sets `html[data-yz-transcript-open]`, re-places on `yt-navigate-finish`, flexy attribute changes, `resize`, `fullscreenchange`; calls `nudgePlayerResize()` when theater column appears/disappears; first open does `await import('./mount.jsx')`.

- [ ] **Step 1: Write failing tests** — `detectLayout reads theater / is-two-columns_`, `placeHost puts the host after #player-full-bleed-container in theater with flex 0 0 400px`, `placeHost prepends to #secondary-inner in columns`, `placeHost prepends to #below in single`, `placeHost returns null in fullscreen`, features test `transcriptPanel is JS-kind, default ON, group null`.
- [ ] **Step 2:** Run → FAIL.
- [ ] **Step 3:** Implement placement, handler, features entry, CSS gate, register handler in `isolated-world.js`.
- [ ] **Step 4:** Run full `npm test` → PASS; `npm run build` → OK.
- [ ] **Step 5:** Commit `feat(transcript): player button and in-page placement`.

### Task 5: Panel UI

**Files:**
- Create: `src/content/transcript/mount.jsx`, `Panel.jsx`, `Menus.jsx`, `panel.css`, `src/theme/visual.css`, `src/assets/fonts/geist-latin.woff2`
- Test: `tests/content/transcript-panel.test.jsx`

**Interfaces:**
- Consumes: Tasks 1–4 exports.
- Produces: `mountPanel(host: HTMLElement, ctx: { source, getVideo: () => HTMLVideoElement|null, getVideoId: () => string|null, onClose: () => void, ch }) => { unmount() }`.
- Panel behavior per spec Goals 2–13 and mockup `painel-a-v2.html`: header (track chip, Translate chip, search, close) ↔ search field; rows = blocks, phrases = cues as `<span>` with `onClick` seek; current block `.is-now`, current cue `.is-say`; dock (Scroll, Time | Copy, Export, ⋯); menus as `nv-menu`; theme from `document.documentElement.hasAttribute('dark')` observed with a MutationObserver; room light from `https://i.ytimg.com/vi/<id>/mqdefault.jpg`.

- [ ] **Step 1: Write failing tests** (render with fake source + fake video): `renders blocks and marks the active cue yellow`, `clicking a phrase seeks the video`, `search highlights matches and counts n of m`, `Esc closes search`, `copy writes buildTxt output to the clipboard`, `resets when videoId changes`, `shows No transcript for this video on noCaptions`.
- [ ] **Step 2:** Run → FAIL.
- [ ] **Step 3:** Implement mount (attachShadow open, `<style>` from `?inline` imports of `visual.css` + `panel.css`, `FontFace('Geist', url(chrome.runtime.getURL(...)))` added to `document.fonts` once) and the panel.
- [ ] **Step 4:** `npm test` → PASS; `npm run build` → OK; panel chunk is a separate `assets/*.js` listed in `web_accessible_resources`.
- [ ] **Step 5:** Commit `feat(transcript): Nord panel with karaoke, search, translate, copy, export, edit`.

### Task 6: Live check, version, tag

**Files:**
- Modify: `package.json`, `manifest.config.js` (version `1.1.0`), `CHANGELOG.txt`

- [ ] **Step 1:** `npm run build`; reload youZen in the shared Chrome (its `dist` is symlinked in `~/.claude-chrome/extensions/youzen`).
- [ ] **Step 2:** In an agent-owned tab, walk the spec's Verification list on `nok9rnFQcb4` and one manual-caption video (`aircAruvnKk`); screenshot theater, default, narrow, search, light theme. Restore theater mode and CC state afterwards.
- [ ] **Step 3:** Fix what fails (back to the owning task's tests first).
- [ ] **Step 4:** Bump to 1.1.0, add the CHANGELOG entry, `npm test && npm run build`.
- [ ] **Step 5:** Commit `feat: transcript panel next to the video (v1.1.0)` and `git tag -a v1.1.0 -m "youZen 1.1.0 — transcript panel"`.
