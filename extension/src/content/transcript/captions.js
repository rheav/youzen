/**
 * Caption logic for the transcript panel — pure functions, no chrome APIs.
 *
 * Input is YouTube's timedtext json3 (the format the player itself requests).
 * Auto captions arrive in ~5 s cues with no per-word timing (measured
 * 2026-11-04), so the cue is the karaoke unit; blocks group cues into rows.
 */

const SENTENCE_END = /[.!?…]["'”’)\]]*$/;
const BLOCK_MIN = 160;
const BLOCK_MAX = 260;
const FRESH_MARGIN_MS = 60_000;
const TRACK_PARAMS = ['kind', 'name', 'variant'];
const KEY_PARAMS = ['v', 'lang', 'kind', 'name', 'variant', 'tlang'];
const YT_ORIGIN = 'https://www.youtube.com';

/**
 * @typedef {{ start: number, end: number, text: string }} Cue
 * @typedef {{ start: number, end: number, from: number, to: number }} Block
 * @typedef {{ lang: string, label: string, auto: boolean,
 *   params: { kind: string|null, name: string|null, variant: string|null } }} Track
 */

const ENTITY = /&(#\d+|#x[\da-f]+|[a-z]+);/i;

/** Decodes HTML entities only; tags stay as literal text (never parsed as markup). */
function decodeEntities(s) {
  if (!ENTITY.test(s)) return s;
  const area = document.createElement('textarea');
  area.innerHTML = s.replace(/</g, '&lt;');
  return area.value;
}

/** @param {string} raw @returns {string} */
export function cleanText(raw) {
  return decodeEntities(String(raw ?? ''))
    .replace(/\[[^\]]*\]/g, ' ')
    .replace(/>>/g, ' ')
    .replace(/♪/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** @param {string} text json3 body @returns {Cue[]} */
export function parseJson3(text) {
  let events;
  try {
    events = JSON.parse(text)?.events;
  } catch {
    return [];
  }
  if (!Array.isArray(events)) return [];

  const raw = [];
  for (const e of events) {
    if (!Array.isArray(e.segs) || e.aAppend) continue;
    const t = cleanText(e.segs.map((s) => s.utf8 ?? '').join(''));
    if (!t) continue;
    raw.push({ start: (e.tStartMs ?? 0) / 1000, dur: (e.dDurationMs ?? 0) / 1000, text: t });
  }
  // Auto captions overlap (roll-up windows); end each cue where the next begins.
  return raw.map((c, i) => ({
    start: c.start,
    end: i + 1 < raw.length ? raw[i + 1].start : c.start + c.dur,
    text: c.text,
  }));
}

/** @param {Cue[]} cues @returns {Block[]} */
export function mergeBlocks(cues) {
  const blocks = [];
  let from = 0;
  let len = 0;
  cues.forEach((cue, i) => {
    len += cue.text.length + (i === from ? 0 : 1);
    const last = i === cues.length - 1;
    if (last || len >= BLOCK_MAX || (len >= BLOCK_MIN && SENTENCE_END.test(cue.text))) {
      blocks.push({ start: cues[from].start, end: cue.end, from, to: i });
      from = i + 1;
      len = 0;
    }
  });
  return blocks;
}

/** Index of the last cue with start <= t, or -1. @param {Cue[]} cues @param {number} t */
export function findActiveCue(cues, t) {
  let lo = 0;
  let hi = cues.length - 1;
  let found = -1;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    if (cues[mid].start <= t) {
      found = mid;
      lo = mid + 1;
    } else {
      hi = mid - 1;
    }
  }
  return found;
}

const labelOf = (name, fallback) =>
  name?.simpleText ?? name?.runs?.map((r) => r.text).join('') ?? fallback;

/** @param {any[]} captionTracks player response tracks @returns {Track[]} */
export function listTracks(captionTracks) {
  const byLang = new Map();
  for (const t of captionTracks ?? []) {
    const params = new URL(t.baseUrl ?? '', YT_ORIGIN).searchParams;
    const track = {
      lang: t.languageCode,
      label: labelOf(t.name, t.languageCode),
      auto: t.kind === 'asr',
      params: Object.fromEntries(TRACK_PARAMS.map((p) => [p, params.get(p)])),
    };
    const seen = byLang.get(track.lang);
    if (!seen || (seen.auto && !track.auto)) byLang.set(track.lang, track);
  }
  return [...byLang.values()];
}

const baseLang = (code) => String(code ?? '').toLowerCase().split('-')[0];

/**
 * Rewrites the player's own timedtext URL (it carries the `pot` token) for another track.
 * @param {string} baseUrl @param {Track} track @param {string|null} [tlang]
 */
export function buildTrackUrl(baseUrl, track, tlang = null) {
  const u = new URL(baseUrl, YT_ORIGIN);
  u.searchParams.set('lang', track.lang);
  for (const p of TRACK_PARAMS) {
    const value = track.params?.[p];
    if (value) u.searchParams.set(p, value);
    else u.searchParams.delete(p);
  }
  if (tlang && baseLang(tlang) !== baseLang(track.lang)) u.searchParams.set('tlang', tlang);
  else u.searchParams.delete('tlang');
  u.searchParams.set('fmt', 'json3');
  return u.toString();
}

/** @param {string} url @param {number} [now] */
export function isLinkFresh(url, now = Date.now()) {
  const expire = Number(new URL(url, YT_ORIGIN).searchParams.get('expire'));
  return !expire || expire * 1000 > now + FRESH_MARGIN_MS;
}

/** Identity of a caption request, ignoring token and format. @param {string} url */
export function trackKey(url) {
  const params = new URL(url, YT_ORIGIN).searchParams;
  return KEY_PARAMS.map((p) => params.get(p) ?? '').join('|');
}
