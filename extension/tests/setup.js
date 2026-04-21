import { vi } from 'vitest';

// Mock chrome APIs for testing
global.chrome = {
  runtime: {
    id: 'test-extension-id',
    lastError: null,
    onMessage: {
      addListener: vi.fn(),
      removeListener: vi.fn(),
    },
    sendMessage: vi.fn((msg, cb) => cb?.({})),
  },
  storage: {
    local: {
      get: vi.fn((keys, cb) => cb?.({})),
      set: vi.fn((_items, cb) => cb?.()),
      remove: vi.fn((_keys, cb) => cb?.()),
      getBytesInUse: vi.fn((_keys, cb) => cb?.(0)),
    },
    session: {
      get: vi.fn((keys, cb) => cb?.({})),
      set: vi.fn((_items, cb) => cb?.()),
    },
    onChanged: {
      addListener: vi.fn(),
      removeListener: vi.fn(),
    },
  },
  tabs: {
    query: vi.fn((_opts, cb) => cb?.([])),
    onActivated: {
      addListener: vi.fn(),
      removeListener: vi.fn(),
    },
    onUpdated: {
      addListener: vi.fn(),
      removeListener: vi.fn(),
    },
    onRemoved: {
      addListener: vi.fn(),
      removeListener: vi.fn(),
    },
  },
  sidePanel: {
    setPanelBehavior: vi.fn(),
  },
  scripting: {
    executeScript: vi.fn(),
  },
  i18n: {
    getUILanguage: vi.fn(() => 'en'),
  },
};
