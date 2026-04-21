/**
 * @vitest-environment-options { "url": "https://www.youtube.com/" }
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createPageRouter } from '@/content/modules/page-router';

const ORIGIN = 'https://www.youtube.com';

function navigate(pathAndSearch) {
  // jsdom supports history.pushState but doesn't fire popstate; our router
  // wraps pushState + dispatches ytc:locationchange, so this is enough.
  history.pushState({}, '', `${ORIGIN}${pathAndSearch}`);
}

function triggerYtNavigate() {
  window.dispatchEvent(new Event('yt-navigate-finish'));
}

beforeEach(() => {
  history.replaceState({}, '', `${ORIGIN}/`);
});

afterEach(() => {
  history.replaceState({}, '', `${ORIGIN}/`);
});

describe('createPageRouter — basic lifecycle', () => {
  it('fires onEnter for a matching handler on start', () => {
    const onEnter = vi.fn();
    const handler = {
      id: 'home',
      test: (url) => url.pathname === '/',
      onEnter,
    };
    const router = createPageRouter([handler]);
    router.start();
    expect(onEnter).toHaveBeenCalledOnce();
    router.stop();
  });

  it('does not fire onEnter for a non-matching handler on start', () => {
    history.replaceState({}, '', `${ORIGIN}/watch?v=abc`);
    const onEnter = vi.fn();
    const router = createPageRouter([
      {
        id: 'home',
        test: (url) => url.pathname === '/',
        onEnter,
      },
    ]);
    router.start();
    expect(onEnter).not.toHaveBeenCalled();
    router.stop();
  });
});

describe('createPageRouter — transitions', () => {
  it('fires onLeave (then cleanup) when navigating away from a matching page', () => {
    const order = [];
    const onEnter = vi.fn(() => {
      order.push('enter');
      return () => order.push('cleanup');
    });
    const onLeave = vi.fn(() => order.push('leave'));
    const router = createPageRouter([
      {
        id: 'home',
        test: (url) => url.pathname === '/',
        onEnter,
        onLeave,
      },
    ]);
    router.start();
    expect(order).toEqual(['enter']);

    navigate('/watch?v=x');
    expect(onLeave).toHaveBeenCalledOnce();
    expect(order).toEqual(['enter', 'leave', 'cleanup']);

    router.stop();
  });

  it('fires onEnter on the new handler when navigating between matching pages', () => {
    const homeEnter = vi.fn();
    const watchEnter = vi.fn();
    const router = createPageRouter([
      { id: 'home', test: (u) => u.pathname === '/', onEnter: homeEnter },
      {
        id: 'watch',
        test: (u) => u.pathname === '/watch',
        onEnter: watchEnter,
      },
    ]);
    router.start();
    expect(homeEnter).toHaveBeenCalledOnce();
    expect(watchEnter).not.toHaveBeenCalled();

    navigate('/watch?v=abc');
    expect(watchEnter).toHaveBeenCalledOnce();

    router.stop();
  });

  it('responds to yt-navigate-finish even without a pushState', () => {
    const onEnter = vi.fn();
    const router = createPageRouter([{ id: 'home', test: (u) => u.pathname === '/', onEnter }]);
    router.start();
    onEnter.mockClear();

    // Simulate YouTube updating the URL via replaceState then firing its event.
    history.replaceState({}, '', `${ORIGIN}/watch?v=y`);
    triggerYtNavigate();

    // Leaving home should NOT re-enter home:
    expect(onEnter).not.toHaveBeenCalled();
    router.stop();
  });

  it('does not re-fire onEnter if the URL changes but the handler still matches', () => {
    const onEnter = vi.fn();
    const router = createPageRouter([
      { id: 'watch', test: (u) => u.pathname === '/watch', onEnter },
    ]);
    history.replaceState({}, '', `${ORIGIN}/watch?v=1`);
    router.start();
    expect(onEnter).toHaveBeenCalledOnce();

    navigate('/watch?v=2');
    expect(onEnter).toHaveBeenCalledOnce();
    router.stop();
  });
});

describe('createPageRouter — error containment', () => {
  it('ignores handlers whose test() throws', () => {
    const goodEnter = vi.fn();
    const router = createPageRouter([
      {
        id: 'broken',
        test: () => {
          throw new Error('bad');
        },
        onEnter: vi.fn(),
      },
      {
        id: 'good',
        test: (u) => u.pathname === '/',
        onEnter: goodEnter,
      },
    ]);
    router.start();
    expect(goodEnter).toHaveBeenCalledOnce();
    router.stop();
  });

  it('onEnter that throws does not poison later handlers', () => {
    const lateEnter = vi.fn();
    const router = createPageRouter([
      {
        id: 'boom',
        test: () => true,
        onEnter: () => {
          throw new Error('boom');
        },
      },
      {
        id: 'late',
        test: () => true,
        onEnter: lateEnter,
      },
    ]);
    router.start();
    expect(lateEnter).toHaveBeenCalledOnce();
    router.stop();
  });
});

describe('createPageRouter — stop()', () => {
  it('restores pushState / replaceState on stop', () => {
    const origPush = history.pushState;
    const origReplace = history.replaceState;
    const router = createPageRouter([]);
    router.start();
    expect(history.pushState).not.toBe(origPush);
    router.stop();
    expect(history.pushState).toBe(origPush);
    expect(history.replaceState).toBe(origReplace);
  });

  it('fires onLeave + cleanup for active handlers on stop', () => {
    const onLeave = vi.fn();
    const cleanup = vi.fn();
    const router = createPageRouter([
      {
        id: 'home',
        test: (u) => u.pathname === '/',
        onEnter: () => cleanup,
        onLeave,
      },
    ]);
    router.start();
    router.stop();
    expect(onLeave).toHaveBeenCalledOnce();
    expect(cleanup).toHaveBeenCalledOnce();
  });
});
