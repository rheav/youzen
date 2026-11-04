/**
 * Caption source for the transcript panel (ISOLATED world).
 *
 * page-hooks.js (MAIN world) reports every /api/timedtext request the player
 * makes. We keep the newest URL per video (it carries the `pot` token) and any
 * json3 body the player already downloaded. To load a track we rewrite that
 * URL; when there is no fresh URL yet we click the player's CC button so the
 * player asks for one, then put the button back the way it was.
 */

import { parseJson3, listTracks, buildTrackUrl, isLinkFresh, trackKey } from './captions.js';

const MAX_ATTEMPTS = 5;
const MAX_BODIES = 20;
const POLL_MS = 100;
const LINK_WAIT_MS = 5000;
const AD_WAIT_MS = 60_000;
const PLAYER_WAIT_MS = 1500;
const RETRY_429_MS = 3000;
const READY_WAIT_MS = 10_000;
const GRACE_MS = 1000;
const TIMEDTEXT = { origin: 'https://www.youtube.com', path: '/api/timedtext' };

const realSleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * @typedef {{ videoId: string, title: string|null, author: string|null,
 *   lengthSeconds: number|null, playability: string|null,
 *   tracks: import('./captions.js').Track[], translations: Array<{ code: string, label: string }> }} PlayerData
 */

