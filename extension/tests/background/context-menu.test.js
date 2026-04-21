import { describe, it, expect, vi, beforeEach } from 'vitest';
import { appendRule } from '@/background/handlers/context-menu';

function setupChromeStorage(initial = {}) {
  let store = { ...initial };
  global.chrome = {
    runtime: { id: 'test', lastError: null },
    storage: {
      local: {
        get: vi.fn((keys, cb) => {
          if (keys === null || keys === undefined) return cb({ ...store });
          if (typeof keys === 'string') return cb({ [keys]: store[keys] });
          if (Array.isArray(keys)) {
            const out = {};
            for (const k of keys) out[k] = store[k];
            return cb(out);
          }
          cb({ ...store });
        }),
        set: vi.fn((items, cb) => {
          store = { ...store, ...items };
          cb?.();
        }),
      },
    },
  };
  return { get store() { return store; } };
}

beforeEach(() => {
  setupChromeStorage();
});

describe('appendRule', () => {
  it('creates a substring rule with a fresh id', async () => {
    await appendRule('blocklistKeywords', 'reaction');
    const patch = chrome.storage.local.set.mock.calls[0][0];
    expect(patch.blocklistKeywords).toHaveLength(1);
    const rule = patch.blocklistKeywords[0];
    expect(rule.text).toBe('reaction');
    expect(rule.mode).toBe('substring');
    expect(rule.caseSensitive).toBe(false);
    expect(rule.id).toMatch(/^r_/);
  });

  it('trims whitespace from the selection', async () => {
    await appendRule('blocklistKeywords', '   spaced  \n');
    const patch = chrome.storage.local.set.mock.calls[0][0];
    expect(patch.blocklistKeywords[0].text).toBe('spaced');
  });

  it('appends to an existing rule list', async () => {
    setupChromeStorage({
      blocklistKeywords: [{ id: 'a', text: 'reaction', mode: 'substring' }],
    });
    await appendRule('blocklistKeywords', 'unbox');
    const patch = chrome.storage.local.set.mock.calls[0][0];
    expect(patch.blocklistKeywords).toHaveLength(2);
    expect(patch.blocklistKeywords[1].text).toBe('unbox');
  });

  it('no-ops for empty selection', async () => {
    await appendRule('blocklistKeywords', '');
    await appendRule('blocklistKeywords', '   ');
    expect(chrome.storage.local.set).not.toHaveBeenCalled();
  });

  it('ignores exact-case-insensitive duplicates', async () => {
    setupChromeStorage({
      blocklistKeywords: [
        {
          id: 'a',
          text: 'reaction',
          mode: 'substring',
          caseSensitive: false,
        },
      ],
    });
    await appendRule('blocklistKeywords', 'Reaction');
    expect(chrome.storage.local.set).not.toHaveBeenCalled();
  });

  it('still adds a duplicate-text rule when the existing one is case-sensitive', async () => {
    setupChromeStorage({
      blocklistKeywords: [
        {
          id: 'a',
          text: 'reaction',
          mode: 'substring',
          caseSensitive: true,
        },
      ],
    });
    await appendRule('blocklistKeywords', 'reaction');
    expect(chrome.storage.local.set).toHaveBeenCalled();
  });

  it('works against the channel list too', async () => {
    await appendRule('blocklistChannels', 'RantChannel');
    const patch = chrome.storage.local.set.mock.calls[0][0];
    expect(patch.blocklistChannels[0].text).toBe('RantChannel');
  });

  it('ignores non-string inputs', async () => {
    await appendRule('blocklistKeywords', null);
    await appendRule('blocklistKeywords', undefined);
    await appendRule('blocklistKeywords', 42);
    expect(chrome.storage.local.set).not.toHaveBeenCalled();
  });
});
