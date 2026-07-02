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
    ch.storage.local.get(null, (result) => resolve(result ?? {}));
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
      if (entry.attr) html.removeAttribute(entry.attr);
      if (entry.extra?.kind === 'select') {
        html.removeAttribute(`${entry.attr}-mode`);
      }
    }
    html.setAttribute(PAUSE_ATTR, '');
    return;
  }

  html.removeAttribute(PAUSE_ATTR);

  for (const entry of FEATURES) {
    if (entry.isMaster) continue;
    if (entry.kind === 'js') {
      // JS-kind features still set their attr so CSS/other readers can detect state,
      // but they don't have a CSS rule themselves.
      if (local[entry.id]) html.setAttribute(entry.attr, '');
      else html.removeAttribute(entry.attr);
      continue;
    }
    if (local[entry.id]) html.setAttribute(entry.attr, '');
    else html.removeAttribute(entry.attr);

    if (entry.extra?.kind === 'select') {
      const value = local[entry.extra.key] ?? entry.extra.default;
      html.setAttribute(`${entry.attr}-mode`, value);
    }
  }
}

/** Layout attribute whose toggle changes the watch-player width. */
const RELATED_ATTR = 'data-ytc-related';

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
function nudgePlayerResize() {
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
  const relatedBefore = !!html?.hasAttribute(RELATED_ATTR);
  await applyAttributesWith({ chrome, document, tabId });
  if (html && html.hasAttribute(RELATED_ATTR) !== relatedBefore) {
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

  const onStorageChange = (_changes, area) => {
    if (area === 'local' || area === 'session') {
      void applyAttributes();
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
