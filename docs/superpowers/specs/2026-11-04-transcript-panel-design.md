# youZen: transcript panel next to the video

Date: 2026-11-04. Status: approved by the user on 2026-11-04 ("gostei, quero que faça TUDO").

## Intent

youZen is becoming a study tool for students. The user found an old ZIP of "Transcript for YouTube™"
v3.0.1 (Vue, Web Store build, analysed 2026-11-04) and wants its features in youZen, **free**: no paywall,
no quotas, no account, no telemetry. The feature is **rewritten** in youZen's stack; no code is copied
from that bundle.

The heart of it is a transcript panel that lives **inside the YouTube page, next to the video**. The user
browses in Microsoft Edge, where the original always showed this in-page panel (it only used Chrome's
side panel on Google Chrome). The user wants the panel itself, not Chrome's side panel.

## What the user decided

- **Layout: variant A, "Lista com doca", plus search.** Visual reference:
  `.superpowers/brainstorm/67624-1793820961/content/painel-a-v2.html` (stage + "Tocando" + "Buscando").
  One block of speech per row, time on the left, current block lit; actions in a frosted-glass dock at
  the bottom (Scroll, Time | Copy, Export, ⋯); header = caption-track chip, Translate chip, search, close.
- **Karaoke:** the phrase being spoken right now is **yellow**, the same yellow as the original
  (`#ffc75f` on dark). It moves phrase by phrase. Word by word is not possible: measured on video
  `nok9rnFQcb4`, YouTube's json3 auto captions arrive in ~5 s cues with no per-word offsets (translated
  tracks carry fake, evenly spaced offsets). The original and the user's unfunnelizer also highlight per
  phrase. The user: "da forma que eles fazem hoje já está ótimo".
- **Search:** the header chips turn into a search field; matches in sky blue so they never clash with
  the yellow.
- **Placement (approved as mocked):** theater mode = to the right of the player, at its height; default
  layout = top of the right column, related videos below it; narrow window = below the player; hidden in
  fullscreen. With youZen's "Related videos sidebar" hidden, the panel keeps the right column for itself.
- **Visual language:** the shared Nord theme, "Sala do Flow" (`~/Code/libs/nord-theme`, v1.2.0,
  README "Sala do Flow: o padrão de UI"). The current video's thumbnail is the panel's room light.
- **Out:** AI summary (user: "pode pular"), paywall, telemetry, sibling-extension promos, the original's
  third-party URL fallback, 11 themes, UI scale, hiding toolbar buttons, find & replace.
- **Order:** this panel first. Re-skinning youZen's own side panel to Nord is a separate project after it.

## Goals

1. A youZen button in the player's right controls on `/watch` toggles the panel. The open/closed state
   survives in-page navigation to the next video (per tab, `sessionStorage`).
2. The panel shows the selected caption track as rows; clicking a row (or a phrase inside it) seeks the
   video there.
3. Current block highlighted, current phrase yellow, past blocks dimmed; updates as the video plays.
4. **Scroll** (dock): keeps the current block in view, centered. A wheel/touch scroll by the user or
   opening search turns it off; clicking Scroll turns it on and jumps back.
5. **Time** (dock): show/hide the time column.
6. **Track chip:** lists the video's caption tracks (manual preferred over auto for the same language,
   auto marked "auto-generated"); remembers the last chosen language as the default for next videos.
7. **Translate chip:** pick a target language from YouTube's own translation list; each row then shows
   the translation under the original (YouTube translates via `tlang`, free). "Off" removes it.
   Remembers the last target language.
8. **Search:** search icon or Ctrl/⌘+F while focus is inside the panel. Case- and accent-insensitive
   ("cafe" finds "café"), minimum 2 letters. Shows "n of m", Enter/↓ next, Shift+Enter/↑ previous,
   current match scrolled into view, Esc closes. Searches the original and the translation when shown.
9. **Copy** (dock): the whole transcript to the clipboard as plain text paragraphs, with `m:ss` times
   when Time is on, translation under each paragraph when shown. Brief "Copied" feedback.
