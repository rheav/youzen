import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

/**
 * pause-state combines globallyPaused (storage.local) with the per-tab
 * tabPaused:<id> session flag. We re-import per test so the module
 * singleton starts fresh, otherwise listener state leaks.
 */
function makeChromeMock({ global = false, session = {} } = {}) {
  const localStore = { globallyPaused: !!global };
  const sessionStore = { ...session };
  const storageListeners = new Set();
  const messageListeners = new Set();

  return {
    storage: {
      local: {
        get: vi.fn((keys, cb) => {
          const out = {};
          const arr = Array.isArray(keys) ? keys : [keys];
          for (const k of arr) out[k] = localStore[k];
          cb(out);
        }),
        _set(patch) {
          const changes = {};
          for (const [k, v] of Object.entries(patch)) {
            changes[k] = { oldValue: localStore[k], newValue: v };
            localStore[k] = v;
          }
          for (const fn of storageListeners) fn(changes, 'local');
        },
      },
      session: {
        get: vi.fn((keys, cb) => {
          const out = {};
          const arr = Array.isArray(keys) ? keys : [keys];
          for (const k of arr) out[k] = sessionStore[k];
          cb(out);
        }),
        _set(patch) {
          const changes = {};
          for (const [k, v] of Object.entries(patch)) {
            changes[k] = { oldValue: sessionStore[k], newValue: v };
            sessionStore[k] = v;
          }
          for (const fn of storageListeners) fn(changes, 'session');
        },
      },
      onChanged: {
        addListener: (fn) => storageListeners.add(fn),
        removeListener: (fn) => storageListeners.delete(fn),
      },
    },
    runtime: {
      sendMessage: vi.fn((msg) => {
        if (msg?.type === 'YTC_WHO_AM_I') return Promise.resolve({ tabId: 42 });
        return Promise.resolve(undefined);
      }),
      onMessage: {
        addListener: (fn) => messageListeners.add(fn),
        removeListener: (fn) => messageListeners.delete(fn),
      },
      _send(msg) {
        for (const fn of messageListeners) fn(msg);
      },
    },
  };
}

async function loadModule() {
  vi.resetModules();
  return import('@/content/modules/pause-state.js');
}

describe('pause-state', () => {
  let dispose;

  beforeEach(() => {
    dispose = null;
  });

  afterEach(() => {
    dispose?.();
  });

  it('starts unpaused before initialization completes', async () => {
    const { isPaused } = await loadModule();
    expect(isPaused()).toBe(false);
  });

  it('reports paused when globallyPaused is true', async () => {
    const ch = makeChromeMock({ global: true });
    const mod = await loadModule();
    dispose = mod.initPauseState({ chrome: ch });
    expect(await mod.isPausedNow(ch)).toBe(true);
  });

  it('reports paused when the tab is in tabPaused session storage', async () => {
    const ch = makeChromeMock({ session: { 'tabPaused:42': true } });
    const mod = await loadModule();
    dispose = mod.initPauseState({ chrome: ch });
    expect(await mod.isPausedNow(ch)).toBe(true);
  });

  it('flips listeners when globallyPaused changes', async () => {
    const ch = makeChromeMock();
    const mod = await loadModule();
    dispose = mod.initPauseState({ chrome: ch });
    // Drain the boot refresh so the next change is the only flip we observe.
    await mod.isPausedNow(ch);

    const seen = [];
    mod.onPauseChange((p) => seen.push(p));

    ch.storage.local._set({ globallyPaused: true });
    // Allow the storage listener's async refresh to settle.
    await mod.isPausedNow(ch);
    expect(seen).toContain(true);

    ch.storage.local._set({ globallyPaused: false });
    await mod.isPausedNow(ch);
    expect(seen).toContain(false);
  });

  it('reacts to YTC_PAUSE_CHANGED runtime messages', async () => {
    const ch = makeChromeMock({ session: { 'tabPaused:42': true } });
    const mod = await loadModule();
    dispose = mod.initPauseState({ chrome: ch });
    await mod.isPausedNow(ch);
    expect(mod.isPaused()).toBe(true);

    // Background flips the per-tab flag and notifies us.
    ch.storage.session._set({ 'tabPaused:42': false });
    ch.runtime._send({ type: 'YTC_PAUSE_CHANGED' });
    await mod.isPausedNow(ch);
    expect(mod.isPaused()).toBe(false);
  });
});
