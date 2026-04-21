import { describe, it, expect, vi, beforeEach } from 'vitest';
import { FEATURES } from '@/config/features';
import {
  computeDefaults,
  seedDefaults,
  resetToDefaults,
  SCHEMA_VERSION,
} from '@/background/handlers/storage';

// Stateful in-memory chrome.storage.local replacement.
function makeStatefulStorage(initial = {}) {
  let store = { ...initial };
  return {
    get store() {
      return store;
    },
    get: vi.fn((keys, cb) => {
      if (keys === null || keys === undefined) return cb({ ...store });
      if (typeof keys === 'string') return cb({ [keys]: store[keys] });
      if (Array.isArray(keys)) {
        const out = {};
        for (const k of keys) out[k] = store[k];
        return cb(out);
      }
      return cb({ ...store });
    }),
    set: vi.fn((items, cb) => {
      store = { ...store, ...items };
      cb?.();
    }),
    clear: vi.fn((cb) => {
      store = {};
      cb?.();
    }),
    remove: vi.fn((keys, cb) => {
      const k = Array.isArray(keys) ? keys : [keys];
      for (const key of k) delete store[key];
      cb?.();
    }),
  };
}

beforeEach(() => {
  const local = makeStatefulStorage();
  global.chrome = {
    storage: {
      local,
      session: makeStatefulStorage(),
      onChanged: { addListener: vi.fn(), removeListener: vi.fn() },
    },
    runtime: { id: 'test', lastError: null },
  };
});

describe('computeDefaults', () => {
  it('has schemaVersion matching the current SCHEMA_VERSION', () => {
    const d = computeDefaults();
    expect(d.schemaVersion).toBe(SCHEMA_VERSION);
  });

  it('has every non-master feature as a top-level boolean key', () => {
    const d = computeDefaults();
    for (const f of FEATURES.filter((e) => !e.isMaster)) {
      expect(d).toHaveProperty(f.id);
      expect(typeof d[f.id]).toBe('boolean');
      expect(d[f.id]).toBe(f.default);
    }
  });

  it('includes extra select keys with their defaults', () => {
    const d = computeDefaults();
    expect(d.hideHomeFeedMode).toBe('quickLinks');
  });

  it('includes the app-state skeleton keys', () => {
    const d = computeDefaults();
    expect(d.blocklistKeywords).toEqual([]);
    expect(d.blocklistChannels).toEqual([]);
    expect(d.globallyPaused).toBe(false);
    expect(d.appTheme).toBe('auto');
    expect(d.language).toBe(null);
    expect(d.compactMode).toBe(false);
    expect(d.flags).toEqual({ welcomeDismissed: false });
    expect(d.analytics).toEqual({ enabled: false });
  });
});

describe('seedDefaults — fresh install', () => {
  it('writes the full defaults into empty storage', async () => {
    await seedDefaults();
    const stored = chrome.storage.local.store;
    const defaults = computeDefaults();
    for (const [k, v] of Object.entries(defaults)) {
      expect(stored).toHaveProperty(k);
      expect(stored[k]).toEqual(v);
    }
  });
});

describe('seedDefaults — non-destructive top-up', () => {
  it('preserves existing user values', async () => {
    // Simulate a user who had hideHomeFeed: true before we shipped a new feature.
    chrome.storage.local.store.hideHomeFeed = true;
    chrome.storage.local.store.blocklistKeywords = [
      { id: 'r1', text: 'test', mode: 'substring' },
    ];
    await seedDefaults();
    expect(chrome.storage.local.store.hideHomeFeed).toBe(true);
    expect(chrome.storage.local.store.blocklistKeywords).toHaveLength(1);
  });

  it('adds missing new keys without touching existing ones', async () => {
    // Simulate a partial prior state (a hypothetical v0.1 storage snapshot).
    Object.assign(chrome.storage.local.store, {
      hideHomeShorts: false, // user previously disabled
      schemaVersion: 1,
    });
    await seedDefaults();
    // User's explicit choice preserved:
    expect(chrome.storage.local.store.hideHomeShorts).toBe(false);
    // Key the user didn't have yet gets populated:
    expect(chrome.storage.local.store.hideComments).toBe(false);
    expect(chrome.storage.local.store.blocklistKeywords).toEqual([]);
  });
});

describe('resetToDefaults', () => {
  it('clears existing storage and re-seeds defaults', async () => {
    chrome.storage.local.store.hideHomeFeed = true;
    chrome.storage.local.store.blocklistKeywords = [{ id: 'stale' }];
    chrome.storage.local.store.somethingExtra = 'x';
    await resetToDefaults();
    const stored = chrome.storage.local.store;
    expect(stored.hideHomeFeed).toBe(false);
    expect(stored.blocklistKeywords).toEqual([]);
    expect(stored).not.toHaveProperty('somethingExtra');
    expect(stored.schemaVersion).toBe(SCHEMA_VERSION);
  });
});
