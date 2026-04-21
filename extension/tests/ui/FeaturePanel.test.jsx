import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act, within } from '@testing-library/react';
import FeaturePanel from '@/sidepanel/components/FeaturePanel';
import { findMaster } from '@/config/features';

// Stateful chrome.storage.local that triggers onChanged listeners.
function setupChromeStorage(initial = {}) {
  let store = { ...initial };
  const listeners = new Set();
  const emit = (changes) => {
    for (const listener of listeners) listener(changes, 'local');
  };
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
          emit(changes);
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
  // useStorageState's get() is synchronous via our mock; an act + microtask
  // flush lets the state update commit.
  await act(async () => {
    await Promise.resolve();
  });
}

beforeEach(() => {
  setupChromeStorage();
});

describe('<FeaturePanel tab="feeds" />', () => {
  it('renders every group title from GROUPS.feeds', async () => {
    render(<FeaturePanel tab="feeds" />);
    await flushAsyncReads();
    expect(screen.getByText('Hide Shorts across YouTube')).toBeTruthy();
    expect(screen.getByText('Declutter homepage')).toBeTruthy();
    expect(screen.getByText('Declutter search')).toBeTruthy();
    expect(screen.getByText('Navigation chrome')).toBeTruthy();
  });

  it('renders every sub label from FEATURES (feeds tab)', async () => {
    render(<FeaturePanel tab="feeds" />);
    await flushAsyncReads();
    expect(screen.getByText('Homepage Shorts shelves')).toBeTruthy();
    expect(screen.getByText('Channel Shorts tab')).toBeTruthy();
    expect(screen.getByText('Hide homepage feed')).toBeTruthy();
    expect(screen.getByText('Chip / category bar')).toBeTruthy();
    expect(screen.getByText('Hide left sidebar entirely')).toBeTruthy();
  });

  it('toggling a sub persists to chrome.storage.local', async () => {
    render(<FeaturePanel tab="feeds" />);
    await flushAsyncReads();

    // Find the sub row "Hide left sidebar entirely" and click its toggle.
    const row = screen.getByText('Hide left sidebar entirely').closest('div').parentElement;
    const toggle = within(row).getByRole('switch');

    expect(chrome.storage.local.set).not.toHaveBeenCalled();

    await act(async () => {
      fireEvent.click(toggle);
    });

    expect(chrome.storage.local.set).toHaveBeenCalledWith(
      expect.objectContaining({ hideLeftSidebar: true }),
    );
  });

  it('master toggle reflects indeterminate when subs are mixed', async () => {
    const master = findMaster('hideShorts');
    // Seed storage so half of subs are on, half off.
    setupChromeStorage(
      Object.fromEntries(master.subs.map((id, i) => [id, i % 2 === 0])),
    );

    render(<FeaturePanel tab="feeds" />);
    await flushAsyncReads();

    // The master toggle is inside the "Hide Shorts across YouTube" card header.
    const masterTitle = screen.getByText('Hide Shorts across YouTube');
    const header = masterTitle.closest('[class*="animate-fade-in"]') || masterTitle.parentElement.parentElement.parentElement;
    const switches = within(header).getAllByRole('switch');
    const masterToggle = switches[0]; // the master sits first in the header
    expect(masterToggle.getAttribute('aria-checked')).toBe('mixed');
  });

  it('clicking an indeterminate master flips ALL subs on (spec §3.4)', async () => {
    const master = findMaster('hideShorts');
    setupChromeStorage(
      Object.fromEntries(master.subs.map((id, i) => [id, i % 2 === 0])),
    );

    render(<FeaturePanel tab="feeds" />);
    await flushAsyncReads();

    const masterTitle = screen.getByText('Hide Shorts across YouTube');
    const header = masterTitle.closest('[class*="animate-fade-in"]') || masterTitle.parentElement.parentElement.parentElement;
    const masterToggle = within(header).getAllByRole('switch')[0];

    await act(async () => {
      fireEvent.click(masterToggle);
    });

    // Writing should include every sub set to true.
    const allCalls = chrome.storage.local.set.mock.calls.map(([patch]) => patch);
    const merged = Object.assign({}, ...allCalls);
    for (const subId of master.subs) {
      expect(merged[subId]).toBe(true);
    }
  });

  it('disables all toggles when globallyPaused is true', async () => {
    setupChromeStorage({ globallyPaused: true });
    render(<FeaturePanel tab="feeds" />);
    await flushAsyncReads();
    const allToggles = screen.getAllByRole('switch');
    for (const t of allToggles) {
      expect(t.hasAttribute('disabled')).toBe(true);
    }
  });
});

describe('<FeaturePanel tab="watch" />', () => {
  it('renders the loose "Redirect Shorts" row', async () => {
    render(<FeaturePanel tab="watch" />);
    await flushAsyncReads();
    expect(
      screen.getByText('Redirect Shorts to normal video page'),
    ).toBeTruthy();
  });

  it('Watch tab includes "Hide comments area" and "Declutter player surroundings"', async () => {
    render(<FeaturePanel tab="watch" />);
    await flushAsyncReads();
    expect(screen.getByText('Hide comments area')).toBeTruthy();
    expect(screen.getByText('Declutter player surroundings')).toBeTruthy();
  });
});
