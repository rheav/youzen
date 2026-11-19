import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import TranscriptTab from '@/sidepanel/components/tabs/TranscriptTab';

function setupChromeStorage(initial = {}) {
  let store = { ...initial };
  const listeners = new Set();
  global.chrome = {
    runtime: { id: 'test', lastError: null },
    storage: {
      local: {
        get: vi.fn((keys, cb) => {
          if (Array.isArray(keys)) {
            const out = {};
            for (const k of keys) out[k] = store[k];
            return cb(out);
          }
          if (typeof keys === 'string') return cb({ [keys]: store[keys] });
          cb({ ...store });
        }),
        set: vi.fn((items, cb) => {
          const changes = {};
          for (const [k, v] of Object.entries(items)) {
            changes[k] = { oldValue: store[k], newValue: v };
            store[k] = v;
          }
          cb?.();
          for (const l of listeners) l(changes, 'local');
        }),
      },
      onChanged: {
        addListener: vi.fn((fn) => listeners.add(fn)),
        removeListener: vi.fn((fn) => listeners.delete(fn)),
      },
    },
  };
  return {
    get store() {
      return store;
    },
  };
}

describe('<TranscriptTab />', () => {
  beforeEach(() => {
    setupChromeStorage();
  });

  it('renders fullscreen mode select defaulting to split and saves changes to storage', async () => {
    const env = setupChromeStorage();
    render(<TranscriptTab />);
    await act(async () => {
      await Promise.resolve();
    });

    const select = screen.getByLabelText('In fullscreen');
    expect(select.value).toBe('split');

    fireEvent.change(select, { target: { value: 'floating' } });
    expect(env.store.transcriptFullscreenMode).toBe('floating');
    expect(select.value).toBe('floating');

    fireEvent.change(select, { target: { value: 'off' } });
    expect(env.store.transcriptFullscreenMode).toBe('off');
  });

  it('renders dynamic color glow toggle defaulting to on and persists changes', async () => {
    const env = setupChromeStorage();
    render(<TranscriptTab />);
    await act(async () => {
      await Promise.resolve();
    });

    const label = screen.getByText('Dynamic color glow');
    expect(screen.getByText("Tints the panel with the video's colours (dark theme)")).toBeTruthy();
    const row = label.closest('div')?.parentElement;
    const sw = row.querySelector('[role="switch"]');
    expect(sw.getAttribute('aria-checked')).toBe('true');

    fireEvent.click(sw);
    expect(env.store.transcriptColorLeak).toBe(false);
    expect(sw.getAttribute('aria-checked')).toBe('false');
  });
});
