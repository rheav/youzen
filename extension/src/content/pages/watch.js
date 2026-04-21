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

const EXPANDER_SELECTOR = 'ytd-watch-metadata ytd-text-inline-expander';

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
    expander.querySelector('#collapse') ||
    expander.querySelector('tp-yt-paper-button#collapse');
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

  const maybeCollapse = async () => {
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

      // Wait for the description expander to hydrate.
      observer = new MutationObserver(() => {
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

      void maybeCollapse();

      return function cleanup() {
        observer?.disconnect();
        observer = null;
        ch.storage.onChanged.removeListener(onStorageChange);
      };
    },
  };
}
