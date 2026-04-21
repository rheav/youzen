/**
 * API configuration — base URLs and default settings
 *
 * The extension can operate against a local dev server or the production API.
 * Users toggle this via the `api_mode` key in chrome.storage.local (set from
 * the sidepanel settings UI).
 *
 * Usage:
 *   import { getApiUrl, API_CONFIG } from '@/config/apiConfig';
 *   const base = await getApiUrl();
 *   const res = await fetch(`${base}/endpoint`, { signal: AbortSignal.timeout(API_CONFIG.TIMEOUT) });
 */

export const API_CONFIG = {
  /** Production API base URL (no trailing slash). */
  BASE_URL: 'https://api.example.com',

  /** Local development server URL. */
  LOCAL_URL: 'http://localhost:3000',

  /** Default request timeout in milliseconds. */
  TIMEOUT: 10000,
};

/**
 * Returns the appropriate API base URL based on the user's preference
 * stored in chrome.storage.local under the `api_mode` key.
 *
 * - `"local"` → API_CONFIG.LOCAL_URL
 * - anything else (or missing) → API_CONFIG.BASE_URL
 *
 * @returns {Promise<string>} The resolved API base URL.
 */
export async function getApiUrl() {
  try {
    const data = await chrome.storage.local.get('api_mode');
    if (data.api_mode === 'local') {
      return API_CONFIG.LOCAL_URL;
    }
  } catch {
    // chrome.storage may be unavailable (e.g. context invalidated) — fall back
  }
  return API_CONFIG.BASE_URL;
}
