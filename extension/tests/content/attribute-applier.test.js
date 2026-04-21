import { describe, it, expect, vi, beforeEach } from 'vitest';
import { applyAttributesWith } from '@/content/modules/attribute-applier';
import { FEATURES } from '@/config/features';
import { computeDefaults } from '@/background/handlers/storage';

function makeDocument() {
  const attrs = new Map();
  const html = {
    setAttribute: vi.fn((k, v) => attrs.set(k, v)),
    removeAttribute: vi.fn((k) => attrs.delete(k)),
    hasAttribute: vi.fn((k) => attrs.has(k)),
    getAttribute: vi.fn((k) => attrs.get(k) ?? null),
    get attrs() {
      return attrs;
    },
  };
  return { documentElement: html };
}

function makeChrome({ local = {}, session = {} } = {}) {
  return {
    storage: {
      local: {
        get: vi.fn((_keys, cb) => cb(local)),
      },
      session: {
        get: vi.fn((key, cb) => {
          if (key === null) return cb(session);
          if (typeof key === 'string') {
            return cb({ [key]: session[key] });
          }
          cb(session);
        }),
      },
    },
  };
}

describe('applyAttributesWith — defaults', () => {
  let doc, ch;
  beforeEach(() => {
    doc = makeDocument();
    ch = makeChrome({ local: computeDefaults() });
  });

  it('sets data-ytc-* attributes for every default-on CSS feature', async () => {
    await applyAttributesWith({ chrome: ch, document: doc, tabId: 1 });
    const html = doc.documentElement;
    const onByDefault = FEATURES.filter(
      (f) => !f.isMaster && f.default === true,
    );
    for (const f of onByDefault) {
      expect(html.attrs.has(f.attr), `${f.attr} should be set`).toBe(true);
    }
  });

  it('does NOT set attributes for default-off features', async () => {
    await applyAttributesWith({ chrome: ch, document: doc, tabId: 1 });
    const html = doc.documentElement;
    const offByDefault = FEATURES.filter(
      (f) => !f.isMaster && f.default === false,
    );
    for (const f of offByDefault) {
      expect(html.attrs.has(f.attr), `${f.attr} should NOT be set`).toBe(false);
    }
  });

  it('does NOT set data-ytc-paused when nothing is paused', async () => {
    await applyAttributesWith({ chrome: ch, document: doc, tabId: 1 });
    expect(doc.documentElement.attrs.has('data-ytc-paused')).toBe(false);
  });
});

describe('applyAttributesWith — select extras', () => {
  it('writes data-ytc-*-mode for select-kind extras', async () => {
    const doc = makeDocument();
    const local = { ...computeDefaults(), hideHomeFeed: true };
    const ch = makeChrome({ local });
    await applyAttributesWith({ chrome: ch, document: doc, tabId: 1 });
    expect(doc.documentElement.attrs.get('data-ytc-home-feed')).toBe('');
    expect(doc.documentElement.attrs.get('data-ytc-home-feed-mode')).toBe(
      'quickLinks',
    );
  });

  it('honors a custom select value from storage', async () => {
    const doc = makeDocument();
    const local = {
      ...computeDefaults(),
      hideHomeFeed: true,
      hideHomeFeedMode: 'redirect',
    };
    const ch = makeChrome({ local });
    await applyAttributesWith({ chrome: ch, document: doc, tabId: 1 });
    expect(doc.documentElement.attrs.get('data-ytc-home-feed-mode')).toBe(
      'redirect',
    );
  });
});

describe('applyAttributesWith — global pause', () => {
  it('clears all feature attributes + sets data-ytc-paused', async () => {
    const doc = makeDocument();
    // Seed the DOM with some existing attributes to prove they get cleared.
    doc.documentElement.setAttribute('data-ytc-home-shorts', '');
    doc.documentElement.setAttribute('data-ytc-end-cards', '');

    const local = { ...computeDefaults(), globallyPaused: true };
    const ch = makeChrome({ local });
    await applyAttributesWith({ chrome: ch, document: doc, tabId: 1 });

    expect(doc.documentElement.attrs.has('data-ytc-paused')).toBe(true);
    expect(doc.documentElement.attrs.has('data-ytc-home-shorts')).toBe(false);
    expect(doc.documentElement.attrs.has('data-ytc-end-cards')).toBe(false);
  });
});

describe('applyAttributesWith — per-tab pause', () => {
  it('clears attributes when this tab is paused in session storage', async () => {
    const doc = makeDocument();
    const local = computeDefaults();
    const session = { 'tabPaused:42': true };
    const ch = makeChrome({ local, session });

    await applyAttributesWith({ chrome: ch, document: doc, tabId: 42 });

    expect(doc.documentElement.attrs.has('data-ytc-paused')).toBe(true);
    // Default-on feature should not be set.
    expect(doc.documentElement.attrs.has('data-ytc-home-shorts')).toBe(false);
  });

  it('ignores session pause for a different tab', async () => {
    const doc = makeDocument();
    const local = computeDefaults();
    const session = { 'tabPaused:99': true };
    const ch = makeChrome({ local, session });

    await applyAttributesWith({ chrome: ch, document: doc, tabId: 42 });

    expect(doc.documentElement.attrs.has('data-ytc-paused')).toBe(false);
    // Default-on feature should be set.
    expect(doc.documentElement.attrs.has('data-ytc-home-shorts')).toBe(true);
  });

  it('handles missing tabId gracefully (skips session lookup)', async () => {
    const doc = makeDocument();
    const local = computeDefaults();
    const ch = makeChrome({ local });

    await applyAttributesWith({ chrome: ch, document: doc, tabId: null });

    expect(doc.documentElement.attrs.has('data-ytc-paused')).toBe(false);
    expect(ch.storage.session.get).not.toHaveBeenCalled();
  });
});

describe('applyAttributesWith — storage flips', () => {
  it('removes an attribute when a feature flips from true → false', async () => {
    const doc = makeDocument();
    const chOn = makeChrome({ local: { ...computeDefaults(), hideComments: true } });
    await applyAttributesWith({ chrome: chOn, document: doc, tabId: 1 });
    expect(doc.documentElement.attrs.has('data-ytc-comments')).toBe(true);

    const chOff = makeChrome({ local: { ...computeDefaults(), hideComments: false } });
    await applyAttributesWith({ chrome: chOff, document: doc, tabId: 1 });
    expect(doc.documentElement.attrs.has('data-ytc-comments')).toBe(false);
  });
});
