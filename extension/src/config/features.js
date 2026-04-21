/**
 * yt-cleanse — Feature registry
 *
 * Single source of truth for every declutter/redirect feature in the
 * extension. Both the sidepanel UI and the content-script attribute-applier
 * consume this file.
 *
 * Entries fall into two categories:
 *   • Feature entries  — one boolean toggle, one data-ytc-* attribute, and
 *     (optionally) an extra control (e.g. the home-feed mode select).
 *   • Master entries   — synthetic entries (isMaster: true) that aggregate a
 *     list of sub-feature ids. A master's on/off/indeterminate state is
 *     derived from its subs (see utils/features.js).
 *
 * Adding a feature:
 *   1. Add an entry to FEATURES below (unique id, unique attr).
 *   2. Add a CSS rule to src/styles/youtube.css keyed on html[that-attr].
 *   3. If part of a master, add the id to the master's subs[] array.
 *
 * @see docs/superpowers/specs/2026-04-19-yt-cleanse-design.md §4
 */

/**
 * @typedef {'css' | 'js' | 'hybrid'} FeatureKind
 *   'css'    — pure CSS rule; attribute-applier is the only JS needed.
 *   'js'     — content-script JS; no CSS rule (e.g. redirects).
 *   'hybrid' — both (e.g. home-feed: CSS for empty mode, JS for redirect).
 */

/**
 * @typedef {Object} FeatureExtraSelect
 * @property {'select'} kind
 * @property {string}   key       — storage key for the selected value
 * @property {string}   default   — default option value
 * @property {Array<{value:string,label:string}>} options
 */

/**
 * @typedef {Object} Feature
 * @property {string}      id          — unique id; also the storage key for its boolean flag
 * @property {'feeds'|'watch'} tab
 * @property {string|null} group       — group id (see GROUPS), or null for loose/standalone
 * @property {string}      label
 * @property {string}      [description]
 * @property {string}      attr        — data-ytc-* attribute set on <html>
 * @property {boolean}     default
 * @property {FeatureKind} kind
 * @property {FeatureExtraSelect} [extra]
 */

/**
 * @typedef {Object} Master
 * @property {string}   id
 * @property {'feeds'|'watch'} tab
 * @property {true}     isMaster
 * @property {string}   label
 * @property {string}   [description]
 * @property {string[]} subs          — feature ids; master state derives from these
 */

/**
 * @type {Array<Feature | Master>}
 */
