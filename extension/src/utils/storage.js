/**
 * Storage utility — chrome.storage.local helpers
 *
 * Wraps chrome.storage.local with promise-based helpers, quota awareness,
 * and graceful handling of "Extension context invalidated" errors that
 * occur when the background service worker or content script is stale.
 *
 * Usage:
 *   import { getStorage, setStorage, watchStorage } from '@/utils/storage';
 *   const settings = await getStorage('settings', { theme: 'light' });
 */

import { log, warn, error } from './logger.js';

// Chrome storage.local quota is 10 MB (QUOTA_BYTES = 10485760).
// We warn if a single write exceeds this threshold.
const LARGE_WRITE_THRESHOLD = 8 * 1024 * 1024; // 8 MB

/**
 * Checks whether an error is a context-invalidation error.
 * These happen when the extension was updated/reloaded while a page
 * still holds a reference to the old context.
 */
function isContextInvalidated(err) {
  return (
    err &&
    typeof err.message === 'string' &&
    err.message.includes('Extension context invalidated')
  );
}

/**
 * Reads a value from chrome.storage.local.
 *
 * @param {string} key            Storage key to read.
 * @param {*}      [defaultValue] Value returned when the key is missing or
 *                                an error occurs.
 * @returns {Promise<*>} The stored value, or defaultValue.
 */
export async function getStorage(key, defaultValue = null) {
  try {
    const result = await chrome.storage.local.get(key);
    return result[key] !== undefined ? result[key] : defaultValue;
  } catch (err) {
    if (isContextInvalidated(err)) {
      warn('getStorage: context invalidated, returning default for', key);
    } else {
      error('getStorage error:', err);
    }
    return defaultValue;
  }
}

/**
 * Writes a value to chrome.storage.local.
 *
 * Checks approximate payload size before writing and warns if the value
 * approaches the 10 MB quota.
 *
 * @param {string} key   Storage key.
 * @param {*}      value Value to store (must be JSON-serialisable).
 * @returns {Promise<void>}
 */
export async function setStorage(key, value) {
  try {
    // Rough quota check for large payloads
    const size = new Blob([JSON.stringify(value)]).size;
    if (size > LARGE_WRITE_THRESHOLD) {
      warn(
        `setStorage: value for "${key}" is ~${(size / 1024 / 1024).toFixed(1)} MB — nearing quota limit`,
      );
    }

    await chrome.storage.local.set({ [key]: value });
    log('setStorage:', key);
  } catch (err) {
    if (isContextInvalidated(err)) {
      warn('setStorage: context invalidated for', key);
    } else {
      error('setStorage error:', err);
    }
  }
}

/**
 * Removes a key from chrome.storage.local.
 *
 * @param {string} key Storage key to remove.
 * @returns {Promise<void>}
 */
export async function removeStorage(key) {
  try {
    await chrome.storage.local.remove(key);
    log('removeStorage:', key);
  } catch (err) {
    if (isContextInvalidated(err)) {
      warn('removeStorage: context invalidated for', key);
    } else {
      error('removeStorage error:', err);
    }
  }
}

/**
 * Watches a specific key in chrome.storage for changes.
 *
 * @param {string}   key      The storage key to observe.
 * @param {Function} callback Called with (newValue, oldValue) when the key changes.
 * @returns {Function} Unsubscribe function — call it to stop listening.
 */
export function watchStorage(key, callback) {
  const listener = (changes, areaName) => {
    if (areaName !== 'local') return;
    if (changes[key]) {
      callback(changes[key].newValue, changes[key].oldValue);
    }
  };

  try {
    chrome.storage.onChanged.addListener(listener);
  } catch (err) {
    if (isContextInvalidated(err)) {
      warn('watchStorage: context invalidated, listener not attached for', key);
    } else {
      error('watchStorage error:', err);
    }
  }

  // Return unsubscribe function
  return () => {
    try {
      chrome.storage.onChanged.removeListener(listener);
    } catch {
      // Context may already be invalidated — safe to ignore
    }
  };
}

/**
 * Returns the number of bytes currently in use in chrome.storage.local.
 *
 * @returns {Promise<number>} Bytes in use, or 0 on error.
 */
export async function getBytesInUse() {
  try {
    const bytes = await chrome.storage.local.getBytesInUse(null);
    return bytes;
  } catch (err) {
    if (isContextInvalidated(err)) {
      warn('getBytesInUse: context invalidated');
    } else {
      error('getBytesInUse error:', err);
    }
    return 0;
  }
}
