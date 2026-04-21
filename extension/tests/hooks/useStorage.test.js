import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useStorage } from '../../src/sidepanel/hooks/useStorage';

describe('useStorage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return default value initially', () => {
    const { result } = renderHook(() => useStorage('testKey', 'default'));
    expect(result.current[0]).toBe('default');
  });

  it('should load stored value on mount', async () => {
    chrome.storage.local.get.mockImplementation((_key, cb) => {
      cb({ testKey: 'stored-value' });
    });

    const { result } = renderHook(() => useStorage('testKey', 'default'));

    // Wait for effect to run
    await act(async () => {
      await new Promise((r) => setTimeout(r, 10));
    });

    expect(result.current[0]).toBe('stored-value');
  });

  it('should call chrome.storage.local.set when setValue is called', async () => {
    const { result } = renderHook(() => useStorage('testKey', 'default'));

    act(() => {
      result.current[1]('new-value');
    });

    expect(result.current[0]).toBe('new-value');
    expect(chrome.storage.local.set).toHaveBeenCalledWith({ testKey: 'new-value' });
  });

  it('should register storage change listener', () => {
    renderHook(() => useStorage('testKey', 'default'));
    expect(chrome.storage.onChanged.addListener).toHaveBeenCalled();
  });

  it('should support functional updates', () => {
    const { result } = renderHook(() => useStorage('counter', 0));

    act(() => {
      result.current[1]((prev) => prev + 1);
    });

    expect(result.current[0]).toBe(1);
  });
});
