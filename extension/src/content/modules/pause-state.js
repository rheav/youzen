/**
 * pause-state — single source of truth for "is youZen paused on this tab?"
 *
 * Combines two signals:
 *   • chrome.storage.local.globallyPaused      — global kill-switch
 *   • chrome.storage.session[`tabPaused:<id>`] — per-tab pause
 *
 * CSS-backed features are handled by attribute-applier.js directly. All
 * JS-driven features (redirects, quick-links card, description collapse,
 * blocklist scanning) consult this module before acting, and subscribe
 * to `onPauseChange` to react when the user flips pause mid-session.
 *
 * The module is a singleton within the content script: `initPauseState()`
 * is idempotent, and `isPausedNow()` always returns a freshly-computed
 * value so callers never race against boot-time initialization.
 */

const PREFIX = 'tabPaused:';

let currentPaused = false;
let cachedTabId = null;
let initialized = false;
const listeners = new Set();

function notify() {
  for (const fn of listeners) {
    try {
      fn(currentPaused);
    } catch {
      /* one bad listener must not kill the others */
    }
  }
}

async function resolveTabId(ch) {
  if (cachedTabId !== null) return cachedTabId;
  try {
    const reply = await ch.runtime.sendMessage({ type: 'YTC_WHO_AM_I' });
    if (reply && typeof reply.tabId === 'number') cachedTabId = reply.tabId;
  } catch {
    // Service worker asleep / context invalidated — retry next call.
  }
  return cachedTabId;
}

async function computePaused(ch) {
  let globalPaused = false;
  try {
    globalPaused = await new Promise((resolve) =>
      ch.storage.local.get('globallyPaused', (r) => resolve(!!r?.globallyPaused)),
    );
  } catch {
    /* storage unavailable — treat as not paused */
  }

  let sessionPaused = false;
  const id = await resolveTabId(ch);
  if (id !== null && id !== undefined) {
    const key = `${PREFIX}${id}`;
    try {
      sessionPaused = await new Promise((resolve) =>
        ch.storage.session.get(key, (r) => resolve(!!r?.[key])),
      );
    } catch {
      /* same */
    }
  }

  return globalPaused || sessionPaused;
}

async function refresh(ch) {
  const next = await computePaused(ch);
  if (next !== currentPaused) {
    currentPaused = next;
    notify();
  }
  return currentPaused;
}

/**
 * Synchronously returns the last-known pause state. May be stale during
 * the very first few ms before `initPauseState` resolves; callers that
 * care should use `isPausedNow()` instead.
 */
export function isPaused() {
  return currentPaused;
}

/**
 * Freshly recomputes pause state from storage and returns it. Use this
 * at decision points in async handlers (redirects, DOM mutations) so
 * the answer is never stale.
 *
 * @param {typeof chrome} [ch=chrome]
 * @returns {Promise<boolean>}
 */
export async function isPausedNow(ch = chrome) {
  return refresh(ch);
}

/**
 * Subscribe to pause-state changes. Listener fires with the new boolean
 * whenever the derived state flips. Returns a disposer.
 *
 * @param {(paused: boolean) => void} fn
 * @returns {() => void}
 */
export function onPauseChange(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

/**
 * Wire the module to Chrome runtime. Idempotent.
 *
 * @param {Object} [opts]
 * @param {typeof chrome} [opts.chrome]
 * @returns {() => void}   Disposer (tests only).
 */
export function initPauseState({ chrome: ch = chrome } = {}) {
  if (initialized) return () => {};
  initialized = true;

  // Fire an async boot refresh so isPaused() stabilises quickly.
  void refresh(ch);

  const onStorageChange = (changes, area) => {
    if (area === 'local' && 'globallyPaused' in changes) {
      void refresh(ch);
      return;
    }
    if (area === 'session') {
      for (const k of Object.keys(changes)) {
        if (k.startsWith(PREFIX)) {
          void refresh(ch);
          return;
        }
      }
    }
  };

  const onMessage = (msg) => {
    if (msg?.type === 'YTC_PAUSE_CHANGED') void refresh(ch);
  };

  ch.storage.onChanged.addListener(onStorageChange);
  ch.runtime.onMessage.addListener(onMessage);

  return function dispose() {
    try {
      ch.storage.onChanged.removeListener(onStorageChange);
      ch.runtime.onMessage.removeListener(onMessage);
    } catch {
      /* context already gone */
    }
    initialized = false;
    listeners.clear();
    currentPaused = false;
    cachedTabId = null;
  };
}

export const __testing = { PREFIX };
