import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * Reactive chrome.storage.local hook for *multiple* keys at once.
 *
 * Returns [state, setValue] where:
 *   • state      — Record<key, any> snapshot (undefined keys missing)
 *   • setValue   — (key, value) => void   writes back to storage
 *
 * Subscribes once to storage.onChanged and ignores unrelated keys.
 *
 * @param {string[]} keys
 * @returns {[Record<string, any>, (key: string, value: any) => void]}
 */
export function useStorageState(keys) {
  const [state, setState] = useState({});
  // Keep a stable reference to the keys list so the effect only re-runs
  // when the actual set of keys changes.
  const keysRef = useRef(keys);
  const keysSig = keys.join('|');

  useEffect(() => {
    keysRef.current = keys;
  }, [keysSig, keys]);

  // Initial load.
  useEffect(() => {
    try {
      chrome.storage.local.get(keys, (result) => {
        if (chrome.runtime.lastError) return;
        setState(result ?? {});
      });
    } catch {
      /* context invalidated */
    }
  }, [keysSig]); // eslint-disable-line react-hooks/exhaustive-deps

  // Subscribe to changes.
  useEffect(() => {
    const listener = (changes, area) => {
      if (area !== 'local') return;
      const relevant = keysRef.current;
      let hasUpdate = false;
      const patch = {};
      for (const k of relevant) {
        if (k in changes) {
          patch[k] = changes[k].newValue;
          hasUpdate = true;
        }
      }
      if (hasUpdate) {
        setState((prev) => ({ ...prev, ...patch }));
      }
    };
    try {
      chrome.storage.onChanged.addListener(listener);
      return () => {
        try {
          chrome.storage.onChanged.removeListener(listener);
        } catch {
          /* noop */
        }
      };
    } catch {
      return undefined;
    }
  }, []);

  const setValue = useCallback((key, value) => {
    setState((prev) => ({ ...prev, [key]: value }));
    try {
      chrome.storage.local.set({ [key]: value });
    } catch {
      /* context invalidated */
    }
  }, []);

  return [state, setValue];
}

/**
 * Convenience helper for writing many keys at once from a patch object.
 * Falls out of useStorageState: returns a function that accepts a patch.
 */
export function writePatch(patch) {
  try {
    chrome.storage.local.set(patch);
  } catch {
    /* noop */
  }
}
