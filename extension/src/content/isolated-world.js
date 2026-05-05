/**
 * yt-cleanse — ISOLATED world content script entry point.
 *
 * Runs at document_start on YouTube pages. The accompanying youtube.css
 * stylesheet is attached declaratively via the manifest, so visual hiding
 * happens before this script executes.
 *
 * Responsibilities:
 *   • attribute-applier — sets html[data-ytc-*] from storage at document_start
 *     (flicker-free baseline); re-applies on storage change + pause message.
 *   • page-router       — routes URL changes to per-page handlers
 *   • page handlers     — shorts redirect, home quick-links, watch collapse
 *   • blocklist-filter  — marks matching cards with data-ytc-blocked
 */

import { initAttributeApplier } from './modules/attribute-applier.js';
import { createPageRouter } from './modules/page-router.js';
import { initBlocklistFilter } from './modules/blocklist-filter.js';
import { initPauseState } from './modules/pause-state.js';
import { makeShortsHandler } from './pages/shorts.js';
import { makeHomeHandler } from './pages/home.js';
import { makeWatchHandler } from './pages/watch.js';

// 0. Pause singleton — must init before the JS handlers so they can
//    consult it at first-evaluate time.
initPauseState();

// 1. CSS engine: sets the data-ytc-* attrs on <html>.
initAttributeApplier();

// 2. Page router + per-page JS handlers.
const router = createPageRouter([makeShortsHandler(), makeHomeHandler(), makeWatchHandler()]);
router.start();

// 3. Blocklist filter: DOM-level keyword/channel hiding.
initBlocklistFilter();
