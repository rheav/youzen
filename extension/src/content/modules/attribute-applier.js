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

/**
 * Production wrapper — called at document_start and on every storage.onChanged
 * / YTC_PAUSE_CHANGED message.
 */
export async function applyAttributes() {
  const tabId = await getCurrentTabId();
  return applyAttributesWith({ chrome, document, tabId });
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
