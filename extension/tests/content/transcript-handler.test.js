import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { makeTranscriptHandler } from '../../src/content/transcript/index.js';

vi.mock('../../src/content/transcript/mount.jsx', () => ({
  mountPanel: vi.fn((host) => {
    const el = document.createElement('div');
    el.className = 'mounted-mock';
    host.append(el);
    return { unmount: vi.fn(() => el.remove()) };
  }),
}));

const WATCH_DOM = `
  <ytd-watch-flexy is-two-columns_>
    <div id="full-bleed-container">
      <div id="player-full-bleed-container">
        <div id="movie_player">
          <video></video>
          <div class="ytp-right-controls">
            <div class="ytp-right-controls-left">
              <button class="ytp-subtitles-button"></button>
            </div>
          </div>
        </div>
      </div>
      <div id="panels-full-bleed-container"></div>
    </div>
    <div id="columns">
      <div id="primary"><div id="primary-inner"><div id="player"></div><div id="below"></div></div></div>
      <div id="secondary"><div id="secondary-inner"></div></div>
    </div>
  </ytd-watch-flexy>
`;

function makeChrome(initial = {}) {
  let store = { ...initial };
  const listeners = new Set();
  return {
    get store() {
      return store;
    },
    setStore(patch) {
      const changes = {};
      for (const [k, v] of Object.entries(patch)) {
        changes[k] = { oldValue: store[k], newValue: v };
        store[k] = v;
      }
      for (const fn of listeners) fn(changes, 'local');
    },
    ch: {
      runtime: { sendMessage: vi.fn(async () => ({ tabId: 1 })), onMessage: { addListener: vi.fn(), removeListener: vi.fn() } },
      storage: {
        local: {
          get: vi.fn((keys, cb) => {
            if (Array.isArray(keys)) {
              const out = {};
              for (const k of keys) out[k] = store[k];
              return cb(out);
            }
            if (typeof keys === 'string') return cb({ [keys]: store[keys] });
            return cb({ ...store });
          }),
          set: vi.fn((items, cb) => {
            Object.assign(store, items);
            cb?.();
          }),
        },
        session: { get: vi.fn((_k, cb) => cb({})) },
        onChanged: {
          addListener: vi.fn((fn) => listeners.add(fn)),
          removeListener: vi.fn((fn) => listeners.delete(fn)),
        },
      },
    },
  };
}

describe('makeTranscriptHandler — fullscreen modes', () => {
  let cleanup;
  beforeEach(() => {
    document.body.innerHTML = WATCH_DOM;
    sessionStorage.clear();
  });
  afterEach(() => {
    cleanup?.();
    cleanup = null;
  });

  it('keeps panel visible in fullscreen and live-switches between split, floating, and off', async () => {
    const env = makeChrome({ transcriptPanel: true, transcriptFullscreenMode: 'split' });
    const handler = makeTranscriptHandler(env.ch, { doc: document, win: window });
    cleanup = handler.onEnter();

    await vi.waitFor(() => expect(document.querySelector('.yz-transcript-button')).not.toBeNull());

    // Open the panel via the player button while in fullscreen.
    const flexy = document.querySelector('ytd-watch-flexy');
    flexy.setAttribute('fullscreen', '');
    document.dispatchEvent(new Event('fullscreenchange'));

    document.querySelector('.yz-transcript-button').click();
    const host = document.getElementById('yz-transcript');
    expect(host).not.toBeNull();
    expect(host.hidden).toBe(false);
    expect(host.style.flex).toBe('0 0 400px');
    expect(host.hasAttribute('data-yz-floating')).toBe(false);

    // Switch live to floating mode in storage -> frosted glass attribute + absolute positioning.
    env.setStore({ transcriptFullscreenMode: 'floating' });
    await vi.waitFor(() => expect(host.hasAttribute('data-yz-floating')).toBe(true));
    expect(host.style.position).toBe('absolute');
    expect(host.hidden).toBe(false);

    // Switch live to off -> hides in fullscreen.
    env.setStore({ transcriptFullscreenMode: 'off' });
    await vi.waitFor(() => expect(host.hidden).toBe(true));
  });
});
