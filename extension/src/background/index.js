import { storageHandlers, registerStorageLifecycle } from './handlers/storage.js';
import { contentBridgeHandlers } from './handlers/content-bridge.js';
import { registerContextMenu } from './handlers/context-menu.js';
import { registerTabPause, tabPauseHandlers } from './handlers/tab-pause.js';

// ─── Handler Registry ───
// Add new domain handlers to this array; each module exports a map of
// { MESSAGE_TYPE: (message, sender) => value | Promise<value> } entries.
const handlerModules = [storageHandlers, contentBridgeHandlers, tabPauseHandlers];

// Install-time seeding + non-destructive top-up on updates.
registerStorageLifecycle();

// Context-menu entries — blocklist "Block selection" items + pause entry.
// Creation is centralized in context-menu.js so a single removeAll → create
// sequence avoids races between the two sources.
registerContextMenu();
registerTabPause();

const handlers = Object.assign({}, ...handlerModules);

// ─── Message Router ───
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  // Validate message shape
  if (!message || typeof message.type !== 'string') {
    console.warn('[BG] Invalid message received:', message);
    return false;
  }

  // Skip internal handler keys
  if (message.type.startsWith('__')) return false;

  const handler = handlers[message.type];
  if (!handler) {
    console.warn(`[BG] Unknown message type: ${message.type}`);
    return false;
  }

  try {
    const result = handler(message, sender);

    // Support async handlers
    if (result instanceof Promise) {
      result
        .then((data) => sendResponse(data))
        .catch((err) => {
          console.error(`[BG] Handler error (${message.type}):`, err);
          sendResponse({ error: err.message });
        });
      return true; // Keep channel open for async
    }

    if (result !== undefined) {
      sendResponse(result);
    }
  } catch (err) {
    console.error(`[BG] Handler error (${message.type}):`, err);
    sendResponse({ error: err.message });
  }

  return false;
});

// ─── Sidepanel ───
chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true });

// ─── Tab Cleanup ───
chrome.tabs.onRemoved.addListener((tabId) => {
  handlerModules.forEach((mod) => {
    if (typeof mod.__onTabRemoved === 'function') {
      mod.__onTabRemoved(tabId);
    }
  });
});
