/**
 * Per-tab pause — spec §7.2.
 *
 * One context-menu item on YouTube pages that toggles a session-scoped
 * `tabPaused:{tabId}` flag in `chrome.storage.session`. On toggle we send
 * `YTC_PAUSE_CHANGED` to the tab so the content script re-runs the
 * attribute applier. Menu title stays in sync across tab switches via
 * `chrome.tabs.onActivated`. State clears on tab close.
 *
 * Menu creation is invoked from context-menu.js so the two entry sources
 * share one `removeAll` lifecycle and don't race.
 */

const MENU_ID = 'ytc-pause-tab';
const SESSION_PREFIX = 'tabPaused:';
const PAUSE_LABEL = 'Pause youZen on this tab';
const RESUME_LABEL = 'Resume youZen on this tab';
const YT_URL_PATTERNS = ['*://*.youtube.com/*'];

export async function isTabPaused(tabId) {
  const key = `${SESSION_PREFIX}${tabId}`;
  return new Promise((resolve) =>
    chrome.storage.session.get(key, (r) => resolve(!!r?.[key])),
  );
}

export async function setTabPaused(tabId, paused) {
  const key = `${SESSION_PREFIX}${tabId}`;
  return new Promise((resolve) => {
    if (paused) {
      chrome.storage.session.set({ [key]: true }, () => resolve());
    } else {
      chrome.storage.session.remove(key, () => resolve());
    }
  });
}

export async function updateMenuTitle(tabId) {
  const paused = await isTabPaused(tabId);
  return new Promise((resolve) => {
    chrome.contextMenus.update(
      MENU_ID,
      { title: paused ? RESUME_LABEL : PAUSE_LABEL },
      () => {
        // Swallow "No menu item with id" when the menu hasn't been created
        // yet (e.g. during first-activation race on install).
        void chrome.runtime.lastError;
        resolve();
      },
    );
  });
}

export function createPauseMenuItem() {
  chrome.contextMenus.create({
    id: MENU_ID,
    title: PAUSE_LABEL,
    contexts: ['page'],
    documentUrlPatterns: YT_URL_PATTERNS,
  });
}

export function registerTabPause() {
  chrome.contextMenus.onClicked.addListener(async (info, tab) => {
    if (info?.menuItemId !== MENU_ID) return;
    if (!tab?.id) return;
    const next = !(await isTabPaused(tab.id));
    await setTabPaused(tab.id, next);
    try {
      await chrome.tabs.sendMessage(tab.id, { type: 'YTC_PAUSE_CHANGED' });
    } catch {
      // Content script may not be alive (tab not on youtube.com,
      // or still loading). Safe to ignore — storage change is source of truth.
    }
    await updateMenuTitle(tab.id);
  });

  chrome.tabs.onActivated.addListener(async (activeInfo) => {
    if (!activeInfo?.tabId) return;
    await updateMenuTitle(activeInfo.tabId);
  });

  chrome.tabs.onRemoved.addListener(async (tabId) => {
    await setTabPaused(tabId, false);
  });
}

export const tabPauseHandlers = {};

export const __testing = {
  MENU_ID,
  SESSION_PREFIX,
  PAUSE_LABEL,
  RESUME_LABEL,
  YT_URL_PATTERNS,
};
