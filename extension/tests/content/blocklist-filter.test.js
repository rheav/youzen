import { describe, it, expect, beforeEach } from 'vitest';
import {
  extractTitle,
  extractChannel,
  scanRoot,
  rescanAll,
} from '@/content/modules/blocklist-filter';
import { compileRules } from '@/utils/blocklist-matcher';

function makeCard({ tag = 'ytd-rich-item-renderer', title = '', channel = '' } = {}) {
  const card = document.createElement(tag);
  if (title) {
    const t = document.createElement('a');
    t.id = 'video-title';
    t.setAttribute('title', title);
    t.textContent = title;
    card.appendChild(t);
  }
  if (channel) {
    const cn = document.createElement('ytd-channel-name');
    const inner = document.createElement('div');
    inner.id = 'text';
    inner.textContent = channel;
    cn.appendChild(inner);
    card.appendChild(cn);
  }
  return card;
}

beforeEach(() => {
  document.body.innerHTML = '';
});

describe('extractTitle', () => {
  it('reads the #video-title attribute/text', () => {
    const card = makeCard({ title: 'Top 10 reaction video' });
    expect(extractTitle(card)).toBe('Top 10 reaction video');
  });

  it('returns empty string if no title node is present', () => {
    const card = document.createElement('ytd-rich-item-renderer');
    expect(extractTitle(card)).toBe('');
  });
});

describe('extractChannel', () => {
  it('reads ytd-channel-name #text', () => {
    const card = makeCard({ title: 't', channel: 'MrChannel' });
    expect(extractChannel(card)).toBe('MrChannel');
  });

  it('returns empty string if no channel name is present', () => {
    const card = document.createElement('ytd-rich-item-renderer');
    expect(extractChannel(card)).toBe('');
  });
});

describe('scanRoot', () => {
  function setup(rules) {
    return {
      keyword: compileRules(rules.keyword ?? []),
      channel: compileRules(rules.channel ?? []),
    };
  }

  it('marks cards whose title matches a keyword rule', () => {
    const a = makeCard({ title: 'My unboxing video', channel: 'A' });
    const b = makeCard({ title: 'Cat videos', channel: 'B' });
    document.body.append(a, b);

    const matchers = setup({ keyword: [{ id: '1', text: 'unbox' }] });
    const result = scanRoot(document, matchers);

    expect(result.scanned).toBe(2);
    expect(result.blocked).toBe(1);
    expect(a.hasAttribute('data-ytc-blocked')).toBe(true);
    expect(b.hasAttribute('data-ytc-blocked')).toBe(false);
  });

  it('marks cards whose channel matches a channel rule', () => {
    const a = makeCard({ title: 'safe', channel: 'RantChannel' });
    const b = makeCard({ title: 'safe', channel: 'Nature' });
    document.body.append(a, b);

    const matchers = setup({ channel: [{ id: '1', text: 'Rant' }] });
    const result = scanRoot(document, matchers);

    expect(result.blocked).toBe(1);
    expect(a.hasAttribute('data-ytc-blocked')).toBe(true);
    expect(b.hasAttribute('data-ytc-blocked')).toBe(false);
  });

  it('unhides a card when rules no longer match it', () => {
    const a = makeCard({ title: 'unboxing', channel: 'X' });
    document.body.appendChild(a);
    a.setAttribute('data-ytc-blocked', '');

    const matchers = setup({ keyword: [{ id: '1', text: 'reaction' }] });
    scanRoot(document, matchers);

    expect(a.hasAttribute('data-ytc-blocked')).toBe(false);
  });

  it('returns { scanned: 0, blocked: 0 } for null/invalid root', () => {
    expect(scanRoot(null, { keyword: [], channel: [] })).toEqual({
      scanned: 0,
      blocked: 0,
    });
  });

  it('leaves cards alone when both rule lists are empty', () => {
    const a = makeCard({ title: 'unboxing', channel: 'X' });
    document.body.appendChild(a);
    scanRoot(document, { keyword: [], channel: [] });
    expect(a.hasAttribute('data-ytc-blocked')).toBe(false);
  });

  it('handles a keyword rule using wholeWord mode', () => {
    const a = makeCard({ title: 'category of things', channel: 'A' });
    const b = makeCard({ title: 'big cat energy', channel: 'B' });
    document.body.append(a, b);

    const matchers = setup({
      keyword: [{ id: '1', text: 'cat', mode: 'wholeWord' }],
    });
    scanRoot(document, matchers);

    expect(a.hasAttribute('data-ytc-blocked')).toBe(false);
    expect(b.hasAttribute('data-ytc-blocked')).toBe(true);
  });

  it('matches cards of all supported element tags', () => {
    const tags = [
      'ytd-rich-item-renderer',
      'ytd-video-renderer',
      'ytd-compact-video-renderer',
      'ytd-grid-video-renderer',
      'ytd-playlist-video-renderer',
      'ytd-rich-grid-media',
    ];
    for (const tag of tags) {
      document.body.appendChild(makeCard({ tag, title: 'unbox' }));
    }
    const matchers = setup({ keyword: [{ id: '1', text: 'unbox' }] });
    const result = scanRoot(document, matchers);
    expect(result.scanned).toBe(tags.length);
    expect(result.blocked).toBe(tags.length);
  });
});

describe('rescanAll', () => {
  it('clears the scanned marker so changed rules re-evaluate', () => {
    const a = makeCard({ title: 'unbox', channel: 'A' });
    document.body.appendChild(a);

    // First pass: block it.
    const hit = {
      keyword: compileRules([{ id: '1', text: 'unbox' }]),
      channel: [],
    };
    scanRoot(document, hit);
    expect(a.hasAttribute('data-ytc-blocked')).toBe(true);

    // User removes the rule — rescanAll should unblock.
    rescanAll(document, { keyword: [], channel: [] });
    expect(a.hasAttribute('data-ytc-blocked')).toBe(false);
  });
});
