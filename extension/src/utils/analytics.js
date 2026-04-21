/**
 * Analytics utility — GA4 Measurement Protocol client for Chrome extensions
 *
 * All functions are complete no-ops when the __ENABLE_ANALYTICS__ compile-time
 * flag (injected by Vite) is false, ensuring zero runtime cost in
 * non-analytics builds.
 *
 * Session management uses chrome.storage.session (30-minute window).
 * Client ID is persisted in chrome.storage.local.
 *
 * Usage:
 *   import { trackEvent, trackError } from '@/utils/analytics';
 *   trackEvent(EVENTS.TAB_SWITCHED, { tab: 'network' });
 *   trackError('background', new Error('fetch failed'));
 */

import { ANALYTICS_CONFIG } from '../config/analyticsConfig.js';
import { log, warn } from './logger.js';

// ─── GA4 Measurement Protocol endpoint ──────────────────────────────────────

const GA4_ENDPOINT = 'https://www.google-analytics.com/mp/collect';

// ─── Module state ───────────────────────────────────────────────────────────

let _initPromise = null;
let _clientId = null;
let _sessionId = null;

// Session timeout: 30 minutes
const SESSION_TIMEOUT_MS = 30 * 60 * 1000;

// ─── Helpers ────────────────────────────────────────────────────────────────

/**
 * Generates a simple UUID v4-like string for client identification.
 */
function generateId() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Returns true when the compile-time analytics flag is enabled.
 */
function isEnabled() {
  return typeof __ENABLE_ANALYTICS__ !== 'undefined' && __ENABLE_ANALYTICS__;
}

// ─── Session management ─────────────────────────────────────────────────────

/**
 * Retrieves or creates a session ID.
 * Sessions are stored in chrome.storage.session and expire after 30 minutes
 * of inactivity.
 */
async function getOrCreateSession() {
  try {
    const data = await chrome.storage.session.get(['analytics_session', 'analytics_session_ts']);
    const now = Date.now();

    if (
      data.analytics_session &&
      data.analytics_session_ts &&
      now - data.analytics_session_ts < SESSION_TIMEOUT_MS
    ) {
      // Refresh the timestamp on each event to implement sliding window
      await chrome.storage.session.set({ analytics_session_ts: now });
      return data.analytics_session;
    }

    // Create new session
    const sessionId = generateId();
    await chrome.storage.session.set({
      analytics_session: sessionId,
      analytics_session_ts: now,
    });
    return sessionId;
  } catch {
    // chrome.storage.session unavailable (e.g. content script) — use in-memory
    if (!_sessionId) _sessionId = generateId();
    return _sessionId;
  }
}

// ─── Initialisation ─────────────────────────────────────────────────────────

/**
 * Initialises analytics by creating or retrieving a persistent client ID
 * from chrome.storage.local.
 *
 * @returns {Promise<string>} The client ID.
 */
export function init() {
  if (!isEnabled()) return Promise.resolve(null);

  if (_initPromise) return _initPromise;

  _initPromise = (async () => {
    try {
      const data = await chrome.storage.local.get('analytics_client_id');

      if (data.analytics_client_id) {
        _clientId = data.analytics_client_id;
      } else {
        _clientId = generateId();
        await chrome.storage.local.set({ analytics_client_id: _clientId });
      }

      log('Analytics initialised, client:', _clientId);
      return _clientId;
    } catch (err) {
      warn('Analytics init failed:', err);
      _clientId = generateId(); // Fallback to in-memory ID
      return _clientId;
    }
  })();

  return _initPromise;
}

// ─── Event tracking ─────────────────────────────────────────────────────────

/**
 * Sends an event to GA4 via the Measurement Protocol.
 *
 * Complete no-op when __ENABLE_ANALYTICS__ is false.
 *
 * @param {string} name   Event name (use EVENTS constants).
 * @param {Object} [params={}] Event parameters.
 * @returns {Promise<void>}
 */
export async function trackEvent(name, params = {}) {
  if (!isEnabled()) return;

  // Ensure initialisation is complete
  if (!_initPromise) init();
  await _initPromise;

  const sessionId = await getOrCreateSession();

  const url = new URL(GA4_ENDPOINT);
  url.searchParams.set('measurement_id', ANALYTICS_CONFIG.MEASUREMENT_ID);
  url.searchParams.set('api_secret', ANALYTICS_CONFIG.API_SECRET);

  const body = {
    client_id: _clientId,
    events: [
      {
        name,
        params: {
          session_id: sessionId,
          engagement_time_msec: '100',
          ...params,
        },
      },
    ],
  };

  try {
    await fetch(url.toString(), {
      method: 'POST',
      body: JSON.stringify(body),
    });
    log('Analytics event sent:', name, params);
  } catch (err) {
    warn('Analytics trackEvent failed:', err);
  }
}

/**
 * Convenience wrapper for tracking errors.
 *
 * @param {string} context Where the error occurred (e.g. 'background', 'sidepanel').
 * @param {Error|string}  error   The error object or message.
 * @returns {Promise<void>}
 */
export async function trackError(context, error) {
  return trackEvent('error_occurred', {
    error_context: context,
    error_message: error instanceof Error ? error.message : String(error),
  });
}
