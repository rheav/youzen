/**
 * Messaging utility — chrome.runtime / chrome.tabs message helpers
 *
 * Provides a thin promise-based wrapper around Chrome's messaging APIs
 * with consistent error handling for "Extension context invalidated" errors.
 *
 * Usage:
 *   import { sendMessage, sendTabMessage, MESSAGE_TYPES } from '@/utils/messaging';
 *   const tabId = await sendMessage(MESSAGE_TYPES.YTC_WHO_AM_I);
 *   await sendTabMessage(tabId, MESSAGE_TYPES.YTC_PAUSE_CHANGED, { paused: true });
 */

import { warn, error } from './logger.js';

// ─── Message type constants ──────────────────────────────────────────────────
// Centralise all message type strings so both senders and listeners reference
// the same value, eliminating typo-related bugs.

export const MESSAGE_TYPES = {
  // Storage proxy (handlers/storage.js).
  STORAGE_GET: 'STORAGE_GET',
  STORAGE_SET: 'STORAGE_SET',

  // yt-cleanse — content ↔ background.
  YTC_WHO_AM_I: 'YTC_WHO_AM_I', // content → bg, resolves to sender tab id
  YTC_PAUSE_CHANGED: 'YTC_PAUSE_CHANGED', // bg → content, notifies pause-state flip
};

/**
 * Checks whether an error is a context-invalidation error.
 */
function isContextInvalidated(err) {
  return (
    err && typeof err.message === 'string' && err.message.includes('Extension context invalidated')
  );
}

/**
 * Sends a message to the extension's background service worker
 * (or any listener registered via chrome.runtime.onMessage).
 *
 * @param {string} type One of MESSAGE_TYPES.
 * @param {Object} [data={}] Additional payload fields merged into the message.
 * @returns {Promise<*>} The response from the listener, or null on error.
 */
export async function sendMessage(type, data = {}) {
  try {
    const response = await chrome.runtime.sendMessage({ type, ...data });
    return response;
  } catch (err) {
    if (isContextInvalidated(err)) {
      warn('sendMessage: context invalidated for', type);
    } else {
      // "Could not establish connection" is common when no listener exists —
      // log at warn level rather than error to reduce noise.
      error('sendMessage error:', type, err);
    }
    return null;
  }
}

/**
 * Sends a message to a specific tab's content script
 * (or any listener registered via chrome.runtime.onMessage in that tab).
 *
 * @param {number} tabId Target tab ID.
 * @param {string} type  One of MESSAGE_TYPES.
 * @param {Object} [data={}] Additional payload fields merged into the message.
 * @returns {Promise<*>} The response from the listener, or null on error.
 */
export async function sendTabMessage(tabId, type, data = {}) {
  try {
    const response = await chrome.tabs.sendMessage(tabId, { type, ...data });
    return response;
  } catch (err) {
    if (isContextInvalidated(err)) {
      warn('sendTabMessage: context invalidated for', type);
    } else {
      error('sendTabMessage error:', tabId, type, err);
    }
    return null;
  }
}
