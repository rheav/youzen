import { describe, it, expect } from 'vitest';
import {
  parseJson3,
  cleanText,
  mergeBlocks,
  findActiveCue,
  listTracks,
  buildTrackUrl,
  isLinkFresh,
  trackKey,
} from '../../src/content/transcript/captions.js';

const ev = (tStartMs, dDurationMs, ...texts) => ({
  tStartMs,
  dDurationMs,
  segs: texts.map((utf8) => ({ utf8 })),
});

describe('parseJson3', () => {
  it('parses json3 events, skips aAppend and empty', () => {
    const json = JSON.stringify({
      events: [
        { tStartMs: 0, dDurationMs: 100 }, // window setup, no segs
        ev(1000, 2000, 'Hello ', 'world'),
        { tStartMs: 2900, aAppend: 1, segs: [{ utf8: '\n' }] },
        ev(3000, 1500, '   '),
        ev(4000, 1000, 'again'),
      ],
    });
    expect(parseJson3(json)).toEqual([
      { start: 1, end: 4, text: 'Hello world' },
      { start: 4, end: 5, text: 'again' },
    ]);
  });

  it('end is next start, last end is start+dur', () => {
    const json = JSON.stringify({ events: [ev(0, 5000, 'a'), ev(3000, 5000, 'b')] });
    const cues = parseJson3(json);
    expect(cues[0].end).toBe(3);
    expect(cues[1].end).toBe(8);
  });

  it('returns [] for bad input', () => {
    expect(parseJson3('not json')).toEqual([]);
    expect(parseJson3('{}')).toEqual([]);
  });
});

describe('cleanText', () => {
  it('decodes entities and keeps markup as text', () => {
    expect(cleanText('&lt;b&gt; Tom &amp; Jerry')).toBe('<b> Tom & Jerry');
    expect(cleanText('<img src=x onerror=alert(1)>hi')).toBe('<img src=x onerror=alert(1)>hi');
  });

  it('removes [Music], >> and ♪ and collapses whitespace', () => {
    expect(cleanText('[Music] >> hello\n  ♪ there ♪')).toBe('hello there');
  });
});

describe('mergeBlocks', () => {
  const cue = (start, text) => ({ start, end: start + 1, text });

  it('closes at sentence end after 160 chars and forces at 260', () => {
    const forty = 'x'.repeat(39); // 39 chars + 1 space = 40 per cue
    const cues = [
      cue(0, forty),
      cue(1, forty),
      cue(2, forty),
      cue(3, `${'y'.repeat(41)}.`), // 119 + 43 = 162 ≥ 160 and ends a sentence → close
      cue(4, 'z'.repeat(130)),
      cue(5, 'z'.repeat(140)), // 271 ≥ 260 → forced close, no sentence end
      cue(6, 'tail'),
    ];
    const blocks = mergeBlocks(cues);
    expect(blocks.map((b) => [b.from, b.to])).toEqual([
      [0, 3],
      [4, 5],
      [6, 6],
    ]);
    expect(blocks[0]).toMatchObject({ start: 0, end: 4 });
  });

  it('returns [] for no cues', () => {
    expect(mergeBlocks([])).toEqual([]);
  });
});

describe('findActiveCue', () => {
  const cues = [
    { start: 2, end: 4, text: 'a' },
    { start: 4, end: 9, text: 'b' },
    { start: 12, end: 15, text: 'c' },
  ];

  it('findActiveCue handles gaps, before-first and seeking back', () => {
    expect(findActiveCue(cues, 0)).toBe(-1);
    expect(findActiveCue(cues, 2)).toBe(0);
    expect(findActiveCue(cues, 10)).toBe(1); // gap keeps the last spoken cue
    expect(findActiveCue(cues, 99)).toBe(2);
    expect(findActiveCue(cues, 4.5)).toBe(1); // seeking back
    expect(findActiveCue([], 3)).toBe(-1);
  });
});