export function createCaptionSource({
  win = window,
  doc = document,
  fetchFn = (...args) => fetch(...args),
  sleep = realSleep,
} = {}) {
  const links = new Map(); // videoId → newest timedtext URL
  const bodies = new Map(); // trackKey → json3 body (player's own downloads)
  const attempts = new Map(); // videoId → CC clicks spent
  const waiters = new Map(); // request id → resolve
  let nextId = 0;

  const onMessage = (event) => {
    if (event.source !== win || event.data?.source !== 'yz-hooks') return;
    const { type } = event.data;
    if (type === 'player-response') {
      waiters.get(event.data.id)?.(event.data.value ?? null);
      return;
    }
    if (type !== 'timedtext') return;
    let url;
    try {
      url = new URL(event.data.url);
    } catch {
      return;
    }
    if (url.origin !== TIMEDTEXT.origin || url.pathname !== TIMEDTEXT.path) return;
    const videoId = url.searchParams.get('v');
    const body = event.data.body;
    // A request that came back empty (e.g. made before the player had its token) is no base to build on.
    if (!videoId || typeof body !== 'string' || !body) return;
    links.set(videoId, url.href);
    if (url.searchParams.get('fmt') === 'json3') {
      const key = trackKey(url.href);
      bodies.delete(key);
      bodies.set(key, body);
      if (bodies.size > MAX_BODIES) bodies.delete(bodies.keys().next().value);
    }
  };
  win.addEventListener('message', onMessage);

  const askPlayer = () =>
    new Promise((resolve) => {
      const id = ++nextId;
      const done = (value) => {
        waiters.delete(id);
        resolve(value);
      };
      waiters.set(id, done);
      win.postMessage({ source: 'yz-content', type: 'player-request', id }, win.location.origin);
      setTimeout(() => done(null), 250);
    });

  /** @returns {Promise<PlayerData|null>} */
  async function getPlayer(videoId) {
    for (let waited = 0; waited <= PLAYER_WAIT_MS; waited += 250) {
      const value = await askPlayer();
      if (value?.videoId === videoId) {
        return {
          videoId,
          title: value.title ?? null,
          author: value.author ?? null,
          lengthSeconds: value.lengthSeconds ?? null,
          playability: value.playability ?? null,
          tracks: listTracks(value.captionTracks),
          translations: (value.translationLanguages ?? []).map((l) => ({
            code: l.languageCode,
            label: l.languageName?.simpleText ?? l.languageName?.runs?.map((r) => r.text).join('') ?? l.languageCode,
          })),
        };
      }
      await sleep(250);
    }
    return null;
  }

  const player = () => doc.getElementById('movie_player');
  const isAdShowing = () => !!player()?.classList.contains('ad-showing');
  const ccButton = () => player()?.querySelector('.ytp-subtitles-button') ?? null;
  const ccOn = (btn) => btn.getAttribute('aria-pressed') === 'true';

  async function setCc(btn, on) {
    for (let i = 0; i < 20 && ccOn(btn) !== on; i++) {
      btn.click();
      await sleep(200);
    }
  }

  const freshLink = (videoId) => {
    const link = links.get(videoId);
    return link && isLinkFresh(link) ? link : null;
  };

  // Pokes only make sense while that video is the one in the player.
  const onVideo = (videoId) => new URLSearchParams(win.location.search ?? '').get('v') === videoId;

  /** Makes the player request captions by toggling CC, then restores CC. */
  async function poke(videoId) {
    for (let waited = 0; isAdShowing(); waited += 500) {
      if (waited >= AD_WAIT_MS || !onVideo(videoId)) return;
      await sleep(500);
    }
    // While the player starts up it applies the user's own caption setting; reading the
    // button before that would "restore" the wrong state. Wait for video data plus a grace
    // period in which the player may fetch captions by itself.
    const video = player()?.querySelector('video');
    if (video) {
      for (let waited = 0; video.readyState < 2 && waited < READY_WAIT_MS; waited += POLL_MS) await sleep(POLL_MS);
      for (let waited = 0; !freshLink(videoId) && waited < GRACE_MS; waited += POLL_MS) await sleep(POLL_MS);
      if (freshLink(videoId)) return;
    }
    const btn = ccButton();
    if (!btn || !onVideo(videoId)) return;
    attempts.set(videoId, (attempts.get(videoId) ?? 0) + 1);
    const wasOn = ccOn(btn);
    if (wasOn) await setCc(btn, false);
    await setCc(btn, true);
    for (let waited = 0; !freshLink(videoId) && waited < LINK_WAIT_MS && onVideo(videoId); waited += POLL_MS) {
      await sleep(POLL_MS);
    }
    await setCc(btn, wasOn); // even if the user moved on: CC must end as it started
  }

  const pending = new Map(); // videoId → the one ensureLink run in flight

  /** One run per video at a time, so two pokes never fight over the CC button. */
  function ensureLink(videoId) {
    if (!pending.has(videoId)) {
      const run = (async () => {
        while (!freshLink(videoId) && (attempts.get(videoId) ?? 0) < MAX_ATTEMPTS && onVideo(videoId)) {
          const before = attempts.get(videoId) ?? 0;
          await poke(videoId);
          if ((attempts.get(videoId) ?? 0) === before) break; // ad never ended, no CC button, or user left
        }
        return freshLink(videoId);
      })().finally(() => pending.delete(videoId));
      pending.set(videoId, run);
    }
    return pending.get(videoId);
  }

  /**
   * @param {string} videoId @param {import('./captions.js').Track} track @param {string|null} tlang
   * @returns {Promise<{ cues: import('./captions.js').Cue[] } | { error: 'noLink'|'rateLimited'|'network'|'empty' }>}
   */
  async function loadTrack(videoId, track, tlang = null, retried = false) {
    const link = await ensureLink(videoId);
    if (!link) return { error: 'noLink' };
    const url = buildTrackUrl(link, track, tlang);
    const cached = bodies.get(trackKey(url));
    if (cached) {
      const cues = parseJson3(cached);
      if (cues.length) return { cues };
    }
    try {
      let res = await fetchFn(url, { credentials: 'include' });
      if (res.status === 429) {
        await sleep(RETRY_429_MS);
        res = await fetchFn(url, { credentials: 'include' });
        if (res.status === 429) return { error: 'rateLimited' };
      }
      if (!res.ok) return { error: 'network' };
      const cues = parseJson3(await res.text());
      if (cues.length) return { cues };
      // An empty answer usually means a stale or token-less link: ask the player for a new one, once.
      if (!retried && links.get(videoId) === link) {
        links.delete(videoId);
        return loadTrack(videoId, track, tlang, true);
      }
      return { error: 'empty' };
    } catch {
      return { error: 'network' };
    }
  }

  return {
    getPlayer,
    loadTrack,
    isAdShowing,
    /** A fresh load (new visit, "Try again") gets a fresh CC budget. */
    resetAttempts: (videoId) => attempts.delete(videoId),
    dispose: () => win.removeEventListener('message', onMessage),
  };
}
