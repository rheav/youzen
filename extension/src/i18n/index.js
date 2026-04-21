/**
 * i18n system — vanilla JS translation loader
 *
 * Loads messages.json files from the extension's _locales directory and
 * provides a `t()` function for lookups with placeholder substitution.
 *
 * This works in ALL extension contexts (background, content scripts,
 * sidepanel) without depending on React.
 *
 * Usage:
 *   import { initTranslations, t } from '@/i18n';
 *   await initTranslations();
 *   const greeting = t('example_greeting', ['World']);
 */

import { log, warn } from '../utils/logger.js';

// ─── Module state ───────────────────────────────────────────────────────────

/** In-memory translation cache: { [messageKey]: messageObject } */
let _translations = {};

/** Current language code. */
let _currentLang = 'en';

/** Whether translations have been loaded. */
let _loaded = false;

// ─── Helpers ────────────────────────────────────────────────────────────────

/**
 * Checks whether the chrome.runtime context is still valid.
 * Returns false after the extension has been updated/reloaded.
 */
function isContextValid() {
  try {
    return !!chrome?.runtime?.id;
  } catch {
    return false;
  }
}

// ─── Public API ─────────────────────────────────────────────────────────────

/**
 * Returns the user's UI language.
 * Prefers chrome.i18n.getUILanguage(), falls back to navigator.language.
 *
 * @returns {string} BCP 47 language tag (e.g. 'en', 'es', 'fr').
 */
export function getUILanguage() {
  try {
    if (chrome?.i18n?.getUILanguage) {
      return chrome.i18n.getUILanguage();
    }
  } catch {
    // Context invalidated or not in extension environment
  }

  if (typeof navigator !== 'undefined' && navigator.language) {
    return navigator.language.split('-')[0];
  }

  return 'en';
}

/**
 * Initialises the translation system by fetching the appropriate
 * messages.json from _locales.
 *
 * @param {string} [lang] Language code to load. Defaults to the UI language.
 * @returns {Promise<void>}
 */
export async function initTranslations(lang) {
  const targetLang = lang || getUILanguage();

  // Avoid reloading the same language
  if (_loaded && _currentLang === targetLang) return;

  if (!isContextValid()) {
    warn('initTranslations: extension context invalid, using cached/empty translations');
    return;
  }

  try {
    // Try the requested language first, then fall back to 'en'
    const url = chrome.runtime.getURL(`_locales/${targetLang}/messages.json`);
    let response = await fetch(url);

    if (!response.ok && targetLang !== 'en') {
      log(`Locale "${targetLang}" not found, falling back to "en"`);
      const fallbackUrl = chrome.runtime.getURL('_locales/en/messages.json');
      response = await fetch(fallbackUrl);
    }

    if (response.ok) {
      _translations = await response.json();
      _currentLang = targetLang;
      _loaded = true;
      log('Translations loaded for:', _currentLang);
    } else {
      warn('Failed to load translations, status:', response.status);
    }
  } catch (err) {
    warn('initTranslations error:', err);
  }
}

/**
 * Returns the translated string for a given message key.
 *
 * Handles $PLACEHOLDER$ substitution — placeholders are replaced by the
 * corresponding entry in the substitutions array (positional, 1-based:
 * $1 maps to substitutions[0]).
 *
 * @param {string}   key             The message key from messages.json.
 * @param {string[]} [substitutions] Replacement values for placeholders.
 * @returns {string} The translated string, or the key itself as a fallback.
 */
export function t(key, substitutions = []) {
  const entry = _translations[key];

  if (!entry || !entry.message) {
    // Fallback: try chrome.i18n.getMessage if available
    try {
      if (chrome?.i18n?.getMessage) {
        const chromeMsg = chrome.i18n.getMessage(key, substitutions);
        if (chromeMsg) return chromeMsg;
      }
    } catch {
      // Context invalidated
    }
    return key;
  }

  let message = entry.message;

  // Replace $PLACEHOLDER$ patterns using the placeholders definition
  if (entry.placeholders && substitutions.length > 0) {
    for (const [name, config] of Object.entries(entry.placeholders)) {
      // config.content is typically "$1", "$2", etc.
      const index = parseInt(config.content?.replace('$', ''), 10);
      if (!isNaN(index) && index >= 1 && substitutions[index - 1] !== undefined) {
        const placeholder = new RegExp(`\\$${name}\\$`, 'gi');
        message = message.replace(placeholder, substitutions[index - 1]);
      }
    }
  }

  return message;
}

/**
 * Returns the current language code.
 * @returns {string}
 */
export function getCurrentLanguage() {
  return _currentLang;
}

/**
 * Returns whether translations have been loaded.
 * @returns {boolean}
 */
export function isLoaded() {
  return _loaded;
}
