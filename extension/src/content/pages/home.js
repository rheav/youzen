/**
 * Home page handler.
 *
 * Three behaviors depending on `hideHomeFeedMode`:
 *   • 'empty'       — CSS alone hides the feed (see youtube.css). JS no-op.
 *   • 'quickLinks'  — inject a "Quick links" card listing Subscriptions,
 *                     History, Playlists, Watch Later.
 *   • 'redirect'    — navigate to /feed/subscriptions.
 *
 * Only runs when `hideHomeFeed === true`. The attribute-applier has already
 * set html[data-ytc-home-feed] + the mode attr by the time we run.
 */

import { isPausedNow, onPauseChange } from '../modules/pause-state.js';

const CARD_ID = 'ytc-home-quicklinks';

const QUICK_LINKS = [
  { label: 'Subscriptions', href: '/feed/subscriptions' },
  { label: 'History', href: '/feed/history' },
  { label: 'Playlists', href: '/feed/playlists' },
  { label: 'Watch Later', href: '/playlist?list=WL' },
];

/**
 * Build the DOM for the quick-links card. Exported for tests.
 *
 * @param {Document} doc
 * @returns {HTMLElement}
 */
export function buildQuickLinksCard(doc) {
  const card = doc.createElement('div');
  card.id = CARD_ID;
  card.setAttribute('role', 'navigation');
  card.setAttribute('aria-label', 'youZen quick links');
  // Inline style so we ship no extra stylesheet and so host CSS can't
  // easily suppress us.
  card.style.cssText = [
    'max-width: 640px',
    'margin: 64px auto',
    'padding: 24px',
    'border-radius: 16px',
    'background: rgba(250,249,245,0.72)',
    'backdrop-filter: blur(12px)',
    '-webkit-backdrop-filter: blur(12px)',
    'border: 1px solid rgba(232,230,220,0.8)',
    'box-shadow: 0 0 0 1px rgba(127,168,127,0.14), 0 4px 24px rgba(127,168,127,0.14)',
    'font-family: "Outfit Variable", "Outfit", system-ui, sans-serif',
    'color: #141413',
  ].join(';');

  const heading = doc.createElement('div');
  heading.textContent = 'Where to?';
  heading.style.cssText = [
    'font-family: "Caveat Variable", "Caveat", "Outfit Variable", system-ui, sans-serif',
    'font-size: 32px',
    'font-weight: 400',
    'letter-spacing: 0',
    'margin-bottom: 16px',
    'line-height: 1',
    'background: linear-gradient(135deg,#7fa87f 0%,#c6d8a9 100%)',
    '-webkit-background-clip: text',
    'background-clip: text',
    '-webkit-text-fill-color: transparent',
  ].join(';');
  card.appendChild(heading);

  const list = doc.createElement('div');
  list.style.cssText = 'display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px';

  for (const link of QUICK_LINKS) {
    const a = doc.createElement('a');
    a.href = link.href;
    a.textContent = link.label;
    a.style.cssText = [
      'display: block',
      'padding: 14px 16px',
      'border-radius: 12px',
      'background: rgba(250,249,245,0.6)',
      'border: 1px solid rgba(232,230,220,0.9)',
      'text-decoration: none',
      'color: inherit',
      'font-weight: 500',
      'font-size: 14px',
      'transition: background 0.15s, border-color 0.15s',
    ].join(';');
    a.addEventListener('mouseenter', () => {
      a.style.background = 'rgba(250,249,245,0.95)';
      a.style.borderColor = 'rgba(127,168,127,0.5)';
    });
    a.addEventListener('mouseleave', () => {
      a.style.background = 'rgba(250,249,245,0.6)';
      a.style.borderColor = 'rgba(232,230,220,0.9)';
    });
    list.appendChild(a);
  }
  card.appendChild(list);

  return card;
}

/**
 * Insert or remove the card based on the current mode.
 * Idempotent: calling it repeatedly is safe.
 *
 * @param {Document} doc
 * @param {{enabled: boolean, mode: string}} state
 */
export function reconcileHomeDom(doc, { enabled, mode }) {
  const existing = doc.getElementById(CARD_ID);

  if (!enabled || mode !== 'quickLinks') {
    if (existing) existing.remove();
    return;
  }

  if (existing) return; // already mounted

  const mountPoint =
    doc.querySelector('ytd-browse[page-subtype="home"] #primary') ||
    doc.querySelector('ytd-browse[page-subtype="home"]') ||
    doc.body;

  if (!mountPoint) return; // DOM not ready yet

  const card = buildQuickLinksCard(doc);
  mountPoint.prepend(card);
}

/**
 * Page-router handler for the home page.
 * @param {typeof chrome} ch
 */
export function makeHomeHandler(ch = chrome) {
  let observer = null;

  const maybeReconcile = async () => {
    // While paused, neuter all JS side-effects and strip the quick-links
    // card if we previously mounted it.
    if (await isPausedNow(ch)) {
      const existing = document.getElementById(CARD_ID);
      existing?.remove();
      return;
    }

    const { hideHomeFeed, hideHomeFeedMode } = await new Promise((resolve) =>
      ch.storage.local.get(['hideHomeFeed', 'hideHomeFeedMode'], (r) => resolve(r ?? {})),
    );

    if (hideHomeFeed && hideHomeFeedMode === 'redirect') {
      // Redirect mode: leave the home page entirely.
      location.replace('/feed/subscriptions');
      return;
    }

    reconcileHomeDom(document, {
      enabled: !!hideHomeFeed,
      mode: hideHomeFeedMode ?? 'quickLinks',
    });
  };

  return {
    id: 'home',
    test: (url) => url.pathname === '/' || url.pathname === '/feed/trending',
    onEnter: () => {
      // Re-run on every storage change so toggling in the sidepanel
      // updates the page live.
      const onStorageChange = (changes, area) => {
        if (area !== 'local') return;
        if ('hideHomeFeed' in changes || 'hideHomeFeedMode' in changes) {
          void maybeReconcile();
        }
      };
      ch.storage.onChanged.addListener(onStorageChange);

      // React to pause flipping mid-session so the quick-links card
      // appears/disappears without a page reload.
      const disposePauseListener = onPauseChange(() => {
        void maybeReconcile();
      });

      // YouTube hydrates home lazily. Watch for ytd-browse to appear, then
      // reconcile once.
      observer = new MutationObserver(() => {
        if (document.querySelector('ytd-browse[page-subtype="home"]')) {
          observer?.disconnect();
          observer = null;
          void maybeReconcile();
        }
      });
      observer.observe(document.documentElement, {
        childList: true,
        subtree: true,
      });

      // First-run attempt in case home is already rendered.
      void maybeReconcile();

      return function cleanup() {
        observer?.disconnect();
        observer = null;
        ch.storage.onChanged.removeListener(onStorageChange);
        disposePauseListener();
        const existing = document.getElementById(CARD_ID);
        existing?.remove();
      };
    },
  };
}

export const __testing = { CARD_ID, QUICK_LINKS };
