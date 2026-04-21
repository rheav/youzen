import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act, within } from '@testing-library/react';
import BlocklistTab from '@/sidepanel/components/tabs/BlocklistTab';

function setupChromeStorage(initial = {}) {
  let store = { ...initial };
  const listeners = new Set();
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
  return { get store() { return store; } };
}

async function flushAsyncReads() {
  await act(async () => { await Promise.resolve(); });
}

beforeEach(() => {
  setupChromeStorage();
});

describe('<BlocklistTab />', () => {
  it('renders both sections with zero counts when storage is empty', async () => {
    render(<BlocklistTab />);
    await flushAsyncReads();
    expect(screen.getByText('Keywords')).toBeTruthy();
    expect(screen.getByText('Channels')).toBeTruthy();
    expect(screen.getAllByText('No keywords yet.')).toHaveLength(1);
    expect(screen.getAllByText('No channels yet.')).toHaveLength(1);
  });

  it('renders rules from storage', async () => {
    setupChromeStorage({
      blocklistKeywords: [
        { id: 'a', text: 'reaction', mode: 'substring' },
        { id: 'b', text: 'unbox', mode: 'wholeWord' },
      ],
      blocklistChannels: [{ id: 'c', text: 'RantChannel' }],
    });
    render(<BlocklistTab />);
    await flushAsyncReads();
    expect(screen.getByText('reaction')).toBeTruthy();
    expect(screen.getByText('unbox')).toBeTruthy();
    expect(screen.getByText('RantChannel')).toBeTruthy();
  });

  it('adds a new keyword via the dialog and persists to storage', async () => {
    render(<BlocklistTab />);
    await flushAsyncReads();

    // Click the ADD button in the keywords section.
    const addKeywordBtn = screen.getByLabelText('Add keyword');
    await act(async () => {
      fireEvent.click(addKeywordBtn);
    });

    // Dialog opens; enter text and submit.
    const dialog = screen.getByRole('dialog');
    const input = within(dialog).getByPlaceholderText(/e\.g\. reaction/);
    await act(async () => {
      fireEvent.change(input, { target: { value: 'drama' } });
    });
    await act(async () => {
      fireEvent.click(within(dialog).getByRole('button', { name: 'Add' }));
    });

    // Verify persistence.
    const calls = chrome.storage.local.set.mock.calls;
    expect(calls.length).toBeGreaterThan(0);
    const finalCall = calls[calls.length - 1][0];
    expect(finalCall).toHaveProperty('blocklistKeywords');
    expect(finalCall.blocklistKeywords).toHaveLength(1);
    expect(finalCall.blocklistKeywords[0].text).toBe('drama');
  });

  it('deletes a rule on trash-can click', async () => {
    setupChromeStorage({
      blocklistKeywords: [{ id: 'a', text: 'reaction', mode: 'substring' }],
    });
    render(<BlocklistTab />);
    await flushAsyncReads();

    const trash = screen.getByLabelText('Delete rule');
    await act(async () => {
      fireEvent.click(trash);
    });

    const calls = chrome.storage.local.set.mock.calls;
    const finalCall = calls[calls.length - 1][0];
    expect(finalCall.blocklistKeywords).toEqual([]);
  });
});
