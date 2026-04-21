import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  isTabPaused,
  setTabPaused,
  updateMenuTitle,
  createPauseMenuItem,
  registerTabPause,
  __testing,
} from '@/background/handlers/tab-pause';

const { MENU_ID, SESSION_PREFIX, PAUSE_LABEL, RESUME_LABEL } = __testing;

function makeChrome({ session = {} } = {}) {
  const listeners = {
    menuClick: [],
    tabActivated: [],
    tabRemoved: [],
  };
  return {
    __state: { session },
    __listeners: listeners,
    runtime: { lastError: null },
    contextMenus: {
      create: vi.fn(),
      update: vi.fn((_id, _opts, cb) => cb?.()),
      onClicked: {
        addListener: vi.fn((fn) => listeners.menuClick.push(fn)),
      },
    },
    tabs: {
      sendMessage: vi.fn((_id, _msg) => Promise.resolve()),
      onActivated: {
        addListener: vi.fn((fn) => listeners.tabActivated.push(fn)),
      },
      onRemoved: {
        addListener: vi.fn((fn) => listeners.tabRemoved.push(fn)),
      },
    },
    storage: {
      session: {
        get: vi.fn((key, cb) => {
          if (typeof key === 'string') return cb({ [key]: session[key] });
          cb({ ...session });
        }),
        set: vi.fn((items, cb) => {
          Object.assign(session, items);
          cb?.();
        }),
        remove: vi.fn((key, cb) => {
          if (Array.isArray(key)) {
            for (const k of key) delete session[k];
          } else {
            delete session[key];
          }
          cb?.();
        }),
      },
    },
  };
}

beforeEach(() => {
  global.chrome = makeChrome();
});

describe('tab-pause state', () => {
  it('isTabPaused returns false when no session entry exists', async () => {
    expect(await isTabPaused(42)).toBe(false);
  });

  it('isTabPaused returns true when the session entry is truthy', async () => {
    global.chrome = makeChrome({ session: { [`${SESSION_PREFIX}7`]: true } });
    expect(await isTabPaused(7)).toBe(true);
  });

  it('setTabPaused(id, true) writes the session flag', async () => {
    await setTabPaused(99, true);
    expect(chrome.storage.session.set).toHaveBeenCalledWith(
      { [`${SESSION_PREFIX}99`]: true },
      expect.any(Function),
    );
  });

  it('setTabPaused(id, false) removes the session flag', async () => {
    global.chrome = makeChrome({ session: { [`${SESSION_PREFIX}3`]: true } });
    await setTabPaused(3, false);
    expect(chrome.storage.session.remove).toHaveBeenCalledWith(
      `${SESSION_PREFIX}3`,
      expect.any(Function),
    );
    expect(await isTabPaused(3)).toBe(false);
  });
});

describe('updateMenuTitle', () => {
  it('uses the Pause label when the tab is not paused', async () => {
    await updateMenuTitle(5);
    expect(chrome.contextMenus.update).toHaveBeenCalledWith(
      MENU_ID,
      { title: PAUSE_LABEL },
      expect.any(Function),
    );
  });

  it('uses the Resume label when the tab is paused', async () => {
    global.chrome = makeChrome({ session: { [`${SESSION_PREFIX}5`]: true } });
    await updateMenuTitle(5);
    expect(chrome.contextMenus.update).toHaveBeenCalledWith(
      MENU_ID,
      { title: RESUME_LABEL },
      expect.any(Function),
    );
  });

  it('swallows chrome.runtime.lastError when the menu item is missing', async () => {
    chrome.runtime.lastError = { message: 'No menu item with id' };
    chrome.contextMenus.update.mockImplementationOnce((_id, _opts, cb) => cb?.());
    await expect(updateMenuTitle(5)).resolves.toBeUndefined();
  });
});

describe('createPauseMenuItem', () => {
  it('creates a single page-context menu item scoped to YouTube URLs', () => {
    createPauseMenuItem();
    expect(chrome.contextMenus.create).toHaveBeenCalledTimes(1);
    const [config] = chrome.contextMenus.create.mock.calls[0];
    expect(config.id).toBe(MENU_ID);
    expect(config.title).toBe(PAUSE_LABEL);
    expect(config.contexts).toEqual(['page']);
    expect(config.documentUrlPatterns.some((p) => p.includes('youtube.com'))).toBe(true);
  });
});

