/**
 * Chrome Web Store asset config for youZen.
 *
 * Captures the REAL extension sidepanel (loaded unpacked in Playwright) across
 * the Feeds / Watch / Blocklist tabs, composited into a branded 1280×800 frame.
 * Output → store-assets/youzen.
 *
 * Run from the repo root (after `cd extension && npm run build`):
 *   node ../../tools/store-shots/src/index.mjs store-shots.config.mjs
 *
 * Note: loading an extension needs a headed/--headless=new browser (handled by
 * the runner). Works locally; in CI wrap with `xvfb-run`.
 */

const here = new URL(".", import.meta.url).pathname;

export default {
  brand: {
    name: "youZen",
    bg: "linear-gradient(135deg,#e8efe8 0%,#fdfcf8 46%,#d4e5cd 100%)",
    accent: "#7fa87f",
    ink: "#292524",
    logo: here + "extension/public/icons/icon128.png",
  },

  tagline: "Your YouTube, but softer",
  subtagline: "No tracking · no account · open source",
  icon: here + "extension/public/icons/icon128.png",

  outputs: { dir: "store-assets/youzen", prefix: "youzen", tile: true, marquee: true },

  extension: {
    dist: here + "extension/dist",
    page: "src/sidepanel/index.html",
    viewport: { width: 400, height: 760 },
  },

  shots: [
    {
      id: "feeds",
      type: "extension",
      scale: 2,
      settle: 1000,
      hero: true,
      caption: "Quiet YouTube with a few switches",
      subcaption: "Hide Shorts, the homepage feed, and navigation clutter",
    },
    {
      id: "watch",
      type: "extension",
      scale: 2,
      settle: 1000,
      clicks: ['button:has-text("Watch")'],
      caption: "Calm the watch page",
      subcaption: "Comments, related videos, autoplay — each its own switch",
    },
    {
      id: "blocklist",
      type: "extension",
      scale: 2,
      settle: 1000,
      clicks: ['button:has-text("Blocklist")'],
      caption: "Block keywords and channels",
      subcaption: "Right-click any title on YouTube to hide it for good",
    },
  ],
};