10. **Export** (dock): a small menu: format TXT / SRT / VTT, "Timestamps" (TXT only), "Include
    translation" (only when loaded), and a Download button. File name = video title, illegal characters
    removed.
11. **Edit** (⋯ menu): "Edit transcript" makes each phrase editable inline (Enter = next phrase, Esc =
    undo that phrase, "Done" leaves edit mode); edits are saved per video + language + track kind in
    `chrome.storage.local` (last 60 videos) and used by copy, export and search. "Undo all edits" in the
    same menu when there are edits. Translation text is not editable.
12. **Theme:** follows YouTube (`html[dark]`): dark = Nord room with the thumbnail light; light = Nord
    light tokens (no room light, no vignette). Yellow text is unreadable on a light background (the
    original's `#ffaf34` is under 2:1), so in light mode the current phrase gets a yellow marker
    background (`#ffc75f` at ~45%) behind normal dark text.
13. **States:** loading (skeleton rows), no captions on this video, YouTube rate-limiting (HTTP 429: "YouTube
    is limiting caption requests from your network. Try again in a few minutes."), live stream without
    captions, and an ad playing (wait for it to end; show "Waiting for the ad to finish").
14. **youZen integration:** a "Transcript panel" toggle in the side panel's Watch tab, loose row, default
    ON. Off → no player button and the panel is removed. youZen's per-tab pause also removes it.

## Non-goals

- Word-by-word karaoke, AI summary, find & replace, more than one theme, UI scale, persisting
  transcripts across page loads (no IndexedDB cache), Chrome's side panel as a host, mobile layouts,
  YouTube Shorts, embedded players on other sites, i18n (youZen is English-only today; strings are
  English).

## Anti-goals

- Anything sent to a server other than YouTube itself. No analytics, no accounts.
- Slowing YouTube down: nothing heavy loads until the user opens the panel the first time.
- Breaking youZen's existing watch-page behavior (theater reclaim, related-videos reclaim, description
  collapse) or the user's caption preference (CC on/off must end as it started).
- Animations at rest; `prefers-reduced-motion` must turn off every transition.

## How it works (decided by Claude; the user can override)

- **Getting captions (the one fragile part).** YouTube's timedtext URL carries a `pot` token (measured
  2026-11-04), so the extension reuses the URL the player itself requests:
  - `src/content/page-hooks.js` runs in the page's MAIN world at `document_start` (CRXJS 2.4 builds it as
    a plain IIFE in the manifest; verified). It wraps `fetch` and `XMLHttpRequest.open` and, for
    `/api/timedtext` requests, `postMessage`s the URL and the response text to the content script. It
    also answers a request for the player response (`movie_player.getPlayerResponse()`, reduced to
    videoId, title, author, lengthSeconds, captions tracklist).
  - The ISOLATED content script keeps the latest URL per videoId. When the panel needs captions and has
    no fresh URL (missing or `expire` within 60 s), it clicks the player's CC button to make the player
    ask (toggle on, wait, restore the original state; up to 5 attempts per video; never during an ad).
  - To load a track it copies that URL, sets `lang`, `kind` (`asr` or removed), `tlang` (or removed),
    `fmt=json3`, and fetches it from the content script. If the player already fetched the same
    lang/kind/tlang, its body is used and no request is made.
  - Parse json3: events with `segs`, skipping `aAppend` events; text = joined `utf8`, whitespace
    collapsed, HTML entities decoded; `[Music]`-style tags, `>>`, `♪` removed; empty cues dropped;
    `end` = next cue's `start` (auto captions overlap), last cue `start + dur`.
- **Blocks:** consecutive cues merge into a block until it holds ≥160 characters and ends a sentence, or
  reaches 260 characters. Blocks are the rows; cues are the phrases inside (the yellow unit).
- **Time:** the content script listens to the `<video>`'s `timeupdate`, `seeked`, `play`, `pause`; the
  active cue is the last cue with `start <= currentTime` (binary search). Seeking sets
  `video.currentTime`.
