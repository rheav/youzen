/**
 * useTranslation — React hook for the i18n system
 *
 * Wraps the vanilla i18n module in a React-friendly hook that manages
 * loading state, language switching, and automatic re-renders when the
 * preferred language changes (even from another extension context).
 *
 * Usage:
 *   import { useTranslation } from '@/i18n/useTranslation';
 *
 *   function MyComponent() {
 *     const { t, language, setLanguage, isLoaded, LANGUAGES } = useTranslation();
 *     if (!isLoaded) return <p>Loading...</p>;
 *     return <h1>{t('extension_name')}</h1>;
 *   }
 */

import { useState, useEffect, useCallback } from 'react';
import {
  initTranslations,
  t as translate,
  getCurrentLanguage,
  isLoaded as checkLoaded,
} from './index.js';

// ─── Supported languages ────────────────────────────────────────────────────
// Extend this list as you add new _locales/<code>/messages.json files.

export const LANGUAGES = [{ code: 'en', name: 'English' }];

// ─── Storage key ────────────────────────────────────────────────────────────

const STORAGE_KEY = 'preferredLanguage';

// ─── Hook ───────────────────────────────────────────────────────────────────

/**
 * React hook providing translation utilities.
 *
 * @returns {{
 *   t: (key: string, substitutions?: string[]) => string,
 *   language: string,
 *   setLanguage: (code: string) => Promise<void>,
 *   isLoaded: boolean,
 *   LANGUAGES: Array<{ code: string, name: string }>,
 * }}
 */
export function useTranslation() {
  const [language, setLang] = useState(getCurrentLanguage());
  const [loaded, setLoaded] = useState(checkLoaded());

  // Load translations on mount (and when language changes)
  useEffect(() => {
    let cancelled = false;

    async function load() {
      // Check if user has a stored preference
      try {
        const data = await chrome.storage.local.get(STORAGE_KEY);
        const preferred = data[STORAGE_KEY] || language;
        await initTranslations(preferred);
        if (!cancelled) {
          setLang(getCurrentLanguage());
          setLoaded(true);
        }
      } catch {
        // Fallback: load default language
        await initTranslations();
        if (!cancelled) {
          setLang(getCurrentLanguage());
          setLoaded(true);
        }
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Listen for language changes from other contexts (e.g. settings page)
  useEffect(() => {
    let listener;

    try {
      listener = (changes, areaName) => {
        if (areaName !== 'local') return;
        if (changes[STORAGE_KEY]?.newValue) {
          const newLang = changes[STORAGE_KEY].newValue;
          initTranslations(newLang).then(() => {
            setLang(getCurrentLanguage());
            setLoaded(true);
          });
        }
      };

      chrome.storage.onChanged.addListener(listener);
    } catch {
      // Context invalidated — no listener needed
    }

    return () => {
      if (listener) {
        try {
          chrome.storage.onChanged.removeListener(listener);
        } catch {
          // Context may already be invalidated
        }
      }
    };
  }, []);

  /**
   * Changes the active language and persists the preference.
   *
   * @param {string} code Language code (e.g. 'en', 'es').
   */
  const setLanguage = useCallback(async (code) => {
    try {
      await chrome.storage.local.set({ [STORAGE_KEY]: code });
    } catch {
      // Context invalidated — still update locally
    }

    await initTranslations(code);
    setLang(getCurrentLanguage());
    setLoaded(true);
  }, []);

  return {
    t: translate,
    language,
    setLanguage,
    isLoaded: loaded,
    LANGUAGES,
  };
}
