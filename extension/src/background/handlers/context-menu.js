/**
 * Context-menu integration.
 *
 * Registers two menu items on YouTube pages:
 *   • YTC_ADD_KEYWORD_FROM_SELECTION — visible when the user has highlighted
 *     text on a youtube.com page. Clicking appends the selection as a
 *     substring keyword rule.
 *   • YTC_ADD_CHANNEL_FROM_SELECTION — same, but adds to the channel list.
 *
 * (Phase 6 will add the per-tab pause entry using the same registration fn.)
 */

import { newRuleId } from '@/utils/rule-id';
import { createPauseMenuItem } from './tab-pause.js';

const MENU_KEYWORD = 'ytc-add-keyword-from-selection';
const MENU_CHANNEL = 'ytc-add-channel-from-selection';

/**
 * Append a new substring rule to a blocklist array key, preserving the
 * existing rules. Idempotent against exact duplicates (same text + mode +
 * caseSensitive).
 *
 * Exported for tests.
 */
export async function appendRule(listKey, text) {
  if (typeof text !== 'string' || text.trim().length === 0) return;
  const value = text.trim();

  const existing = await new Promise((resolve) =>
    chrome.storage.local.get(listKey, (r) => resolve(r?.[listKey] ?? [])),
  );
  if (!Array.isArray(existing)) return;

  const alreadyHave = existing.some(
    (r) =>
      typeof r?.text === 'string' &&
      r.text.toLowerCase() === value.toLowerCase() &&
      (r.mode ?? 'substring') === 'substring' &&
      !r.caseSensitive,
  );
  if (alreadyHave) return;

  const next = [
    ...existing,
    {
      id: newRuleId(),
      text: value,
      mode: 'substring',
      caseSensitive: false,
    },
  ];
  await new Promise((resolve) =>
    chrome.storage.local.set({ [listKey]: next }, () => resolve()),
  );
}

export function registerContextMenu() {
  chrome.runtime.onInstalled.addListener(() => {
    // Remove any previously-installed entries first so we don't duplicate
    // on extension updates.
    chrome.contextMenus.removeAll(() => {
      chrome.contextMenus.create({
        id: MENU_KEYWORD,
        title: 'youZen: Block "%s" as keyword',
        contexts: ['selection'],
        documentUrlPatterns: [
          'https://www.youtube.com/*',
          'https://youtube.com/*',
          'https://m.youtube.com/*',
        ],
      });
      chrome.contextMenus.create({
        id: MENU_CHANNEL,
        title: 'youZen: Block channel "%s"',
        contexts: ['selection'],
        documentUrlPatterns: [
          'https://www.youtube.com/*',
          'https://youtube.com/*',
          'https://m.youtube.com/*',
        ],
      });
      createPauseMenuItem();
    });
  });

  chrome.contextMenus.onClicked.addListener(async (info) => {
    if (!info?.selectionText) return;
    if (info.menuItemId === MENU_KEYWORD) {
      await appendRule('blocklistKeywords', info.selectionText);
    } else if (info.menuItemId === MENU_CHANNEL) {
      await appendRule('blocklistChannels', info.selectionText);
    }
  });
}

export const __testing = { MENU_KEYWORD, MENU_CHANNEL };
