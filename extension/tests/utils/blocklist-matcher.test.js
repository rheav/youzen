import { describe, it, expect } from 'vitest';
import { compileRule, compileRules, evaluateText, firstMatch } from '@/utils/blocklist-matcher';

describe('compileRule — substring (default)', () => {
  it('matches case-insensitively by default', () => {
    const m = compileRule({ id: '1', text: 'Reaction' });
    expect(m.valid).toBe(true);
    expect(m.test('top 10 reaction compilation')).toBe(true);
    expect(m.test('TOP 10 REACTION VIDEO')).toBe(true);
    expect(m.test('cats and dogs')).toBe(false);
  });

  it('matches case-sensitively when caseSensitive: true', () => {
    const m = compileRule({
      id: '1',
      text: 'Reaction',
      caseSensitive: true,
    });
    expect(m.test('Reaction video')).toBe(true);
    expect(m.test('reaction video')).toBe(false);
  });

  it('treats an empty text as never-match (valid: false)', () => {
    const m = compileRule({ id: 'empty', text: '' });
    expect(m.valid).toBe(false);
    expect(m.test('anything')).toBe(false);
  });
});

describe('compileRule — whole word', () => {
  it('matches word boundaries only', () => {
    const m = compileRule({ id: '2', text: 'cat', mode: 'wholeWord' });
    expect(m.test('big cat energy')).toBe(true);
    expect(m.test('category of things')).toBe(false);
    expect(m.test('catacomb')).toBe(false);
  });

  it('escapes regex metacharacters in the needle', () => {
    const m = compileRule({
      id: '2',
      text: 'c.a.t',
      mode: 'wholeWord',
    });
    expect(m.test('c.a.t video')).toBe(true);
    // Without escaping, '.' would match any char; with escaping, 'cxaxt' does not:
    expect(m.test('cxaxt video')).toBe(false);
  });

  it('respects caseSensitive', () => {
    const m = compileRule({
      id: '2',
      text: 'Cat',
      mode: 'wholeWord',
      caseSensitive: true,
    });
    expect(m.test('Cat video')).toBe(true);
    expect(m.test('cat video')).toBe(false);
  });
});

describe('compileRule — regex', () => {
  it('uses the user-supplied pattern verbatim', () => {
    const m = compileRule({
      id: '3',
      text: '^breaking',
      mode: 'regex',
    });
    expect(m.test('breaking news tonight')).toBe(true);
    expect(m.test('not breaking')).toBe(false);
  });

  it('case-insensitive by default', () => {
    const m = compileRule({ id: '3', text: 'BREAKING', mode: 'regex' });
    expect(m.test('breaking')).toBe(true);
  });

  it('case-sensitive when caseSensitive: true', () => {
    const m = compileRule({
      id: '3',
      text: 'BREAKING',
      mode: 'regex',
      caseSensitive: true,
    });
    expect(m.test('BREAKING')).toBe(true);
    expect(m.test('breaking')).toBe(false);
  });

  it('handles invalid regex gracefully (valid: false, test returns false)', () => {
    const m = compileRule({
      id: 'bad',
      text: '[unclosed',
      mode: 'regex',
    });
    expect(m.valid).toBe(false);
    expect(m.test('anything')).toBe(false);
    expect(typeof m.error).toBe('string');
  });
});

describe('compileRules + evaluateText', () => {
  const matchers = compileRules([
    { id: 'a', text: 'reaction' },
    { id: 'b', text: 'unbox', mode: 'wholeWord' },
    { id: 'c', text: '^[A-Z]{3,}\\s', mode: 'regex', caseSensitive: true },
  ]);

  it('any matcher matching → true', () => {
    expect(evaluateText('top reaction compilation', matchers)).toBe(true);
  });

  it('whole-word matcher flags standalone word', () => {
    expect(evaluateText('I unbox my new phone', matchers)).toBe(true);
  });

  it('regex matcher respects case-sensitivity', () => {
    expect(evaluateText('BREAKING news', matchers)).toBe(true);
    expect(evaluateText('breaking news', matchers)).toBe(false);
  });

  it('no match → false', () => {
    expect(evaluateText('dogs playing in snow', matchers)).toBe(false);
  });

  it('empty text / empty matchers → false', () => {
    expect(evaluateText('', matchers)).toBe(false);
    expect(evaluateText('anything', [])).toBe(false);
  });

  it('skips invalid matchers without crashing', () => {
    const m = compileRules([
      { id: 'ok', text: 'cats' },
      { id: 'bad', text: '[unclosed', mode: 'regex' },
    ]);
    expect(evaluateText('cats and dogs', m)).toBe(true);
    expect(evaluateText('fish', m)).toBe(false);
  });
});

describe('firstMatch', () => {
  it('returns the first matching rule in array order', () => {
    const matchers = compileRules([
      { id: 'a', text: 'reaction' },
      { id: 'b', text: 'unbox' },
    ]);
    // Both 'reaction' and 'unbox' match this text:
    const hit = firstMatch('my reaction to that unbox video', matchers);
    expect(hit?.id).toBe('a');
  });

  it('returns null when text matches none of the rules', () => {
    const matchers = compileRules([
      { id: 'a', text: 'reaction' },
      { id: 'b', text: 'unbox' },
    ]);
    // 'react' is a substring but 'reaction' is the whole needle, no match:
    expect(firstMatch('I react to things', matchers)).toBe(null);
  });

  it('returns null for no match', () => {
    const matchers = compileRules([{ id: 'a', text: 'reaction' }]);
    expect(firstMatch('just cats', matchers)).toBe(null);
  });
});

describe('compileRule — edge cases', () => {
  it('returns never-match for null / malformed rule', () => {
    expect(compileRule(null).valid).toBe(false);
    expect(compileRule({}).valid).toBe(false);
    expect(compileRule({ id: 'x', text: 42 }).valid).toBe(false);
  });

  it('compileRules returns [] for non-array input', () => {
    expect(compileRules(null)).toEqual([]);
    expect(compileRules(undefined)).toEqual([]);
    expect(compileRules('nope')).toEqual([]);
  });
});
