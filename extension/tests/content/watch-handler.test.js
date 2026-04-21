import { describe, it, expect, beforeEach, vi } from 'vitest';
import { collapseDescriptionIfExpanded } from '@/content/pages/watch';

beforeEach(() => {
  document.body.innerHTML = '';
});

describe('collapseDescriptionIfExpanded', () => {
  it('returns false when the expander is absent', () => {
    expect(collapseDescriptionIfExpanded(document)).toBe(false);
  });

  it('returns false when expander exists but is not expanded', () => {
    document.body.innerHTML = `
      <ytd-watch-metadata>
        <ytd-text-inline-expander>
          <tp-yt-paper-button id="collapse"></tp-yt-paper-button>
        </ytd-text-inline-expander>
      </ytd-watch-metadata>`;
    expect(collapseDescriptionIfExpanded(document)).toBe(false);
  });

  it('clicks the #collapse button when expanded', () => {
    document.body.innerHTML = `
      <ytd-watch-metadata>
        <ytd-text-inline-expander is-expanded>
          <div id="collapse"></div>
        </ytd-text-inline-expander>
      </ytd-watch-metadata>`;
    const btn = document.getElementById('collapse');
    const clickSpy = vi.fn();
    btn.click = clickSpy;
    expect(collapseDescriptionIfExpanded(document)).toBe(true);
    expect(clickSpy).toHaveBeenCalledOnce();
  });

  it('falls back to removing is-expanded when no collapse button exists', () => {
    document.body.innerHTML = `
      <ytd-watch-metadata>
        <ytd-text-inline-expander is-expanded></ytd-text-inline-expander>
      </ytd-watch-metadata>`;
    expect(collapseDescriptionIfExpanded(document)).toBe(true);
    const expander = document.querySelector('ytd-text-inline-expander');
    expect(expander.hasAttribute('is-expanded')).toBe(false);
  });
});
