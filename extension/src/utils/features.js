/**
 * Feature-state helpers shared between the sidepanel UI and tests.
 *
 * A master toggle's visual state is derived from its subs:
 *   • 'on'            — every sub is truthy in storage
 *   • 'off'           — every sub is falsy in storage
 *   • 'indeterminate' — some are on, some are off
 *
 * These helpers are pure: they read and return plain values, so they're
 * trivial to unit-test.
 *
 * @see docs/superpowers/specs/2026-04-19-yt-cleanse-design.md §3.4
 */

import { findMaster } from '@/config/features';

/**
 * Derive a master's on/off/indeterminate state from the storage snapshot.
 *
 * @param {string} masterId   Master entry id (e.g. 'hideShorts').
 * @param {Record<string, any>} storage  Shape of chrome.storage.local.
 * @returns {'on' | 'off' | 'indeterminate'}
 * @throws  When the master id is unknown — callers should never pass an
 *          arbitrary id.
 */
export function getMasterState(masterId, storage) {
  const master = findMaster(masterId);
  if (!master) {
    throw new Error(`getMasterState: unknown master '${masterId}'`);
  }
  let onCount = 0;
  for (const subId of master.subs) {
    if (storage?.[subId]) onCount += 1;
  }
  if (onCount === 0) return 'off';
  if (onCount === master.subs.length) return 'on';
  return 'indeterminate';
}

/**
 * Produce the storage patch needed to flip a master to a target state.
 *
 * Usage:
 *   const patch = setMasterState('hideShorts', true, storage);
 *   await chrome.storage.local.set(patch);
 *
 * @param {string} masterId
 * @param {boolean} nextOn   Target state — true flips all subs on, false off.
 * @param {Record<string, any>} _storage  Current storage (unused today; kept
 *   for API symmetry so future logic — e.g. "ignore disabled subs" — can
 *   consult it without breaking callers).
 * @returns {Record<string, boolean>} Patch to apply.
 */
export function setMasterState(masterId, nextOn, _storage) {
  const master = findMaster(masterId);
  if (!master) {
    throw new Error(`setMasterState: unknown master '${masterId}'`);
  }
  /** @type {Record<string, boolean>} */
  const patch = {};
  for (const subId of master.subs) {
    patch[subId] = !!nextOn;
  }
  return patch;
}