describe('registerTabPause — lifecycle', () => {
  it('registers listeners for clicks, activation, and removal', () => {
    registerTabPause();
    expect(chrome.contextMenus.onClicked.addListener).toHaveBeenCalledTimes(1);
    expect(chrome.tabs.onActivated.addListener).toHaveBeenCalledTimes(1);
    expect(chrome.tabs.onRemoved.addListener).toHaveBeenCalledTimes(1);
  });

  it('click → pauses, broadcasts YTC_PAUSE_CHANGED, updates title', async () => {
    registerTabPause();
    const onClick = chrome.__listeners.menuClick[0];
    await onClick({ menuItemId: MENU_ID }, { id: 11 });
    expect(await isTabPaused(11)).toBe(true);
    expect(chrome.tabs.sendMessage).toHaveBeenCalledWith(11, {
      type: 'YTC_PAUSE_CHANGED',
    });
    expect(chrome.contextMenus.update).toHaveBeenLastCalledWith(
      MENU_ID,
      { title: RESUME_LABEL },
      expect.any(Function),
    );
  });

  it('second click → resumes, broadcasts again, updates title back to Pause', async () => {
    global.chrome = makeChrome({ session: { [`${SESSION_PREFIX}11`]: true } });
    registerTabPause();
    const onClick = chrome.__listeners.menuClick[0];
    await onClick({ menuItemId: MENU_ID }, { id: 11 });
    expect(await isTabPaused(11)).toBe(false);
    expect(chrome.contextMenus.update).toHaveBeenLastCalledWith(
      MENU_ID,
      { title: PAUSE_LABEL },
      expect.any(Function),
    );
  });

  it('ignores clicks on other menu ids', async () => {
    registerTabPause();
    const onClick = chrome.__listeners.menuClick[0];
    await onClick({ menuItemId: 'some-other-id' }, { id: 11 });
    expect(chrome.storage.session.set).not.toHaveBeenCalled();
    expect(chrome.tabs.sendMessage).not.toHaveBeenCalled();
  });

  it('ignores clicks that have no tab id (e.g. popup contexts)', async () => {
    registerTabPause();
    const onClick = chrome.__listeners.menuClick[0];
    await onClick({ menuItemId: MENU_ID }, undefined);
    expect(chrome.storage.session.set).not.toHaveBeenCalled();
  });

  it('swallows sendMessage errors (content script not injected)', async () => {
    chrome.tabs.sendMessage.mockRejectedValueOnce(
      new Error('Receiving end does not exist'),
    );
    registerTabPause();
    const onClick = chrome.__listeners.menuClick[0];
    await expect(
      onClick({ menuItemId: MENU_ID }, { id: 11 }),
    ).resolves.toBeUndefined();
    expect(await isTabPaused(11)).toBe(true);
  });

  it('onActivated → updates the menu title for the newly active tab', async () => {
    global.chrome = makeChrome({ session: { [`${SESSION_PREFIX}22`]: true } });
    registerTabPause();
    const onActivated = chrome.__listeners.tabActivated[0];
    await onActivated({ tabId: 22 });
    expect(chrome.contextMenus.update).toHaveBeenLastCalledWith(
      MENU_ID,
      { title: RESUME_LABEL },
      expect.any(Function),
    );
  });

  it('onRemoved → clears the session flag for the closed tab', async () => {
    global.chrome = makeChrome({ session: { [`${SESSION_PREFIX}33`]: true } });
    registerTabPause();
    const onRemoved = chrome.__listeners.tabRemoved[0];
    await onRemoved(33);
    expect(chrome.storage.session.remove).toHaveBeenCalledWith(
      `${SESSION_PREFIX}33`,
      expect.any(Function),
    );
    expect(await isTabPaused(33)).toBe(false);
  });
});

describe('tab-pause — full lifecycle (install → click → click → close)', () => {
  it('walks through the canonical flow without leaking state', async () => {
    registerTabPause();
    const onClick = chrome.__listeners.menuClick[0];
    const onRemoved = chrome.__listeners.tabRemoved[0];
    const TAB = 404;

    // First click → pause.
    await onClick({ menuItemId: MENU_ID }, { id: TAB });
    expect(await isTabPaused(TAB)).toBe(true);

    // Second click → resume.
    await onClick({ menuItemId: MENU_ID }, { id: TAB });
    expect(await isTabPaused(TAB)).toBe(false);

    // Pause again, then close tab → state cleared.
    await onClick({ menuItemId: MENU_ID }, { id: TAB });
    expect(await isTabPaused(TAB)).toBe(true);
    await onRemoved(TAB);
    expect(await isTabPaused(TAB)).toBe(false);
  });
});