export const FEATURES = [
  // ─── Feeds — Hide Shorts across YouTube ───────────────────────────────
  {
    id: 'hideShorts',
    tab: 'feeds',
    isMaster: true,
    label: 'Hide Shorts across YouTube',
    description: 'Everywhere, every shelf',
    subs: [
      'hideHomeShorts',
      'hideNavShorts',
      'hideChannelShortsTab',
      'hideSearchShorts',
      'hideSubsShorts',
    ],
  },
  {
    id: 'hideHomeShorts',
    tab: 'feeds',
    group: 'hideShorts',
    label: 'Homepage Shorts shelves',
    attr: 'data-ytc-home-shorts',
    default: true,
    kind: 'css',
  },
  {
    id: 'hideNavShorts',
    tab: 'feeds',
    group: 'hideShorts',
    label: 'Left sidebar nav',
    attr: 'data-ytc-nav-shorts',
    default: true,
    kind: 'css',
  },
  {
    id: 'hideChannelShortsTab',
    tab: 'feeds',
    group: 'hideShorts',
    label: 'Channel Shorts tab',
    attr: 'data-ytc-channel-shorts',
    default: true,
    kind: 'css',
  },
  {
    id: 'hideSearchShorts',
    tab: 'feeds',
    group: 'hideShorts',
    label: 'Search results',
    attr: 'data-ytc-search-shorts',
    default: true,
    kind: 'css',
  },
  {
    id: 'hideSubsShorts',
    tab: 'feeds',
    group: 'hideShorts',
    label: 'Subscriptions feed',
    attr: 'data-ytc-subs-shorts',
    default: true,
    kind: 'css',
  },

  // ─── Feeds — Declutter homepage ───────────────────────────────────────
  {
    id: 'declutterHome',
    tab: 'feeds',
    isMaster: true,
    label: 'Declutter homepage',
    description: 'Feed, chips, breaking news',
    subs: ['hideHomeFeed', 'hideChipBar', 'hideBreakingShelves'],
  },
  {
    id: 'hideHomeFeed',
    tab: 'feeds',
    group: 'declutterHome',
    label: 'Hide homepage feed',
    description: 'Choose what shows instead.',
    attr: 'data-ytc-home-feed',
    default: false,
    kind: 'hybrid',
    extra: {
      kind: 'select',
      key: 'hideHomeFeedMode',
      default: 'quickLinks',
      options: [
        { value: 'empty', label: 'Empty' },
        { value: 'quickLinks', label: 'Quick links card' },
        { value: 'redirect', label: 'Redirect to Subscriptions' },
      ],
    },
  },
  {
    id: 'hideChipBar',
    tab: 'feeds',
    group: 'declutterHome',
    label: 'Chip / category bar',
    description: 'All / Music / Gaming / …',
    attr: 'data-ytc-chip-bar',
    default: false,
    kind: 'css',
  },
  {
    id: 'hideBreakingShelves',
    tab: 'feeds',
    group: 'declutterHome',
    label: 'Breaking news & featured shelves',
    attr: 'data-ytc-breaking',
    default: false,
    kind: 'css',
  },

  // ─── Feeds — Declutter search ─────────────────────────────────────────
  {
    id: 'declutterSearch',
    tab: 'feeds',
    isMaster: true,
    label: 'Declutter search',
    description: 'Cut the mixed-in shelves',
    subs: ['hideSearchMixedShelves'],
  },
  {
    id: 'hideSearchMixedShelves',
    tab: 'feeds',
    group: 'declutterSearch',
    label: '"People also watched" & mixed shelves',
    attr: 'data-ytc-search-mixed',
    default: false,
    kind: 'css',
  },

  // ─── Feeds — Navigation chrome (no master) ────────────────────────────
  {
    id: 'hideLeftSidebar',
    tab: 'feeds',
    group: 'navChrome',
    label: 'Hide left sidebar entirely',
    attr: 'data-ytc-left-sidebar',
    default: false,
    kind: 'css',
  },
  {
    id: 'hideNotificationBell',
    tab: 'feeds',
    group: 'navChrome',
    label: 'Hide notification bell',
    attr: 'data-ytc-notif-bell',
    default: false,
    kind: 'css',
  },
  {
    id: 'hideTrending',
    tab: 'feeds',
    group: 'navChrome',
    label: 'Hide trending / explore',
    attr: 'data-ytc-trending',
    default: false,
    kind: 'css',
  },
  {
    id: 'hideCreateButton',
    tab: 'feeds',
    group: 'navChrome',
    label: 'Hide "Create" button in navbar',
    description: 'Top-bar upload / create entry point',
    attr: 'data-ytc-create-button',
    default: true,
    kind: 'css',
  },

  // ─── Watch — Hide comments area ───────────────────────────────────────
  {
    id: 'commentsArea',
    tab: 'watch',
    isMaster: true,
    label: 'Hide comments area',
    description: 'Comments and live chat',
    subs: ['hideComments', 'hideLiveChat'],
  },
  {
    id: 'hideComments',
    tab: 'watch',
    group: 'commentsArea',
    label: 'Comments',
    attr: 'data-ytc-comments',
    default: false,
    kind: 'css',
  },
  {
    id: 'hideLiveChat',
    tab: 'watch',
    group: 'commentsArea',
    label: 'Live chat',
    attr: 'data-ytc-live-chat',
    default: false,
    kind: 'css',
  },

  // ─── Watch — Declutter player surroundings ────────────────────────────
  {
    id: 'declutterWatch',
    tab: 'watch',
    isMaster: true,
    label: 'Declutter player surroundings',
    description: 'Related, end cards, autoplay, merch, actions, description',
    subs: [
      'hideRelatedVideos',
      'hideEndScreenCards',
      'hideAutoplayToggle',
      'hideMerchShelves',
      'hideJoinButton',
      'hideSubscribeBell',
      'hideWatchActions',
      'hideLikeDislike',
      'hideDescription',
    ],
  },
  {
    id: 'hideRelatedVideos',
    tab: 'watch',
    group: 'declutterWatch',
    label: 'Related videos sidebar',
    attr: 'data-ytc-related',
    default: false,
    kind: 'css',
  },
  {
    id: 'hideEndScreenCards',
    tab: 'watch',
    group: 'declutterWatch',
    label: 'End-screen cards',
    attr: 'data-ytc-end-cards',
    default: true,
    kind: 'css',
  },
  {
    id: 'hideAutoplayToggle',
    tab: 'watch',
    group: 'declutterWatch',
    label: 'Up-next autoplay toggle',
    attr: 'data-ytc-autoplay-toggle',
    default: true,
    kind: 'css',
  },
  {
    id: 'hideMerchShelves',
    tab: 'watch',
    group: 'declutterWatch',
    label: 'Merch & ticket shelves',
    attr: 'data-ytc-merch',
    default: true,
    kind: 'css',
  },
  {
    id: 'hideJoinButton',
    tab: 'watch',
    group: 'declutterWatch',
    label: 'Hide "Join" / member button',
    description: 'Channel sponsor / member-perks button',
    attr: 'data-ytc-join-button',
    default: true,
    kind: 'css',
  },
  {
    id: 'hideSubscribeBell',
    tab: 'watch',
    group: 'declutterWatch',
    label: 'Hide notification bell',
    description: 'Bell next to the Subscribe button',
    attr: 'data-ytc-subscribe-bell',
    default: true,
    kind: 'css',
  },
  {
    id: 'hideWatchActions',
    tab: 'watch',
    group: 'declutterWatch',
    label: 'Hide action buttons',
    description: 'Share, Save, Ask — keeps like/dislike',
    attr: 'data-ytc-watch-actions',
    default: true,
    kind: 'css',
  },
  {
    id: 'hideLikeDislike',
    tab: 'watch',
    group: 'declutterWatch',
    label: 'Hide like / dislike',
    attr: 'data-ytc-like-dislike',
    default: true,
    kind: 'css',
  },
  {
    id: 'hideDescription',
    tab: 'watch',
    group: 'declutterWatch',
    label: 'Collapse description by default',
    attr: 'data-ytc-collapse-desc',
    default: false,
    kind: 'hybrid',
  },

  // ─── Watch — Standalone row ───────────────────────────────────────────
  {
    id: 'redirectShorts',
    tab: 'watch',
    group: null,
    label: 'Redirect Shorts to normal video page',
    description: 'Turns /shorts/* into /watch?v=…',
    attr: 'data-ytc-redirect-shorts',
    default: true,
    kind: 'js',
  },
];

