/**
 * Content ↔ background bridge handlers.
 *
 * Provides primitives the content script needs from the service worker
 * that it cannot discover locally.
 *
 *   • YTC_WHO_AM_I  — resolves to the caller's tab id so the content script
 *                     can read chrome.storage.session[`tabPaused:<id>`].
 *
 * Handler signature matches the router convention in background/index.js:
 *   (message, sender) => value | Promise<value>
 */
export const contentBridgeHandlers = {
  YTC_WHO_AM_I: (_message, sender) => {
    return { tabId: sender?.tab?.id ?? null };
  },
};
