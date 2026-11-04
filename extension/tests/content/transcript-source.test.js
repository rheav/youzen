import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createCaptionSource } from '../../src/content/transcript/source.js';

const BASE = 'https://www.youtube.com/api/timedtext?v=vid1&lang=en&kind=asr&fmt=json3&pot=T';
const json3 = (text) => JSON.stringify({ events: [{ tStartMs: 0, dDurationMs: 1000, segs: [{ utf8: text }] }] });
const enAsr = { lang: 'en', label: 'English', auto: true, params: { kind: 'asr', name: null, variant: null } };

/** A fake window: page-hooks replies are simulated by `player` and the CC button. */
function setup({ tracks = [{ languageCode: 'en', kind: 'asr', baseUrl: '/api/timedtext?lang=en&kind=asr' }], ccOn = false, ad = false, playerSendsLink = true } = {}) {
  const listeners = new Set();
  const win = {
    location: { origin: 'https://www.youtube.com', search: '?v=vid1' },
    addEventListener: (_t, fn) => listeners.add(fn),
    removeEventListener: (_t, fn) => listeners.delete(fn),
    postMessage: (data) => {
      if (data.source === 'yz-content' && data.type === 'player-request') {
        queueMicrotask(() =>
          emit({ source: 'yz-hooks', type: 'player-response', id: data.id, value: { videoId: 'vid1', title: 'T', author: 'A', captionTracks: tracks, translationLanguages: [{ languageCode: 'pt', languageName: { simpleText: 'Portuguese' } }] } }),
        );
      }
    },
  };
  const emit = (data) => listeners.forEach((fn) => fn({ source: win, data }));

  document.body.innerHTML = `<div id="movie_player" class="${ad ? 'ad-showing' : ''}"><button class="ytp-subtitles-button" aria-pressed="${ccOn}"></button></div>`;
  const button = document.querySelector('.ytp-subtitles-button');
  const clicks = [];
  button.addEventListener('click', () => {
    const next = button.getAttribute('aria-pressed') !== 'true';
    button.setAttribute('aria-pressed', String(next));
    clicks.push(next);
    if (next && playerSendsLink) emit({ source: 'yz-hooks', type: 'timedtext', url: BASE, body: json3('from player') });
  });

  const fetchFn = vi.fn(async () => ({ ok: true, status: 200, text: async () => json3('fetched') }));
  const source = createCaptionSource({ win, doc: document, fetchFn, sleep: () => Promise.resolve() });
  return { source, emit, fetchFn, button, clicks, win };
}

