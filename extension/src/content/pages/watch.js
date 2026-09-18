/**
 * Watch page handler.
 *
 * Current responsibility: collapse the video description on first paint
 * when `hideDescription` is enabled. The CSS half (data-ytc-collapse-desc
 * rule in youtube.css) clamps the non-expanded state; this JS half clicks
 * the collapse button if YouTube mounted the description already expanded.
 *
 * Runs whenever the user enters a /watch page. Uses a MutationObserver to
 * wait for the description expander to render (YouTube hydrates the watch
 * page in stages).
 */

import { isPausedNow, onPauseChange } from '../modules/pause-state.js';
import { nudgePlayerResize } from '../modules/attribute-applier.js';

const EXPANDER_SELECTOR = 'ytd-watch-metadata ytd-text-inline-expander';

/** Layout attributes that make youtube.css hand the player extra width. */
const LAYOUT_ATTRS = ['data-ytc-related', 'data-ytc-live-chat'];

/**
 * Watch ytd-watch-flexy's `theater` attribute and re-measure the player when
 * it flips.
 *
 * Entering or leaving theater mode makes YouTube size the player from its own
 * numbers, which still count the sidebar / chat column we removed. The CSS
 * reclaim lands after that measurement, so without a nudge the video keeps the
 * narrow width until the next real window resize.
 *
 * @param {Document} doc
 * @returns {() => void} disposer
 */
export function observeTheaterToggle(doc = document) {
  const flexy = doc.querySelector('ytd-watch-flexy');
  if (!flexy) return () => {};

  const observer = new MutationObserver(() => {
    const html = doc.documentElement;
    if (LAYOUT_ATTRS.some((attr) => html?.hasAttribute(attr))) nudgePlayerResize();
  });
  observer.observe(flexy, { attributes: true, attributeFilter: ['theater'] });

  return () => observer.disconnect();
}

/**
 * Clicks the collapse button if the expander is currently expanded.
 * Returns true if it actually collapsed something.
 *
 * @param {Document} doc
 * @returns {boolean}
 */
export function collapseDescriptionIfExpanded(doc) {
  const expander = doc.querySelector(EXPANDER_SELECTOR);
  if (!expander) return false;
  if (!expander.hasAttribute('is-expanded')) return false;

  // Preferred: click the #collapse button YouTube provides.
  const collapseBtn =
    expander.querySelector('#collapse') || expander.querySelector('tp-yt-paper-button#collapse');
  if (collapseBtn && typeof collapseBtn.click === 'function') {
    collapseBtn.click();
    return true;
  }

  // Fallback: toggle the is-expanded attribute directly.
  expander.removeAttribute('is-expanded');
  return true;
}

/**
 * Page-router handler for /watch.
 * @param {typeof chrome} ch
 */
export function makeWatchHandler(ch = chrome) {
  let observer = null;
  let disposeTheaterObserver = null;

  const maybeCollapse = async () => {
    if (await isPausedNow(ch)) return;
    const { hideDescription } = await new Promise((resolve) =>
      ch.storage.local.get('hideDescription', (r) => resolve(r ?? {})),
    );
    if (!hideDescription) return;
    collapseDescriptionIfExpanded(document);
  };

  return {
    id: 'watch',
    test: (url) => url.pathname === '/watch',
    onEnter: () => {
      // React to the user flipping the toggle mid-watch.
      const onStorageChange = (changes, area) => {
        if (area !== 'local') return;
        if ('hideDescription' in changes) void maybeCollapse();
      };
      ch.storage.onChanged.addListener(onStorageChange);

      // React to pause flipping so unpausing mid-watch can re-collapse
      // the description if the feature is enabled.
      const disposePauseListener = onPauseChange(() => {
        void maybeCollapse();
      });

      // Wait for the description expander and ytd-watch-flexy to hydrate.
      // Both land in the same pass; once we have them the observer is done.
      observer = new MutationObserver(() => {
        if (!disposeTheaterObserver && document.querySelector('ytd-watch-flexy')) {
          disposeTheaterObserver = observeTheaterToggle(document);
        }
        if (document.querySelector(EXPANDER_SELECTOR)) {
          observer?.disconnect();
          observer = null;
          void maybeCollapse();
        }
      });
      observer.observe(document.documentElement, {
        childList: true,
        subtree: true,
      });

      if (document.querySelector('ytd-watch-flexy')) {
        disposeTheaterObserver = observeTheaterToggle(document);
      }
      void maybeCollapse();

      return function cleanup() {
        observer?.disconnect();
        observer = null;
        disposeTheaterObserver?.();
        disposeTheaterObserver = null;
        ch.storage.onChanged.removeListener(onStorageChange);
        disposePauseListener();
      };
    },
  };
}
