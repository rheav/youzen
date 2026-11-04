import { describe, it, expect } from 'vitest';
import { fold, findMatches } from '../../src/content/transcript/search.js';

describe('transcript search', () => {
  it('fold ignores accents and case', () => {
    expect(fold('Ação').folded).toBe('acao');
    expect(findMatches('Café com AÇÚCAR', 'acucar')).toEqual([[9, 15]]);
    expect(findMatches('cafe CAFÉ café', 'Café')).toEqual([
      [0, 4],
      [5, 9],
      [10, 14],
    ]);
  });

  it('maps back through decomposed accents and emoji', () => {
    const s = 'école 😀 école';
    const ranges = findMatches(s, 'ecole');
    expect(ranges.map(([a, b]) => s.slice(a, b))).toEqual(['école', 'école']);
  });

  it('findMatches returns [] under 2 letters', () => {
    expect(findMatches('a b c', 'a')).toEqual([]);
    expect(findMatches('a b c', '  ')).toEqual([]);
  });

  it('collapses spaces in the query', () => {
    expect(findMatches('the  future   now', 'future now')).toEqual([]);
    expect(findMatches('the future now', ' future   now ')).toEqual([[4, 14]]);
  });
});

describe('splitRanges', () => {
  it('splits block-level ranges back into per-phrase pieces', async () => {
    const { splitRanges } = await import('../../src/content/transcript/search.js');
    // block text = 'the future' + ' ' + 'might change'
    const parts = ['the future', 'might change'];
    const pieces = splitRanges(parts, [[4, 16]], 7);
    expect(pieces[0]).toEqual([{ text: 'the ', m: -1 }, { text: 'future', m: 7 }]);
    expect(pieces[1]).toEqual([{ text: 'might', m: 7 }, { text: ' change', m: -1 }]);
    expect(splitRanges(['plain'], [], 0)).toEqual([null]);
  });
});
