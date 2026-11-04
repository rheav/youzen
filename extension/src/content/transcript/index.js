/**
 * Transcript panel — page-router handler for /watch.
 *
 * Owns the youZen button in the player's controls, the open/closed state
 * (per tab, survives navigation to the next video), the host element the panel
 * lives in, and moving that host into the right slot for the layout. The React
 * panel itself (mount.jsx) is imported on first open only.
 */

import { placeHost } from './placement.js';
import { createCaptionSource } from './source.js';
import { findFeature } from '../../config/features.js';
import { isPausedNow, onPauseChange } from '../modules/pause-state.js';
import { nudgePlayerResize } from '../modules/attribute-applier.js';

const FLAG = 'transcriptPanel';
const OPEN_KEY = 'yz-transcript-open';
const OPEN_ATTR = 'data-yz-transcript-open';
const TICK_MS = 500;
const SVG_NS = 'http://www.w3.org/2000/svg';
// lucide "scroll-text"
const ICON_PATHS = [
  'M15 12h-5',
  'M15 8h-5',
  'M19 17V5a2 2 0 0 0-2-2H4',
  'M8 21h12a2 2 0 0 0 2-2v-1a1 1 0 0 0-1-1H11a1 1 0 0 0-1 1v1a2 2 0 1 1-4 0V5a2 2 0 1 0-4 0v2a1 1 0 0 0 1 1h3',
];

const readOpen = () => {
  try {
    return sessionStorage.getItem(OPEN_KEY) === '1';
  } catch {
    return false;
  }
};
const writeOpen = (open) => {
  try {
    if (open) sessionStorage.setItem(OPEN_KEY, '1');
    else sessionStorage.removeItem(OPEN_KEY);
  } catch {
    // Storage blocked: the panel still works, it just won't reopen on the next video.
  }
};

function makeButton(doc, onClick) {
  const btn = doc.createElement('button');
  btn.className = 'ytp-button yz-transcript-button';
  btn.setAttribute('aria-label', 'Transcript (youZen)');
  btn.setAttribute('data-title-no-tooltip', 'Transcript');
  btn.title = 'Transcript (youZen)';
  const svg = doc.createElementNS(SVG_NS, 'svg');
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('aria-hidden', 'true');
  for (const d of ICON_PATHS) {
    const path = doc.createElementNS(SVG_NS, 'path');
    path.setAttribute('d', d);
    svg.append(path);
  }
  btn.append(svg);
  btn.addEventListener('click', (e) => {
    e.stopPropagation(); // the player treats clicks on its chrome as play/pause otherwise
    onClick();
  });
  return btn;
}

/** @param {typeof chrome} ch */
export function makeTranscriptHandler(ch = chrome, { doc = document, win = window } = {}) {
  // Listen from document_start: the player may fetch captions before the panel opens.
  const source = createCaptionSource({ win, doc });
  let enabled = false;
  let button = null;
  let host = null;
  let panel = null;
  let mounting = false;
  let layout = null;

  const place = () => {
    if (!host) return;
    const next = placeHost(host, doc);
    if (next !== layout && (next === 'theater' || layout === 'theater')) nudgePlayerResize();
    layout = next;
  };

  const ensureButton = () => {
    if (button?.isConnected) return;
    const player = doc.getElementById('movie_player');
    const group = player?.querySelector('.ytp-right-controls-left') ?? player?.querySelector('.ytp-right-controls');
    if (!group) return;
    button ??= makeButton(doc, toggle);
    const cc = group.querySelector(':scope > .ytp-subtitles-button');
    group.insertBefore(button, cc ?? group.firstChild);
  };

  const closePanel = () => {
    if (!host && !panel) return;
    panel?.unmount();
    panel = null;
    host?.remove();
    host = null;
    layout = null;
    doc.documentElement.removeAttribute(OPEN_ATTR);
    nudgePlayerResize();
  };

  const openPanel = () => {
    if (!host) {
      host = doc.createElement('div');
      host.id = 'yz-transcript';
      doc.documentElement.setAttribute(OPEN_ATTR, '');
      nudgePlayerResize();
    }
    place();
    if (panel || mounting) return;
    mounting = true;
    import('./mount.jsx')
      .then(({ mountPanel }) => {
        if (!host || panel) return;
        panel = mountPanel(host, {
          source,
          doc,
          ch,
          getVideoId: () => new URLSearchParams(win.location.search).get('v'),
          getVideo: () => doc.querySelector('#movie_player video'),
          onClose: () => {
            writeOpen(false);
            sync();
          },
        });
      })
      .finally(() => {
        mounting = false;
      });
  };

  function sync() {
    if (!enabled) {
      button?.remove();
      closePanel();
      return;
    }
    ensureButton();
    const open = readOpen();
    button?.setAttribute('aria-pressed', String(open));
    if (open) openPanel();
    else closePanel();
  }

  function toggle() {
    writeOpen(!readOpen());
    sync();
  }

  const refreshEnabled = async () => {
    const stored = await new Promise((resolve) => ch.storage.local.get(FLAG, (r) => resolve(r ?? {})));
    const on = stored[FLAG] ?? findFeature(FLAG).default;
    enabled = !!on && !(await isPausedNow(ch));
    sync();
  };

  return {
    id: 'transcript',
    test: (url) => url.pathname === '/watch',
    onEnter: () => {
      void refreshEnabled();
      const onStorage = (changes, area) => {
        if (area === 'local' && FLAG in changes) void refreshEnabled();
      };
      ch.storage.onChanged.addListener(onStorage);
      const disposePause = onPauseChange(() => void refreshEnabled());
      const onLayout = () => enabled && place();
      win.addEventListener('resize', onLayout);
      doc.addEventListener('fullscreenchange', onLayout);
      doc.addEventListener('yt-navigate-finish', onLayout);
      // YouTube re-renders the controls and columns on its own schedule; re-check cheaply.
      const timer = setInterval(() => {
        if (!enabled) return;
        ensureButton();
        place();
      }, TICK_MS);

      return () => {
        clearInterval(timer);
        ch.storage.onChanged.removeListener(onStorage);
        disposePause();
        win.removeEventListener('resize', onLayout);
        doc.removeEventListener('fullscreenchange', onLayout);
        doc.removeEventListener('yt-navigate-finish', onLayout);
        enabled = false;
        button?.remove();
        closePanel();
      };
    },
  };
}
