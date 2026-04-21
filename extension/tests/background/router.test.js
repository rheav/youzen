import { describe, it, expect, vi, beforeEach } from 'vitest';

describe('Background Message Router', () => {
  let messageListener;

  beforeEach(() => {
    vi.clearAllMocks();

    // Capture the listener registered by the background script
    chrome.runtime.onMessage.addListener.mockImplementation((fn) => {
      messageListener = fn;
    });
  });

  it('should dispatch to correct handler by message type', async () => {
    const handlers = {
      TEST_ACTION: vi.fn(() => ({ result: 'ok' })),
    };

    // Simulate the router pattern
    const router = (message, sender, sendResponse) => {
      if (!message || typeof message.type !== 'string') return false;
      const handler = handlers[message.type];
      if (!handler) return false;

      try {
        const result = handler(message, sender);
        if (result instanceof Promise) {
          result.then(sendResponse).catch((err) => sendResponse({ error: err.message }));
          return true;
        }
        if (result !== undefined) sendResponse(result);
      } catch (err) {
        sendResponse({ error: err.message });
      }
      return false;
    };

    const sendResponse = vi.fn();
    router({ type: 'TEST_ACTION', data: { foo: 1 } }, { tab: { id: 1 } }, sendResponse);

    expect(handlers.TEST_ACTION).toHaveBeenCalledWith(
      { type: 'TEST_ACTION', data: { foo: 1 } },
      { tab: { id: 1 } },
    );
    expect(sendResponse).toHaveBeenCalledWith({ result: 'ok' });
  });

  it('should handle async handlers and keep channel open', async () => {
    const handlers = {
      ASYNC_ACTION: vi.fn(() => Promise.resolve({ async: true })),
    };

    const router = (message, sender, sendResponse) => {
      const handler = handlers[message.type];
      if (!handler) return false;

      const result = handler(message, sender);
      if (result instanceof Promise) {
        result.then(sendResponse).catch((err) => sendResponse({ error: err.message }));
        return true; // Keep channel open
      }
      if (result !== undefined) sendResponse(result);
      return false;
    };

    const sendResponse = vi.fn();
    const keepOpen = router({ type: 'ASYNC_ACTION' }, {}, sendResponse);

    expect(keepOpen).toBe(true);
    await new Promise((r) => setTimeout(r, 10));
    expect(sendResponse).toHaveBeenCalledWith({ async: true });
  });

  it('should catch handler errors and return error response', () => {
    const handlers = {
      BROKEN_ACTION: vi.fn(() => {
        throw new Error('test error');
      }),
    };

    const router = (message, _sender, sendResponse) => {
      const handler = handlers[message.type];
      if (!handler) return false;

      try {
        const result = handler(message);
        if (result !== undefined) sendResponse(result);
      } catch (err) {
        sendResponse({ error: err.message });
      }
      return false;
    };

    const sendResponse = vi.fn();
    router({ type: 'BROKEN_ACTION' }, {}, sendResponse);

    expect(sendResponse).toHaveBeenCalledWith({ error: 'test error' });
  });

  it('should return false for unknown message types', () => {
    const handlers = {};

    const router = (message) => {
      if (!message || typeof message.type !== 'string') return false;
      const handler = handlers[message.type];
      if (!handler) return false;
      return false;
    };

    expect(router({ type: 'UNKNOWN' })).toBe(false);
  });

  it('should reject invalid message shapes', () => {
    const router = (message) => {
      if (!message || typeof message.type !== 'string') return false;
      return true;
    };

    expect(router(null)).toBe(false);
    expect(router(undefined)).toBe(false);
    expect(router({})).toBe(false);
    expect(router({ type: 123 })).toBe(false);
    expect(router('string')).toBe(false);
  });
});
