/**
 * attribute-applier — the CSS-engine driver.
 *
 * Reads chrome.storage.local + chrome.storage.session at document_start and
 * sets data-ytc-* attributes on <html>. src/styles/youtube.css has one rule
 * block per attribute — so toggling storage flips visibility with no flicker
 * and no JS re-render.
 *
 * @see docs/superpowers/specs/2026-04-19-yt-cleanse-design.md §5.2
 */

import { FEATURES } from '@/config/features';

const PAUSE_ATTR = 'data-ytc-paused';

/** Cached after the first successful YTC_WHO_AM_I round-trip. */
let cachedTabId = null;

/**
 * Every storage.local key the applier reads. Built once from the registry so
 * we can do a targeted `storage.local.get(KEYS)` instead of `get(null)` —
 * reading the whole store (blocklists included) on every change was pure
 * waste, and the blocklists are the largest values we keep.
 */
const READ_KEYS = (() => {
  const keys = ['globallyPaused'];
  for (const entry of FEATURES) {
    if (entry.isMaster) continue;
    keys.push(entry.id);
    if (entry.extra?.kind === 'select') keys.push(entry.extra.key);
  }
  return keys;
})();

/** Same set as a Set, for the storage.onChanged relevance test. */
const READ_KEY_SET = new Set(READ_KEYS);

/**
 * Set or remove an attribute only when it would actually change.
 * Re-writing an attribute that is already in the desired state still
 * invalidates style for the whole subtree, and <html> is the whole document.
 */
function setAttr(el, name, present, value = '') {
  if (present) {
    if (el.getAttribute(name) !== value) el.setAttribute(name, value);
  } else if (el.hasAttribute(name)) {
    el.removeAttribute(name);
  }
}

/** Returns the extension's own tab id, asking the background for it once. */
async function getCurrentTabId() {
  if (cachedTabId !== null) return cachedTabId;
  try {
    const reply = await chrome.runtime.sendMessage({ type: 'YTC_WHO_AM_I' });
    if (reply && typeof reply.tabId === 'number') {
      cachedTabId = reply.tabId;
    }
  } catch {
    // Service worker may be asleep or the page is still early.
    // Leave cachedTabId null; we'll retry on the next applyAttributes call.
  }
  return cachedTabId;
}

/**
 * Core applier — pure with respect to chrome.* APIs it consumes.
 * Exported for unit tests (pass fake chrome + document in).
 *
 * @param {Object} opts
 * @param {typeof chrome} opts.chrome    Chrome API surface
 * @param {Document}      opts.document  DOM to mutate
 * @param {number|null}   opts.tabId     Current tab id (null ok; applier skips per-tab pause)
 */
export async function applyAttributesWith({ chrome: ch, document: doc, tabId }) {
  const html = doc.documentElement;
  if (!html) return;

  const local = await new Promise((resolve) => {
    ch.storage.local.get(READ_KEYS, (result) => resolve(result ?? {}));
  });

  let sessionPaused = false;
  if (tabId !== null && tabId !== undefined) {
    const key = `tabPaused:${tabId}`;
    sessionPaused = await new Promise((resolve) => {
      ch.storage.session.get(key, (result) => resolve(!!result?.[key]));
    });
  }

  const paused = !!local.globallyPaused || sessionPaused;

  if (paused) {
    for (const entry of FEATURES) {
      if (entry.isMaster) continue;
      if (entry.attr) setAttr(html, entry.attr, false);
      if (entry.extra?.kind === 'select') {
        setAttr(html, `${entry.attr}-mode`, false);
      }
    }
    setAttr(html, PAUSE_ATTR, true);
    return;
  }

  setAttr(html, PAUSE_ATTR, false);

  for (const entry of FEATURES) {
    if (entry.isMaster) continue;
    // JS-kind features still set their attr so CSS/other readers can detect
    // state, but they don't have a CSS rule themselves.
    setAttr(html, entry.attr, !!local[entry.id]);

    if (entry.extra?.kind === 'select') {
      const value = local[entry.extra.key] ?? entry.extra.default;
      setAttr(html, `${entry.attr}-mode`, true, value);
    }
  }
}

/**
 * Attributes whose toggle changes how much horizontal room the watch player
 * has: the related sidebar (two-column mode) and live chat (theater mode's
 * panel column). Flipping either needs a resize nudge.
 */
const LAYOUT_ATTRS = ['data-ytc-related', 'data-ytc-live-chat'];

/**
 * Nudge YouTube to recompute the watch-player size.
 *
 * YouTube sizes the watch player imperatively in JS, reading the layout custom
 * props that youtube.css overrides under [data-ytc-related]. Those overrides
 * only take effect on the next layout recompute, so toggling the related
 * sidebar needs a synthetic 'resize' — otherwise the player won't grow to fill
 * the reclaimed width until the user next resizes the window. rAF lets the CSS
 * apply first; the delayed second fire covers YouTube's own debounce.
 */
export function nudgePlayerResize() {
  if (typeof window === 'undefined') return;
  const fire = () => window.dispatchEvent(new Event('resize'));
  if (typeof requestAnimationFrame === 'function') requestAnimationFrame(fire);
  else fire();
  setTimeout(fire, 250);
}

/**
 * Production wrapper — called at document_start and on every storage.onChanged
 * / YTC_PAUSE_CHANGED message.
 */
export async function applyAttributes() {
  const tabId = await getCurrentTabId();
  const html = document.documentElement;
  const before = LAYOUT_ATTRS.map((attr) => !!html?.hasAttribute(attr));
  await applyAttributesWith({ chrome, document, tabId });
  if (html && LAYOUT_ATTRS.some((attr, i) => html.hasAttribute(attr) !== before[i])) {
    nudgePlayerResize();
  }
}

/**
 * Wire the applier to Chrome runtime. Idempotent: safe to call more than once.
 * Returns a disposer that removes the listeners (used only by tests).
 */
export function initAttributeApplier() {
  // Fire once synchronously on boot.
  void applyAttributes();

  const onStorageChange = (changes, area) => {
    // Session writes are per-tab pause keys; always relevant.
    if (area === 'session') {
      void applyAttributes();
      return;
    }
    if (area !== 'local') return;
    // Blocklist edits and UI prefs (theme, language, compactMode…) live in the
    // same area but change no attribute — skip the whole storage round-trip.
    for (const key of Object.keys(changes)) {
      if (READ_KEY_SET.has(key)) {
        void applyAttributes();
        return;
      }
    }
  };
  const onMessage = (msg) => {
    if (msg?.type === 'YTC_PAUSE_CHANGED') void applyAttributes();
  };

  chrome.storage.onChanged.addListener(onStorageChange);
  chrome.runtime.onMessage.addListener(onMessage);

  return function dispose() {
    try {
      chrome.storage.onChanged.removeListener(onStorageChange);
      chrome.runtime.onMessage.removeListener(onMessage);
    } catch {
      // Context already invalidated.
    }
  };
}