/**
 * Groups define which Card contains which features on each tab.
 * Order here drives UI order.
 *
 * @type {Record<'feeds'|'watch', Array<{id: string|null, title: string|null, hasMaster: boolean, loose?: boolean}>>}
 */
export const GROUPS = {
  feeds: [
    { id: 'hideShorts', title: 'Hide Shorts across YouTube', hasMaster: true },
    { id: 'declutterHome', title: 'Declutter homepage', hasMaster: true },
    { id: 'declutterSearch', title: 'Declutter search', hasMaster: true },
    { id: 'navChrome', title: 'Navigation chrome', hasMaster: false },
  ],
  watch: [
    { id: 'commentsArea', title: 'Hide comments area', hasMaster: true },
    { id: 'declutterWatch', title: 'Declutter player surroundings', hasMaster: true },
    // Loose row: standalone features with group: null render below the grouped Cards.
    { id: null, title: null, hasMaster: false, loose: true },
  ],
};

/**
 * Returns the Feature entry (non-master) for a given id, or null.
 * @param {string} id
 * @returns {Feature|null}
 */
export function findFeature(id) {
  const f = FEATURES.find((e) => e.id === id && !e.isMaster);
  return f ?? null;
}

/**
 * Returns the Master entry for a given id, or null.
 * @param {string} id
 * @returns {Master|null}
 */
export function findMaster(id) {
  const m = FEATURES.find((e) => e.id === id && e.isMaster);
  return m ?? null;
}

/**
 * Returns all non-master features that belong to the given tab+group combo.
 * @param {'feeds'|'watch'} tab
 * @param {string|null} groupId
 * @returns {Feature[]}
 */
export function featuresIn(tab, groupId) {
  return FEATURES.filter(
    (f) => !f.isMaster && f.tab === tab && f.group === groupId,
  );
}
