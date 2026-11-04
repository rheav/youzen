/**
 * Where the transcript panel sits on the watch page.
 *
 *   theater → its own 400px column right of the player (#full-bleed-container is a flex row)
 *   columns → first thing in the right column, as tall as the player
 *   single  → narrow window: first thing below the player
 *
 * The host element itself moves between slots; the React tree inside its
 * shadow root survives the move.
 */

const PANEL_WIDTH = 400;
const THEATER_INSET = 8;
const MIN_HEIGHT = 360;
const GAP = 12;
const SINGLE_HEIGHT = 'clamp(240px, 40vh, 480px)';

/** @param {Element} flexy ytd-watch-flexy @returns {'theater'|'columns'|'single'} */
export function detectLayout(flexy) {
  if (!flexy.hasAttribute('is-two-columns_')) return 'single';
  return flexy.hasAttribute('theater') ? 'theater' : 'columns';
}

/** Writes the inline style only when it changes (placeHost runs on a timer). */
const applyCss = (el, css) => {
  if (el.dataset.yzCss === css) return;
  el.style.cssText = css;
  el.dataset.yzCss = css;
};

/**
 * Moves `host` into the slot for the current layout and sizes it.
 * @returns {'theater'|'columns'|'single'|null} null when hidden (no watch page, fullscreen, no anchor)
 */
export function placeHost(host, doc = document) {
  const flexy = doc.querySelector('ytd-watch-flexy');
  if (!flexy || flexy.hidden || flexy.hasAttribute('fullscreen') || doc.fullscreenElement) {
    host.hidden = true;
    return null;
  }
  const layout = detectLayout(flexy);
  // No inline `display`: it would override the `hidden` attribute.
  const base = 'box-sizing: border-box;';

  if (layout === 'theater') {
    const anchor = flexy.querySelector('#full-bleed-container > #player-full-bleed-container');
    if (!anchor) return hide(host);
    if (anchor.nextElementSibling !== host) anchor.after(host);
    applyCss(host, `${base} flex: 0 0 ${PANEL_WIDTH}px; width: ${PANEL_WIDTH}px; align-self: stretch; padding: ${THEATER_INSET}px;`);
  } else if (layout === 'columns') {
    const anchor = flexy.querySelector('#secondary-inner');
    if (!anchor) return hide(host);
    if (anchor.firstElementChild !== host) anchor.prepend(host);
    const player = flexy.querySelector('#primary-inner > #player')?.getBoundingClientRect().height ?? 0;
    applyCss(host, `${base} flex: none; width: 100%; height: ${Math.max(MIN_HEIGHT, Math.round(player))}px; margin: 0 0 ${GAP}px;`);
  } else {
    const anchor = flexy.querySelector('#primary-inner > #below');
    if (!anchor) return hide(host);
    if (anchor.firstElementChild !== host) anchor.prepend(host);
    applyCss(host, `${base} flex: none; width: 100%; height: ${SINGLE_HEIGHT}; margin: ${GAP}px 0;`);
  }
  host.hidden = false;
  return layout;
}

function hide(host) {
  host.hidden = true;
  return null;
}
