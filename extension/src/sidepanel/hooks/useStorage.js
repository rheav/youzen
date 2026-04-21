import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * Reactive chrome.storage hook with cross-context sync.
 * Returns [value, setValue] like useState, but persisted.
 *
 * @param {string} key - Storage key
 * @param {*} defaultValue - Default value if key doesn't exist
 * @returns {[any, Function]}
 *
 * @example
 * const [apiMode, setApiMode] = useStorage('api_mode', 'cloud');
 */
export function useStorage(key, defaultValue) {
  const [value, setValueState] = useState(defaultValue);
  const keyRef = useRef(key);
  keyRef.current = key;

  // Load initial value
  useEffect(() => {
    try {
      chrome.storage.local.get(key, (result) => {
        if (chrome.runtime.lastError) return;
        if (result[key] !== undefined) {
          setValueState(result[key]);
        }
      });
    } catch {
      // Extension context invalidated
    }
  }, [key]);

  // Listen for changes from other contexts
  useEffect(() => {
    const handler = (changes, area) => {
      if (area !== 'local') return;
      if (changes[keyRef.current]) {
        const newVal = changes[keyRef.current].newValue;
        setValueState(newVal !== undefined ? newVal : defaultValue);
      }
    };

    try {
      chrome.storage.onChanged.addListener(handler);
      return () => {
        try {
          chrome.storage.onChanged.removeListener(handler);
        } catch {}
      };
    } catch {
      return undefined;
    }
  }, [defaultValue]);

  // Setter that writes to storage
  const setValue = useCallback(
    (newValue) => {
      const resolved = typeof newValue === 'function' ? newValue(value) : newValue;
      setValueState(resolved);
      try {
        chrome.storage.local.set({ [keyRef.current]: resolved });
      } catch {
        // Extension context invalidated
      }
    },
    [value],
  );

  return [value, setValue];
}
