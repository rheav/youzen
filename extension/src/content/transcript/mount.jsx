/**
 * Mounts the transcript panel inside a shadow root on `host`, so YouTube's
 * CSS cannot reach it and its CSS cannot leak into YouTube. Loaded with a
 * dynamic import the first time the panel opens.
 */

import { createRoot } from 'react-dom/client';
import Panel from './Panel.jsx';
import visualCss from '../../theme/visual.css?inline';
import panelCss from './panel.css?inline';

const KEY_EVENTS = ['keydown', 'keyup', 'keypress'];
let fontAdded = false;

/** Shadow roots use the document's fonts, so Geist is registered there once. */
function addFont(ch) {
  if (fontAdded) return;
  fontAdded = true;
  try {
    const face = new FontFace('Geist', `url(${ch.runtime.getURL('fonts/geist-latin.woff2')}) format('woff2')`, {
      weight: '100 900',
    });
    document.fonts.add(face);
    face.load().catch(() => {});
  } catch {
    // Falls back to the system font.
  }
}

/**
 * @param {HTMLElement} host
 * @param {{ source: any, doc: Document, ch: typeof chrome, getVideoId: () => string|null,
 *   getVideo: () => HTMLVideoElement|null, onClose: () => void }} ctx
 */
export function mountPanel(host, ctx) {
  addFont(ctx.ch);
  const shadow = host.shadowRoot ?? host.attachShadow({ mode: 'open' });
  const style = document.createElement('style');
  style.textContent = `${visualCss}\n${panelCss}`;
  const mountPoint = document.createElement('div');
  mountPoint.style.height = '100%';
  shadow.replaceChildren(style, mountPoint);

  // Typing in the panel must not trigger YouTube's player shortcuts (f, k, j, space…).
  const stop = (e) => e.stopPropagation();
  KEY_EVENTS.forEach((type) => shadow.addEventListener(type, stop));

  const root = createRoot(mountPoint);
  root.render(<Panel {...ctx} />);
  return {
    unmount() {
      root.unmount();
      KEY_EVENTS.forEach((type) => shadow.removeEventListener(type, stop));
      shadow.replaceChildren();
    },
  };
}