describe('caption source', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  it("uses the player's body when lang/kind/tlang match", async () => {
    const { source, emit, fetchFn } = setup();
    emit({ source: 'yz-hooks', type: 'timedtext', url: BASE, body: json3('cached text') });
    const result = await source.loadTrack('vid1', enAsr, null);
    expect(result.cues.map((c) => c.text)).toEqual(['cached text']);
    expect(fetchFn).not.toHaveBeenCalled();
  });

  it('fetches json3 with the base URL params otherwise', async () => {
    const { source, emit, fetchFn } = setup();
    emit({ source: 'yz-hooks', type: 'timedtext', url: BASE, body: json3('player') });
    const result = await source.loadTrack('vid1', enAsr, 'pt');
    const url = new URL(fetchFn.mock.calls[0][0]);
    expect(url.searchParams.get('tlang')).toBe('pt');
    expect(url.searchParams.get('pot')).toBe('T');
    expect(result.cues[0].text).toBe('fetched');
  });

  it('ignores captions from other origins', async () => {
    const { source, emit, fetchFn } = setup({ playerSendsLink: false });
    emit({ source: 'yz-hooks', type: 'timedtext', url: 'https://evil.example/api/timedtext?v=vid1', body: json3('x') });
    const result = await source.loadTrack('vid1', enAsr, null);
    expect(result).toEqual({ error: 'noLink' });
    expect(fetchFn).not.toHaveBeenCalled();
  });

  it('clicks CC to get a link and restores the CC button state', async () => {
    for (const ccOn of [false, true]) {
      const { source, button, clicks } = setup({ ccOn });
      const result = await source.loadTrack('vid1', enAsr, null);
      expect(result.cues[0].text).toBe('from player');
      expect(clicks.length).toBeGreaterThan(0);
      expect(button.getAttribute('aria-pressed')).toBe(String(ccOn));
    }
  });

  it('does not click CC during an ad', async () => {
    const { source, clicks } = setup({ ad: true });
    expect(await source.loadTrack('vid1', enAsr, null)).toEqual({ error: 'noLink' });
    expect(clicks).toEqual([]);
  });

  it('stops after 5 attempts', async () => {
    const { source, clicks } = setup({ playerSendsLink: false });
    await source.loadTrack('vid1', enAsr, null);
    await source.loadTrack('vid1', enAsr, null);
    expect(clicks.filter((on) => on)).toHaveLength(5);
  });

  it('resolves noCaptions when the player has no tracks', async () => {
    const { source } = setup({ tracks: [] });
    const player = await source.getPlayer('vid1');
    expect(player.tracks).toEqual([]);
    expect(player.title).toBe('T');
    expect(player.translations).toEqual([{ code: 'pt', label: 'Portuguese' }]);
  });

  it('maps HTTP 429 twice to rateLimited', async () => {
    const { source, emit, fetchFn } = setup();
    emit({ source: 'yz-hooks', type: 'timedtext', url: BASE, body: json3('player') });
    fetchFn.mockResolvedValue({ ok: false, status: 429, text: async () => '' });
    expect(await source.loadTrack('vid1', enAsr, 'pt')).toEqual({ error: 'rateLimited' });
    expect(fetchFn).toHaveBeenCalledTimes(2);
  });

  it('ignores a link whose own request came back empty', async () => {
    const { source, emit, clicks, fetchFn } = setup();
    emit({ source: 'yz-hooks', type: 'timedtext', url: `${BASE}&bad=1`, body: null });
    const result = await source.loadTrack('vid1', enAsr, null);
    expect(clicks.length).toBeGreaterThan(0); // had to ask the player for a usable link
    expect(result.cues[0].text).toBe('from player');
    expect(fetchFn).not.toHaveBeenCalled();
  });

  it('drops a link that yields an empty track and asks the player again', async () => {
    const { source, emit, clicks, fetchFn } = setup();
    emit({ source: 'yz-hooks', type: 'timedtext', url: BASE.replace('lang=en', 'lang=pt'), body: json3('pt body') });
    fetchFn.mockResolvedValueOnce({ ok: true, status: 200, text: async () => '' });
    const result = await source.loadTrack('vid1', enAsr, null);
    expect(clicks.length).toBeGreaterThan(0);
    expect(result.cues[0].text).toBe('from player');
  });

  it('runs one CC poke at a time per video', async () => {
    const { source, clicks } = setup({ playerSendsLink: false });
    await Promise.all([source.loadTrack('vid1', enAsr, null), source.loadTrack('vid1', enAsr, 'pt')]);
    expect(clicks.filter((on) => on)).toHaveLength(5);
  });

  it('stops poking once the user is on another video', async () => {
    const { source, clicks, win } = setup({ playerSendsLink: false });
    win.location.search = '?v=other';
    expect(await source.loadTrack('vid1', enAsr, null)).toEqual({ error: 'noLink' });
    expect(clicks).toEqual([]);
  });

  it('resetAttempts gives the video a fresh budget', async () => {
    const { source, clicks } = setup({ playerSendsLink: false });
    await source.loadTrack('vid1', enAsr, null);
    source.resetAttempts('vid1');
    await source.loadTrack('vid1', enAsr, null);
    expect(clicks.filter((on) => on)).toHaveLength(10);
  });
});
