/**
 * Shorts page handler.
 *
 * When `redirectShorts` is enabled in storage, any visit to
 * /shorts/:id is rewritten to the normal watch page /watch?v=:id.
 *
 * Implementation notes:
 *   • Uses location.replace so the Shorts URL doesn't appear in history
 *     (Back button should go to wherever the user came from, not bounce
 *     them into Shorts).
 *   • We read chrome.storage.local directly inside onEnter rather than
 *     caching at module load, because the user may flip the toggle
 *     between boots and we don't want a stale decision.
 *   • If the path is /shorts/ (no id), we don't redirect — that's the
 *     Shorts browse surface, not a specific short.
 */

import { isPausedNow } from '../modules/pause-state.js';

const SHORTS_ID_RE = /^\/shorts\/([^/?#]+)/;

/** Extract a Shorts video id from a URL path. Returns null if none. */
export function extractShortsId(pathname) {
  if (typeof pathname !== 'string') return null;
  const m = SHORTS_ID_RE.exec(pathname);
  if (!m) return null;
  const id = m[1];
  // Basic sanity check — YouTube video ids are 11-char base64url today.
  // We accept 8-32 to be forgiving about future changes without whitelisting
  // every possible garbage path.
  if (id.length < 6 || id.length > 32) return null;
  return id;
}

/** Build the watch-page URL that replaces /shorts/:id. */
export function buildWatchUrl(shortsId, search = '') {
  const extraParams = new URLSearchParams(search);
  extraParams.delete('v');
  extraParams.set('v', shortsId);
  const qs = extraParams.toString();
  return qs ? `/watch?${qs}` : `/watch?v=${shortsId}`;
}

/**
 * Page-router handler for Shorts.
 *
 * @param {typeof chrome} ch  Chrome API surface (for tests)
 */
export function makeShortsHandler(ch = chrome) {
  return {
    id: 'shorts',
    test: (url) => /^\/shorts\//.test(url.pathname),
    onEnter: async (url) => {
      // Honour pause: never redirect while paused on this tab (or globally).
      if (await isPausedNow(ch)) return;
      const { redirectShorts } = await new Promise((resolve) =>
        ch.storage.local.get('redirectShorts', (r) => resolve(r ?? {})),
      );
      if (!redirectShorts) return;
      const id = extractShortsId(url.pathname);
      if (!id) return;
      const target = buildWatchUrl(id, url.search);
      // Replace so Back doesn't bounce back to the Short.
      location.replace(target);
    },
  };
}
