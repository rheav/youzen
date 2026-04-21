import { describe, it, expect } from 'vitest';
import { extractShortsId, buildWatchUrl } from '@/content/pages/shorts';

describe('extractShortsId', () => {
  it('extracts the id from /shorts/:id', () => {
    expect(extractShortsId('/shorts/abc123xyz99')).toBe('abc123xyz99');
  });

  it('ignores trailing path and query segments', () => {
    expect(extractShortsId('/shorts/abc123xyz99/extra?foo=1')).toBe(
      'abc123xyz99',
    );
  });

  it('returns null for the Shorts browse root', () => {
    expect(extractShortsId('/shorts/')).toBe(null);
    expect(extractShortsId('/shorts')).toBe(null);
  });

  it('returns null for non-Shorts paths', () => {
    expect(extractShortsId('/watch?v=abc')).toBe(null);
    expect(extractShortsId('/')).toBe(null);
  });

  it('rejects suspiciously short or long ids', () => {
    expect(extractShortsId('/shorts/ab')).toBe(null);
    expect(extractShortsId(`/shorts/${'x'.repeat(40)}`)).toBe(null);
  });

  it('handles non-string input gracefully', () => {
    expect(extractShortsId(null)).toBe(null);
    expect(extractShortsId(undefined)).toBe(null);
    expect(extractShortsId(42)).toBe(null);
  });
});

describe('buildWatchUrl', () => {
  it('builds /watch?v=ID for a bare call', () => {
    expect(buildWatchUrl('abc')).toBe('/watch?v=abc');
  });

  it('merges arbitrary query params', () => {
    expect(buildWatchUrl('abc', '?t=30')).toBe('/watch?t=30&v=abc');
  });

  it('replaces any existing v= param with the correct id', () => {
    expect(buildWatchUrl('abc', '?v=old&t=30')).toBe('/watch?t=30&v=abc');
  });
});