describe('listTracks', () => {
  it('listTracks prefers manual over asr, one per language', () => {
    const tracks = listTracks([
      { languageCode: 'en', kind: 'asr', name: { simpleText: 'English (auto-generated)' }, baseUrl: '/api/timedtext?v=x&lang=en&kind=asr' },
      { languageCode: 'pt', name: { runs: [{ text: 'Portuguese' }] }, baseUrl: '/api/timedtext?v=x&lang=pt&name=CC' },
      { languageCode: 'en', name: { simpleText: 'English' }, baseUrl: '/api/timedtext?v=x&lang=en' },
    ]);
    expect(tracks).toEqual([
      { lang: 'en', label: 'English', auto: false, params: { kind: null, name: null, variant: null } },
      { lang: 'pt', label: 'Portuguese', auto: false, params: { kind: null, name: 'CC', variant: null } },
    ]);
  });

  it('keeps asr when it is the only track', () => {
    const [t] = listTracks([{ languageCode: 'en', kind: 'asr', name: { simpleText: 'English (auto-generated)' }, baseUrl: '/api/timedtext?lang=en&kind=asr' }]);
    expect(t).toMatchObject({ lang: 'en', auto: true, params: { kind: 'asr' } });
  });
});

describe('timedtext URLs', () => {
  const base = 'https://www.youtube.com/api/timedtext?v=abc&lang=pt&name=CC&fmt=srv3&pot=TOKEN&expire=2000';
  const asrEn = { lang: 'en', label: 'English', auto: true, params: { kind: 'asr', name: null, variant: null } };

  it('buildTrackUrl sets lang/kind/tlang/fmt', () => {
    const u = new URL(buildTrackUrl(base, asrEn, 'pt-BR'));
    expect(u.searchParams.get('lang')).toBe('en');
    expect(u.searchParams.get('kind')).toBe('asr');
    expect(u.searchParams.has('name')).toBe(false);
    expect(u.searchParams.get('tlang')).toBe('pt-BR');
    expect(u.searchParams.get('fmt')).toBe('json3');
    expect(u.searchParams.get('pot')).toBe('TOKEN');
  });

  it('drops tlang when it is the same language', () => {
    const u = new URL(buildTrackUrl(base, asrEn, 'en-US'));
    expect(u.searchParams.has('tlang')).toBe(false);
  });

  it('isLinkFresh respects the 60 s margin', () => {
    expect(isLinkFresh(base, 2000 * 1000 - 61_000)).toBe(true);
    expect(isLinkFresh(base, 2000 * 1000 - 59_000)).toBe(false);
    expect(isLinkFresh('https://www.youtube.com/api/timedtext?v=abc', 5)).toBe(true);
  });

  it('trackKey ignores token and format', () => {
    const a = 'https://www.youtube.com/api/timedtext?v=abc&lang=en&kind=asr&fmt=json3&pot=1';
    const b = 'https://www.youtube.com/api/timedtext?pot=2&lang=en&v=abc&kind=asr';
    expect(trackKey(a)).toBe(trackKey(b));
    expect(trackKey(a)).toBe('abc|en|asr|||');
  });
});

describe('alignTranslations', () => {
  it('attaches each translated cue to the original cue playing at its start', async () => {
    const { alignTranslations } = await import('../../src/content/transcript/captions.js');
    const cues = [
      { start: 0, end: 2, text: 'a' },
      { start: 2, end: 5, text: 'b' },
      { start: 5, end: 9, text: 'c' },
    ];
    expect(
      alignTranslations(cues, [
        { start: 0, end: 2, text: 'A' },
        { start: 2, end: 3, text: 'B1' },
        { start: 3.5, end: 5, text: 'B2' },
      ]),
    ).toEqual(['A', 'B1 B2', '']);
    expect(alignTranslations(cues, [])).toEqual(['', '', '']);
  });
});
