/**
 * youZen — MAIN-world page hooks for the transcript panel.
 *
 * Runs in YouTube's own JS world at document_start. YouTube's caption URLs
 * carry a `pot` token that only the player can mint, so instead of building
 * URLs we watch the player's own /api/timedtext requests and hand the URL and
 * response text to the ISOLATED content script (src/content/transcript/source.js).
 * It also answers requests for the player response (title + caption tracks).
 *
 * Messages (window.postMessage, same window):
 *   → { source: 'yz-hooks', type: 'timedtext', url, body }
 *   ← { source: 'yz-content', type: 'player-request', id }
 *   → { source: 'yz-hooks', type: 'player-response', id, value }
 */
(() => {
  if (window.__yzHooks) return;
  window.__yzHooks = true;

  const isTimedtext = (url) => typeof url === 'string' && url.includes('/api/timedtext');
  const absolute = (url) => new URL(url, location.origin).href;
  const post = (message) => window.postMessage({ source: 'yz-hooks', ...message }, location.origin);
  const postCaption = (url, body) =>
    post({ type: 'timedtext', url: absolute(url), body: typeof body === 'string' && body ? body : null });

  const origFetch = window.fetch;
  window.fetch = function (...args) {
    const url = args[0]?.url ?? String(args[0]);
    const pending = origFetch.apply(this, args);
    if (isTimedtext(url)) {
      pending
        .then((res) => (res.ok ? res.clone().text() : null))
        .then((body) => postCaption(url, body), () => postCaption(url, null));
    }
    return pending;
  };

  const readBody = (xhr) => {
    if (xhr.responseType === '' || xhr.responseType === 'text') return xhr.responseText;
    if (xhr.responseType === 'json') return JSON.stringify(xhr.response);
    if (xhr.responseType === 'arraybuffer' && xhr.response) return new TextDecoder().decode(xhr.response);
    return null;
  };

  const origOpen = XMLHttpRequest.prototype.open;
  XMLHttpRequest.prototype.open = function (method, url) {
    const target = String(url);
    if (isTimedtext(target)) {
      this.addEventListener(
        'loadend',
        () => {
          let body = null;
          try {
            body = this.status === 200 ? readBody(this) : null;
          } catch {
            body = null;
          }
          postCaption(target, body);
        },
        { once: true },
      );
    }
    return origOpen.apply(this, arguments);
  };

  window.addEventListener('message', (event) => {
    if (event.source !== window || event.data?.source !== 'yz-content') return;
    if (event.data.type !== 'player-request') return;
    let value = null;
    try {
      const r = document.getElementById('movie_player')?.getPlayerResponse?.();
      if (r) {
        const captions = r.captions?.playerCaptionsTracklistRenderer;
        value = {
          videoId: r.videoDetails?.videoId ?? null,
          title: r.videoDetails?.title ?? null,
          author: r.videoDetails?.author ?? null,
          lengthSeconds: Number(r.videoDetails?.lengthSeconds) || null,
          playability: r.playabilityStatus?.status ?? null,
          captionTracks: captions?.captionTracks ?? [],
          translationLanguages: captions?.translationLanguages ?? [],
        };
      }
    } catch {
      value = null;
    }
    post({ type: 'player-response', id: event.data.id, value });
  });
})();