- **Rendering:** the panel is a React 19 app (youZen's existing React) mounted in a **shadow root** on a
  host element that the content script moves into the right place for the layout. Moving a div keeps the
  React state; this replaces the original's iframe + absolute-positioning sync loop. The panel module is
  a dynamic `import()` made on first open, so the player button is the only cost until then.
- **Placement** (`ytd-watch-flexy` attributes): `is-two-columns_` absent → narrow: prepend to
  `#primary-inner > #below`, height `clamp(240px, 40vh, 480px)`. `theater` → after
  `#player-full-bleed-container` inside `#full-bleed-container`, `flex: 0 0 400px`, 8 px inset. Else →
  prepend to `#secondary-inner`, height = max(360, player height). Re-placed on `yt-navigate-finish`,
  `ytd-watch-flexy` attribute changes and window resize; a synthetic `resize` is fired when the theater
  column appears or goes so the player re-measures (youZen's `nudgePlayerResize`). Hidden in fullscreen.
- **youZen CSS interplay:** `html[data-yz-transcript-open]` is set while the panel is open. The
  related-videos rules in `youtube.css` then keep `#secondary` visible but hide `#related`, and the
  primary-column widening rules do not apply. Theater rules for live chat stay as they are.
- **Styling:** plain CSS inside the shadow root (no Tailwind: its `@property` registrations do not work in
  shadow roots). `src/theme/visual.css` is a copy of the lib's `visual.css` (header says where it came
  from); its `--nv-*` variables are re-declared on `:host` because `:root` does not reach a shadow root.
  Geist variable font bundled as a local `woff2` and registered on `document.fonts` (shadow roots use
  document fonts). Icons: `lucide-react` (already a dependency).
- **Settings storage:** `transcriptPanel` (feature flag, default true; missing key = default),
  `transcriptLang`, `transcriptTranslateLang`, `transcriptShowTime` (default true),
  `transcriptAutoScroll` (default true), edits under `transcriptEdits:<key>` + an index of the last 60.

## Settled after the builder check (Claude's calls, 2026-11-04)

- **Changing `lang`/`kind`/`tlang` on the player's URL works** (measured 2026-11-04: the player's `pt` URL
  rewritten to `lang=en&kind=asr` returned 200 with 252 events on `aircAruvnKk`; adding `tlang=pt` returned
  translated cues). One captured URL serves every track and translation.
- **Default layout order:** the panel is the first child of `#secondary-inner`, above the playlist, live
  chat and YouTube's own panels (as the original did).
- **Related videos hidden + panel open:** `#secondary` shows again with only `#related` hidden, so a
  playlist (hidden today only as a side effect of hiding the column) comes back while the panel is open.
  youZen's live-chat rule still hides chat.
- **Theater with YouTube's own column open** (`#panels-full-bleed-container` visible: chat, YouTube's
  transcript, description): our panel stays its own 400 px column next to the player. Rare; accepted.
- **Translation across videos:** if translation was on when the user left a video, it stays on for the
  next one (the original kept its dual mode too); a video whose track is already in the target language
  shows no translation.

## What the builder decides

- File layout under `src/content/transcript/`, component split, message names between page-hooks and
  the content script, exact skeleton and empty-state copy within the mockup's tone.
- How the menus (track list, translate list, export, ⋯) look, within Nord `nv-menu`.

## Verification

- Unit tests (vitest): json3 parsing and cleaning, block merging, active-cue lookup, TXT/SRT/VTT export,
  accent-insensitive search, timedtext URL building, placement-layout detection.
- `npm test` and `npm run build` green before every commit.
- Live check in the shared Chrome (youZen's `dist` is loaded there) on `nok9rnFQcb4` and one video with
  manual captions: button appears; panel opens in theater, default and narrow layouts; yellow phrase
  follows playback; click seeks; scroll on/off; search; translate to Portuguese; copy; export each
  format; edit + undo; light YouTube theme; feature toggle off; CC state restored; related-videos hidden
  case. Screenshots for the user.
- Version 1.1.0 after the live check; commit + annotated tag `v1.1.0`. Push only when the user asks.
