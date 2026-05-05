/**
 * Storage handlers + seeding + reset.
 *
 * Responsibilities:
 *   • STORAGE_GET / STORAGE_SET — generic proxy (unused by yt-cleanse's own
 *     content script since it reads chrome.storage directly, but kept as
 *     a general-purpose service).
 *   • computeDefaults() — derives the initial storage shape from
 *     src/config/features.js plus the app-state defaults in spec §9.1.
 *   • seedDefaults() — installs defaults on chrome.runtime.onInstalled
 *     (reason === 'install') without touching existing keys.
 *   • resetToDefaults() — clears storage.local and reapplies defaults.
 */

import { FEATURES } from '@/config/features';

/** Current storage schema version. Bumped when we introduce a migration. */
export const SCHEMA_VERSION = 1;

/**
 * Pure function: returns the full default storage object.
 * Exported so tests can assert its shape without touching chrome.storage.
 *
 * @returns {Record<string, any>}
 */
export function computeDefaults() {
  const defaults = {
    schemaVersion: SCHEMA_VERSION,
    blocklistKeywords: [],
    blocklistChannels: [],
    globallyPaused: false,
    appTheme: 'auto',
    language: null,
    compactMode: false,
    flags: { welcomeDismissed: false },
  };
  for (const entry of FEATURES) {
    if (entry.isMaster) continue;
    defaults[entry.id] = entry.default;
    if (entry.extra?.kind === 'select') {
      defaults[entry.extra.key] = entry.extra.default;
    }
  }
  return defaults;
}

/**
 * Seed storage.local with defaults. Non-destructive by default: existing keys
 * are preserved; only missing ones are populated. Pass { force: true } from
 * resetToDefaults to clear first.
 *
 * @param {Object} [opts]
 * @param {boolean} [opts.force=false]  Clear existing storage before seeding.
 * @returns {Promise<void>}
 */
export async function seedDefaults({ force = false } = {}) {
  const defaults = computeDefaults();
  if (force) {
    await new Promise((resolve) => chrome.storage.local.clear(() => resolve()));
    await new Promise((resolve) => chrome.storage.local.set(defaults, () => resolve()));
    return;
  }
  // Non-destructive: only write keys that are currently absent.
  const current = await new Promise((resolve) =>
    chrome.storage.local.get(null, (r) => resolve(r ?? {})),
  );
  const patch = {};
  for (const [k, v] of Object.entries(defaults)) {
    if (!(k in current)) patch[k] = v;
  }
  if (Object.keys(patch).length > 0) {
    await new Promise((resolve) => chrome.storage.local.set(patch, () => resolve()));
  }
}

/**
 * Reset to the full default set. Clears storage.local first, then re-seeds.
 * Used by the Reset-to-defaults button in the settings popover.
 *
 * @returns {Promise<void>}
 */
export async function resetToDefaults() {
  return seedDefaults({ force: true });
}

/**
 * Generic storage proxy for callers that can't hit chrome.storage directly.
 */
export const storageHandlers = {
  STORAGE_GET: async (message) => {
    return new Promise((resolve) => {
      chrome.storage.local.get(message.key, (result) => {
        resolve(result[message.key] ?? message.defaultValue ?? null);
      });
    });
  },

  STORAGE_SET: async (message) => {
    return new Promise((resolve) => {
      chrome.storage.local.set({ [message.key]: message.value }, () => {
        resolve({ success: true });
      });
    });
  },

  /**
   * RESET_TO_DEFAULTS — handler for the sidepanel's Reset button.
   * Returns { success: true } when done.
   */
  RESET_TO_DEFAULTS: async () => {
    await resetToDefaults();
    return { success: true };
  },
};

/**
 * Wire install-time seeding. Call once from background/index.js.
 * Idempotent (addListener on the service worker's lifecycle).
 */
export function registerStorageLifecycle() {
  chrome.runtime.onInstalled.addListener(async (details) => {
    if (details.reason === 'install') {
      await seedDefaults({ force: false });
    } else if (details.reason === 'update') {
      // Non-destructive top-up: add any new keys introduced in this version.
      await seedDefaults({ force: false });
    }
  });
}
