/**
 * page-router — watches YouTube's SPA URL for changes and routes to the
 * right per-page handler.
 *
 * YouTube's client navigates via history.pushState + a custom
 * 'yt-navigate-finish' event. We listen for the broadest signals so we
 * never miss a transition:
 *
 *   • popstate              — browser Back / Forward
 *   • yt-navigate-finish    — YouTube's own post-navigation event
 *   • pushState / replaceState wrapping — covers any lib-internal change
 *
 * A registered handler looks like:
 *   {
 *     test:     (url: URL) => boolean,
 *     onEnter?: (url: URL) => void | () => void,
 *     onLeave?: (url: URL) => void,
 *   }
 *
 * onEnter may return a cleanup function; the router calls it as onLeave
 * automatically. If both onLeave and the returned cleanup are present,
 * both fire in that order (onLeave first, then the cleanup).
 *
 * Handlers are given a cloned URL so mutating .search / .hash inside
 * onEnter does NOT affect the router's bookkeeping.
 */

/**
 * @typedef {Object} PageHandler
 * @property {string} id
 * @property {(url: URL) => boolean} test
 * @property {(url: URL) => (void | (() => void))} [onEnter]
 * @property {(url: URL) => void} [onLeave]
 */

/**
 * Create a router instance. Call `.start()` to begin listening, `.stop()`
 * to dispose.
 *
 * Exposed as a factory (not a singleton) so tests can create and tear
 * down fresh instances.
 *
 * @param {PageHandler[]} handlers
 * @returns {{
 *   start: () => void,
 *   stop: () => void,
 *   forceEvaluate: () => void,
 *   currentUrl: () => URL,
 * }}
 */
export function createPageRouter(handlers) {
  /** @type {Map<string, () => void>} Active cleanups from onEnter returns. */
  const activeCleanups = new Map();
  /** @type {Set<string>} Handler ids currently considered "entered". */
  const active = new Set();

  let currentUrl = new URL(location.href);
  let started = false;
  let origPushState, origReplaceState;

  function evaluate() {
    const url = new URL(location.href);
    currentUrl = url;

    for (const handler of handlers) {
      let matches = false;
      try {
        matches = !!handler.test(url);
      } catch {
        // Broken test → treat as not-matching; never crash the router.
        matches = false;
      }

      const wasActive = active.has(handler.id);

      if (matches && !wasActive) {
        active.add(handler.id);
        try {
          const cleanup = handler.onEnter?.(cloneUrl(url));
          if (typeof cleanup === 'function') {
            activeCleanups.set(handler.id, cleanup);
          }
        } catch {
          // Handler crashed on enter — drop from active so the next visit
          // will retry. Don't cache a busted cleanup.
          active.delete(handler.id);
        }
      } else if (!matches && wasActive) {
        active.delete(handler.id);
        const cleanup = activeCleanups.get(handler.id);
        activeCleanups.delete(handler.id);
        try {
          handler.onLeave?.(cloneUrl(url));
        } catch {
          /* swallow — never let one handler kill others */
        }
        try {
          cleanup?.();
        } catch {
          /* same */
        }
      }
    }
  }

  const onUrlChange = () => evaluate();

  function start() {
    if (started) return;
    started = true;

    // Wrap history methods once so any SPA navigation is observable.
    origPushState = history.pushState;
    origReplaceState = history.replaceState;
    history.pushState = function (...args) {
      const r = origPushState.apply(this, args);
      window.dispatchEvent(new Event('ytc:locationchange'));
      return r;
    };
    history.replaceState = function (...args) {
      const r = origReplaceState.apply(this, args);
      window.dispatchEvent(new Event('ytc:locationchange'));
      return r;
    };

    window.addEventListener('popstate', onUrlChange);
    window.addEventListener('ytc:locationchange', onUrlChange);
    window.addEventListener('yt-navigate-finish', onUrlChange);

    // Evaluate once on boot.
    evaluate();
  }

  function stop() {
    if (!started) return;
    started = false;

    window.removeEventListener('popstate', onUrlChange);
    window.removeEventListener('ytc:locationchange', onUrlChange);
    window.removeEventListener('yt-navigate-finish', onUrlChange);

    if (origPushState) history.pushState = origPushState;
    if (origReplaceState) history.replaceState = origReplaceState;

    // Fire onLeave + cleanup for anything still active so state is clean.
    for (const handler of handlers) {
      if (!active.has(handler.id)) continue;
      active.delete(handler.id);
      const cleanup = activeCleanups.get(handler.id);
      activeCleanups.delete(handler.id);
      try {
        handler.onLeave?.(cloneUrl(currentUrl));
      } catch { /* noop */ }
      try {
        cleanup?.();
      } catch { /* noop */ }
    }
  }

  return {
    start,
    stop,
    forceEvaluate: evaluate,
    currentUrl: () => cloneUrl(currentUrl),
  };
}

function cloneUrl(u) {
  return new URL(u.toString());
}
