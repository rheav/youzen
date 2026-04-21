/**
 * blocklist-filter — scans YouTube video cards and marks matches with
 * `data-ytc-blocked`. The CSS rule `[data-ytc-blocked]{display:none}` in
 * youtube.css hides them.
 *
 * Two rule lists, each evaluated independently:
 *   • blocklistKeywords — match against the card's title text
 *   • blocklistChannels — match against the card's channel name / handle
 *
 * The scanner is idempotent and cheap: it only considers cards without an
 * existing `data-ytc-blocked` attribute. A MutationObserver wakes the
 * scanner when YouTube mounts new cards (infinite scroll, SPA nav).
 */

import { compileRules, evaluateText } from '@/utils/blocklist-matcher';

/**
 * Broad CSS selector for "a card representing a single video or shelf item".
 * Covers homepage grids, subscriptions grids, search results, and the
 * watch-page related sidebar.
 *
 * Keep this list conservative — anything too broad risks hiding UI chrome.
 */
const CARD_SELECTORS = [
  'ytd-rich-item-renderer',
  'ytd-video-renderer',
  'ytd-compact-video-renderer',
  'ytd-grid-video-renderer',
  'ytd-playlist-video-renderer',
  'ytd-rich-grid-media',
].join(',');

const BLOCKED_ATTR = 'data-ytc-blocked';
const SEEN_ATTR = 'data-ytc-scanned';

/**
 * Extract the title text from a card element.
 *
 * @param {Element} el
 * @returns {string}
 */
export function extractTitle(el) {
  // Try the most-specific selectors first.
  const candidates = [
    '#video-title',
    'a#video-title-link',
    'yt-formatted-string#video-title',
    '.title',
  ];
  for (const sel of candidates) {
    const node = el.querySelector(sel);
    if (node) {
      const text =
        node.getAttribute('title') ||
        node.textContent ||
        node.getAttribute('aria-label') ||
        '';
      if (text.trim()) return text.trim();
    }
  }
  return '';
}

/**
 * Extract the channel name from a card element.
 *
 * @param {Element} el
 * @returns {string}
 */
export function extractChannel(el) {
  const candidates = [
    'ytd-channel-name #text',
    'ytd-channel-name a',
    'a.yt-simple-endpoint.ytd-channel-name',
    '#channel-name a',
    '#byline a',
    '.ytd-channel-name',
  ];
  for (const sel of candidates) {
    const node = el.querySelector(sel);
    if (node) {
      const text = node.textContent || node.getAttribute('aria-label') || '';
      if (text.trim()) return text.trim();
    }
  }
  return '';
}

/**
 * Scan a root node, evaluate each card, and set/remove `data-ytc-blocked`.
 *
 * Pure with respect to the DOM only: no chrome.* calls.
 *
 * @param {ParentNode} root
 * @param {{keyword: ReturnType<typeof compileRules>, channel: ReturnType<typeof compileRules>}} matchers
 * @returns {{ scanned: number, blocked: number }}
 */
export function scanRoot(root, matchers) {
  if (!root || typeof root.querySelectorAll !== 'function') {
    return { scanned: 0, blocked: 0 };
  }
  const cards = root.querySelectorAll(CARD_SELECTORS);
  let blocked = 0;

  for (const card of cards) {
    card.setAttribute(SEEN_ATTR, '');
    const title = extractTitle(card);
    const channel = extractChannel(card);

    const matchesKeyword = evaluateText(title, matchers.keyword);
    const matchesChannel = evaluateText(channel, matchers.channel);

    if (matchesKeyword || matchesChannel) {
      card.setAttribute(BLOCKED_ATTR, '');
      blocked += 1;
    } else if (card.hasAttribute(BLOCKED_ATTR)) {
      // Rules changed and this card no longer matches — unhide it.
      card.removeAttribute(BLOCKED_ATTR);
    }
  }

  return { scanned: cards.length, blocked };
}

/**
 * Re-scan every already-seen card. Called after the user edits their
 * rules in the sidepanel and storage.onChanged fires.
 */
export function rescanAll(root, matchers) {
  // Clearing the SEEN_ATTR forces a full pass, including already-seen cards
  // that may need un-hiding if a rule was removed.
  for (const card of root.querySelectorAll(`[${SEEN_ATTR}]`)) {
    card.removeAttribute(SEEN_ATTR);
  }
  return scanRoot(root, matchers);
}

/**
 * Wire up a live filter that observes DOM mutations + storage changes.
 *
 * @param {Object} opts
 * @param {typeof chrome} opts.chrome
 * @param {Document}      opts.document
 * @returns {() => void}   Disposer that tears down all listeners.
 */
export function initBlocklistFilter({
  chrome: ch = chrome,
  document: doc = document,
} = {}) {
  let matchers = { keyword: [], channel: [] };
  let scheduled = false;

  function scheduleScan() {
    if (scheduled) return;
    scheduled = true;
    // Batch multiple mutations into one scan per microtask.
    queueMicrotask(() => {
      scheduled = false;
      scanRoot(doc, matchers);
    });
  }

  async function reloadRules() {
    const { blocklistKeywords, blocklistChannels } = await new Promise(
      (resolve) =>
        ch.storage.local.get(
          ['blocklistKeywords', 'blocklistChannels'],
          (r) => resolve(r ?? {}),
        ),
    );
    matchers = {
      keyword: compileRules(blocklistKeywords ?? []),
      channel: compileRules(blocklistChannels ?? []),
    };
    rescanAll(doc, matchers);
  }

  const onStorageChange = (changes, area) => {
    if (area !== 'local') return;
    if ('blocklistKeywords' in changes || 'blocklistChannels' in changes) {
      void reloadRules();
    }
  };
  ch.storage.onChanged.addListener(onStorageChange);

  const observer = new MutationObserver(() => scheduleScan());
  observer.observe(doc.documentElement, { childList: true, subtree: true });

  // Initial load + first scan.
  void reloadRules();

  return function dispose() {
    observer.disconnect();
    ch.storage.onChanged.removeListener(onStorageChange);
  };
}
