/**
 * Integration: youtube.css rules vs. minimal DOM snippets.
 *
 * Each test mounts a hand-crafted HTML snippet modelled on real YouTube
 * markup, injects src/styles/youtube.css, flips the feature's
 * data-ytc-* attribute on <html>, and asserts that the targeted nodes
 * are hidden — and that neighbouring nodes are not.
 *
 * Snippets are intentionally minimal. Full-fidelity fixtures captured
 * from live YouTube will replace them in Phase 7.2 without changing
 * assertions.
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { injectCss, mountSnippet, setAttr, isHidden } from './inject-youtube-css.js';

beforeEach(() => {
  for (const name of [...document.documentElement.getAttributeNames()]) {
    document.documentElement.removeAttribute(name);
  }
  document.documentElement.innerHTML = '<head></head><body></body>';
  injectCss(document);
});

describe('youtube.css — hideJoinButton', () => {
  const snippet = `
    <ytd-video-owner-renderer>
      <a href="/@channel"><yt-img-shadow id="avatar"></yt-img-shadow></a>
      <div id="upload-info"><ytd-channel-name id="channel-name">Channel</ytd-channel-name></div>
      <div id="purchase-button"><button>Buy</button></div>
      <div id="sponsor-button"><button>Join</button></div>
      <div id="analytics-button"></div>
    </ytd-video-owner-renderer>
  `;

  it('default OFF → sponsor button visible', () => {
    mountSnippet(document, snippet);
    expect(isHidden(document.querySelector('#sponsor-button'))).toBe(false);
  });

  it('attr set → #sponsor-button and #purchase-button hidden; avatar/channel name preserved', () => {
    mountSnippet(document, snippet);
    setAttr(document, 'data-ytc-join-button');
    expect(isHidden(document.querySelector('#sponsor-button'))).toBe(true);
    expect(isHidden(document.querySelector('#purchase-button'))).toBe(true);
    expect(isHidden(document.querySelector('#avatar'))).toBe(false);
    expect(isHidden(document.querySelector('#channel-name'))).toBe(false);
  });
});

describe('youtube.css — hideSubscribeBell', () => {
  const snippet = `
    <ytd-subscribe-button-renderer>
      <yt-button-shape id="subscribe-button-shape"><button>Subscribe</button></yt-button-shape>
      <div id="notification-preference-button">
        <ytd-subscription-notification-toggle-button-renderer-next>
          <button aria-label="Notifications"></button>
        </ytd-subscription-notification-toggle-button-renderer-next>
      </div>
    </ytd-subscribe-button-renderer>
  `;

  it('attr set → bell hidden; Subscribe button visible', () => {
    mountSnippet(document, snippet);
    setAttr(document, 'data-ytc-subscribe-bell');
    expect(isHidden(document.querySelector('#notification-preference-button'))).toBe(true);
    expect(isHidden(document.querySelector('#subscribe-button-shape'))).toBe(false);
  });

  it('attr unset → bell visible', () => {
    mountSnippet(document, snippet);
    expect(isHidden(document.querySelector('#notification-preference-button'))).toBe(false);
  });
});

describe('youtube.css — hideCreateButton', () => {
  const snippet = `
    <ytd-masthead>
      <div id="end">
        <ytd-button-renderer id="create-btn">
          <button aria-label="Criar">
            <svg viewBox="0 0 24 24"><path d="M12 3a1 1 0 00-1 1v7H4a1 1 0 000 2h7v7a1 1 0 002 0v-7h7a1 1 0 000-2h-7V4a1 1 0 00-1-1Z"></path></svg>
          </button>
        </ytd-button-renderer>
        <ytd-topbar-menu-button-renderer id="avatar-btn">
          <button aria-label="Account"></button>
        </ytd-topbar-menu-button-renderer>
      </div>
    </ytd-masthead>
  `;

  it('attr set → Create button hidden; avatar button preserved', () => {
    mountSnippet(document, snippet);
    setAttr(document, 'data-ytc-create-button');
    expect(isHidden(document.querySelector('#create-btn'))).toBe(true);
    expect(isHidden(document.querySelector('#avatar-btn'))).toBe(false);
  });

  it('attr unset → Create button visible', () => {
    mountSnippet(document, snippet);
    expect(isHidden(document.querySelector('#create-btn'))).toBe(false);
  });
});

describe('youtube.css — hideWatchActions', () => {
  // Mirrors the live tree: the like cluster now lives *inside*
  // ytd-menu-renderer, alongside Share/Ask/Save and the overflow triggers.
  const snippet = `
    <ytd-watch-metadata>
      <div id="actions-inner">
        <div id="menu">
          <ytd-menu-renderer>
            <div id="top-level-buttons-computed">
              <segmented-like-dislike-button-view-model>
                <like-button-view-model></like-button-view-model>
                <dislike-button-view-model></dislike-button-view-model>
              </segmented-like-dislike-button-view-model>
              <yt-button-view-model id="share"><button>Share</button></yt-button-view-model>
            </div>
            <div id="flexible-item-buttons">
              <yt-button-view-model id="ask"><button>Ask</button></yt-button-view-model>
              <yt-button-view-model id="save"><button>Save</button></yt-button-view-model>
            </div>
            <yt-icon-button id="overflow-icon"><button>More</button></yt-icon-button>
            <yt-button-shape id="overflow-shape"><button>More</button></yt-button-shape>
          </ytd-menu-renderer>
        </div>
      </div>
    </ytd-watch-metadata>
  `;

  it('attr set → Share/Ask/Save/overflow hidden; like/dislike preserved', () => {
    mountSnippet(document, snippet);
    setAttr(document, 'data-ytc-watch-actions');

    expect(isHidden(document.querySelector('#share'))).toBe(true);
    expect(isHidden(document.querySelector('#flexible-item-buttons'))).toBe(true);
    expect(isHidden(document.querySelector('#ask'))).toBe(true);
    expect(isHidden(document.querySelector('#save'))).toBe(true);
    expect(isHidden(document.querySelector('#overflow-icon'))).toBe(true);
    expect(isHidden(document.querySelector('#overflow-shape'))).toBe(true);

    // The whole point of the toggle: like/dislike survive.
    expect(isHidden(document.querySelector('segmented-like-dislike-button-view-model'))).toBe(false);
    expect(isHidden(document.querySelector('like-button-view-model'))).toBe(false);
    expect(isHidden(document.querySelector('dislike-button-view-model'))).toBe(false);
  });

  it('attr unset → every action stays visible', () => {
    mountSnippet(document, snippet);
    expect(isHidden(document.querySelector('#share'))).toBe(false);
    expect(isHidden(document.querySelector('#ask'))).toBe(false);
    expect(isHidden(document.querySelector('segmented-like-dislike-button-view-model'))).toBe(false);
  });
});

describe('youtube.css — hideLikeDislike', () => {
  const snippet = `
    <ytd-watch-metadata>
      <div id="actions-inner">
        <segmented-like-dislike-button-view-model>
          <like-button-view-model></like-button-view-model>
          <dislike-button-view-model></dislike-button-view-model>
        </segmented-like-dislike-button-view-model>
        <yt-flexible-actions-view-model><button>Share</button></yt-flexible-actions-view-model>
      </div>
    </ytd-watch-metadata>
  `;

  it('attr set → like/dislike hidden; Share preserved', () => {
    mountSnippet(document, snippet);
    setAttr(document, 'data-ytc-like-dislike');
    expect(isHidden(document.querySelector('segmented-like-dislike-button-view-model'))).toBe(true);
    expect(isHidden(document.querySelector('yt-flexible-actions-view-model'))).toBe(false);
  });
});

describe('youtube.css — sampler: existing rules still work', () => {
  it('hideNavShorts hides the Shorts sidebar entry', () => {
    mountSnippet(
      document,
      `<ytd-guide-entry-renderer id="shorts-entry">
         <a title="Shorts">Shorts</a>
       </ytd-guide-entry-renderer>
       <ytd-guide-entry-renderer id="home-entry">
         <a title="Home">Home</a>
       </ytd-guide-entry-renderer>`,
    );
    setAttr(document, 'data-ytc-nav-shorts');
    expect(isHidden(document.querySelector('#shorts-entry a'))).toBe(true);
    expect(isHidden(document.querySelector('#home-entry a'))).toBe(false);
  });

  it('hideComments hides the comments section', () => {
    mountSnippet(
      document,
      `<ytd-comments id="comments"><div>Comment</div></ytd-comments>
       <ytd-watch-metadata id="meta"><div>Title</div></ytd-watch-metadata>`,
    );
    setAttr(document, 'data-ytc-comments');
    expect(isHidden(document.querySelector('#comments'))).toBe(true);
    expect(isHidden(document.querySelector('#meta'))).toBe(false);
  });

  it('hideRelatedVideos hides #secondary, widens primary', () => {
    // No [flexy] attribute: YouTube dropped it, and the widening rule has to
    // key on [is-two-columns_] alone or the player never reclaims the width.
    mountSnippet(
      document,
      `<ytd-watch-flexy is-two-columns_ default-two-column-layout>
         <div id="primary" class="ytd-watch-flexy"></div>
         <div id="secondary" class="ytd-watch-flexy"></div>
       </ytd-watch-flexy>`,
    );
    setAttr(document, 'data-ytc-related');
    expect(isHidden(document.querySelector('#secondary'))).toBe(true);
    expect(isHidden(document.querySelector('#primary'))).toBe(false);

    const primary = window.getComputedStyle(document.querySelector('#primary'));
    expect(primary.maxWidth).toBe('none');
    expect(primary.width).toBe('100%');
  });

  it('transcript panel open keeps #secondary and hides only #related', () => {
    mountSnippet(
      document,
      `<ytd-watch-flexy is-two-columns_>
         <div id="primary" class="ytd-watch-flexy"></div>
         <div id="secondary" class="ytd-watch-flexy">
           <div id="secondary-inner"><div id="playlist"></div><div id="related"></div></div>
         </div>
       </ytd-watch-flexy>`,
    );
    setAttr(document, 'data-ytc-related');
    setAttr(document, 'data-yz-transcript-open');
    expect(isHidden(document.querySelector('#secondary'))).toBe(false);
    expect(isHidden(document.querySelector('#playlist'))).toBe(false);
    expect(isHidden(document.querySelector('#related'))).toBe(true);
    expect(window.getComputedStyle(document.querySelector('#primary')).maxWidth).not.toBe('none');
  });
});

describe('youtube.css — Shorts coverage', () => {
  it('hideHomeShorts hides the Shorts rich-shelf on the homepage', () => {
    mountSnippet(
      document,
      `<ytd-rich-shelf-renderer is-shorts id="shorts-shelf"></ytd-rich-shelf-renderer>
       <ytd-reel-shelf-renderer id="reel-shelf"></ytd-reel-shelf-renderer>
       <ytd-rich-shelf-renderer id="other-shelf"></ytd-rich-shelf-renderer>`,
    );
    setAttr(document, 'data-ytc-home-shorts');
    expect(isHidden(document.querySelector('#shorts-shelf'))).toBe(true);
    expect(isHidden(document.querySelector('#reel-shelf'))).toBe(true);
    expect(isHidden(document.querySelector('#other-shelf'))).toBe(false);
  });

  it('hideChannelShortsTab hides the Shorts tab on a channel', () => {
    mountSnippet(
      document,
      `<yt-tab-shape tab-title="Shorts" id="shorts-tab"></yt-tab-shape>
       <yt-tab-shape tab-title="Videos" id="videos-tab"></yt-tab-shape>`,
    );
    setAttr(document, 'data-ytc-channel-shorts');
    expect(isHidden(document.querySelector('#shorts-tab'))).toBe(true);
    expect(isHidden(document.querySelector('#videos-tab'))).toBe(false);
  });

  it('hideSearchShorts hides Shorts reel-shelves on search', () => {
    mountSnippet(
      document,
      `<ytd-reel-shelf-renderer id="reel"></ytd-reel-shelf-renderer>
       <ytd-video-renderer id="shorts-vid"><a href="/shorts/abc"></a></ytd-video-renderer>
       <ytd-video-renderer id="normal-vid"><a href="/watch?v=abc"></a></ytd-video-renderer>`,
    );
    setAttr(document, 'data-ytc-search-shorts');
    expect(isHidden(document.querySelector('#reel'))).toBe(true);
    expect(isHidden(document.querySelector('#shorts-vid'))).toBe(true);
    expect(isHidden(document.querySelector('#normal-vid'))).toBe(false);
  });

  it('hideSubsShorts only affects the Subscriptions page', () => {
    mountSnippet(
      document,
      `<ytd-browse page-subtype="subscriptions">
         <ytd-reel-shelf-renderer id="subs-reel"></ytd-reel-shelf-renderer>
       </ytd-browse>
       <ytd-browse page-subtype="home">
         <ytd-reel-shelf-renderer id="home-reel"></ytd-reel-shelf-renderer>
       </ytd-browse>`,
    );
    setAttr(document, 'data-ytc-subs-shorts');
    expect(isHidden(document.querySelector('#subs-reel'))).toBe(true);
    expect(isHidden(document.querySelector('#home-reel'))).toBe(false);
  });
});

describe('youtube.css — homepage declutter coverage', () => {
  it('hideHomeFeed empty mode hides the main feed container', () => {
    mountSnippet(
      document,
      `<ytd-browse page-subtype="home">
         <div id="header" class="ytd-browse"></div>
         <ytd-two-column-browse-results-renderer id="results"></ytd-two-column-browse-results-renderer>
       </ytd-browse>
       <ytd-browse page-subtype="subscriptions" id="subs-browse">
         <ytd-two-column-browse-results-renderer id="subs-results"></ytd-two-column-browse-results-renderer>
       </ytd-browse>`,
    );
    setAttr(document, 'data-ytc-home-feed');
    setAttr(document, 'data-ytc-home-feed-mode', 'empty');
    expect(isHidden(document.querySelector('#results'))).toBe(true);
    expect(isHidden(document.querySelector('#header'))).toBe(true);
    expect(isHidden(document.querySelector('#subs-results'))).toBe(false);
  });

  it('hideHomeFeed quickLinks mode leaves DOM alone (handled by pages/home.js)', () => {
    mountSnippet(
      document,
      `<ytd-browse page-subtype="home">
         <ytd-two-column-browse-results-renderer id="results"></ytd-two-column-browse-results-renderer>
       </ytd-browse>`,
    );
    setAttr(document, 'data-ytc-home-feed');
    setAttr(document, 'data-ytc-home-feed-mode', 'quickLinks');
    expect(isHidden(document.querySelector('#results'))).toBe(false);
  });

  it('hideChipBar hides the category chip strip', () => {
    mountSnippet(
      document,
      `<ytd-feed-filter-chip-bar-renderer id="chips"></ytd-feed-filter-chip-bar-renderer>
       <div id="other-bar"></div>`,
    );
    setAttr(document, 'data-ytc-chip-bar');
    expect(isHidden(document.querySelector('#chips'))).toBe(true);
    expect(isHidden(document.querySelector('#other-bar'))).toBe(false);
  });

  it('hideBreakingShelves hides breaking-news shelves', () => {
    mountSnippet(
      document,
      `<ytd-rich-shelf-renderer is-breaking-news id="breaking"></ytd-rich-shelf-renderer>
       <ytd-rich-shelf-renderer id="normal"></ytd-rich-shelf-renderer>`,
    );
    setAttr(document, 'data-ytc-breaking');
    expect(isHidden(document.querySelector('#breaking'))).toBe(true);
    expect(isHidden(document.querySelector('#normal'))).toBe(false);
  });

  it('hideSearchMixedShelves hides "People also watched" shelves', () => {
    mountSnippet(
      document,
      `<ytd-shelf-renderer id="shelf"></ytd-shelf-renderer>
       <ytd-horizontal-card-list-renderer id="cards"></ytd-horizontal-card-list-renderer>
       <ytd-video-renderer id="video"></ytd-video-renderer>`,
    );
    setAttr(document, 'data-ytc-search-mixed');
    expect(isHidden(document.querySelector('#shelf'))).toBe(true);
    expect(isHidden(document.querySelector('#cards'))).toBe(true);
    expect(isHidden(document.querySelector('#video'))).toBe(false);
  });
});

describe('youtube.css — nav chrome coverage', () => {
  it('hideLeftSidebar hides the mini-guide and drawer', () => {
    mountSnippet(
      document,
      `<ytd-mini-guide-renderer id="mini"></ytd-mini-guide-renderer>
       <tp-yt-app-drawer id="guide"></tp-yt-app-drawer>
       <ytd-page-manager id="pm"></ytd-page-manager>`,
    );
    setAttr(document, 'data-ytc-left-sidebar');
    expect(isHidden(document.querySelector('#mini'))).toBe(true);
    expect(isHidden(document.querySelector('#guide'))).toBe(true);
    expect(isHidden(document.querySelector('#pm'))).toBe(false);
  });

  it('hideNotificationBell hides the masthead bell', () => {
    mountSnippet(
      document,
      `<ytd-notification-topbar-button-renderer id="bell"></ytd-notification-topbar-button-renderer>
       <div id="search"></div>`,
    );
    setAttr(document, 'data-ytc-notif-bell');
    expect(isHidden(document.querySelector('#bell'))).toBe(true);
    expect(isHidden(document.querySelector('#search'))).toBe(false);
  });

  it('hideTrending hides Trending/Explore sidebar entries', () => {
    mountSnippet(
      document,
      `<ytd-guide-entry-renderer id="trending"><a href="/feed/trending" title="Trending"></a></ytd-guide-entry-renderer>
       <ytd-guide-entry-renderer id="explore"><a href="/feed/explore" title="Explore"></a></ytd-guide-entry-renderer>
       <ytd-guide-entry-renderer id="home"><a href="/" title="Home"></a></ytd-guide-entry-renderer>`,
    );
    setAttr(document, 'data-ytc-trending');
    expect(isHidden(document.querySelector('#trending'))).toBe(true);
    expect(isHidden(document.querySelector('#explore'))).toBe(true);
    expect(isHidden(document.querySelector('#home'))).toBe(false);
  });

  it('hideTrending works with localized labels (href-keyed, not title-keyed)', () => {
    mountSnippet(
      document,
      `<ytd-guide-entry-renderer id="trending"><a href="/feed/trending" title="Em alta"></a></ytd-guide-entry-renderer>
       <ytd-guide-entry-renderer id="explore"><a href="/feed/explore" title="Explorar"></a></ytd-guide-entry-renderer>
       <ytd-mini-guide-entry-renderer id="mini-trending"><a href="/feed/trending"></a></ytd-mini-guide-entry-renderer>
       <ytd-guide-entry-renderer id="subs"><a href="/feed/subscriptions" title="Inscrições"></a></ytd-guide-entry-renderer>`,
    );
    setAttr(document, 'data-ytc-trending');
    expect(isHidden(document.querySelector('#trending'))).toBe(true);
    expect(isHidden(document.querySelector('#explore'))).toBe(true);
    expect(isHidden(document.querySelector('#mini-trending'))).toBe(true);
    expect(isHidden(document.querySelector('#subs'))).toBe(false);
  });
});

describe('youtube.css — watch declutter coverage', () => {
  it('hideLiveChat hides the live chat frame', () => {
    mountSnippet(
      document,
      `<ytd-live-chat-frame id="chat-frame"></ytd-live-chat-frame>
       <div id="other"></div>`,
    );
    setAttr(document, 'data-ytc-live-chat');
    expect(isHidden(document.querySelector('#chat-frame'))).toBe(true);
    expect(isHidden(document.querySelector('#other'))).toBe(false);
  });

  // In theater mode the chat sits in #panels-full-bleed-container, a flex
  // sibling of the player. Hiding only the chat leaves that column laid out
  // and empty — the black band beside the video.
  const theaterSnippet = (panelsInner = '') => `
    <ytd-watch-flexy theater>
      <div id="full-bleed-container">
        <div id="player-full-bleed-container"></div>
        <div id="panels-full-bleed-container">
          <div id="chat-container"><ytd-live-chat-frame></ytd-live-chat-frame></div>
          ${panelsInner}
        </div>
      </div>
    </ytd-watch-flexy>`;

  it('hideLiveChat collapses the theater panel column so the player fills the row', () => {
    mountSnippet(document, theaterSnippet());
    setAttr(document, 'data-ytc-live-chat');

    expect(isHidden(document.querySelector('#panels-full-bleed-container'))).toBe(true);
    expect(isHidden(document.querySelector('#player-full-bleed-container'))).toBe(false);

    const player = window.getComputedStyle(document.querySelector('#player-full-bleed-container'));
    expect(player.width).toBe('100%');
    expect(player.maxWidth).toBe('none');
  });

  it('hideLiveChat keeps the theater panel column when another panel is expanded', () => {
    mountSnippet(
      document,
      theaterSnippet(
        `<ytd-engagement-panel-section-list-renderer
           id="transcript"
           visibility="ENGAGEMENT_PANEL_VISIBILITY_EXPANDED"
         ></ytd-engagement-panel-section-list-renderer>`,
      ),
    );
    setAttr(document, 'data-ytc-live-chat');

    expect(isHidden(document.querySelector('#panels-full-bleed-container'))).toBe(false);
    expect(isHidden(document.querySelector('#transcript'))).toBe(false);
    // The chat itself is still gone.
    expect(isHidden(document.querySelector('#chat-container'))).toBe(true);
  });

  it('hideLiveChat leaves the theater column alone when the feature is off', () => {
    mountSnippet(document, theaterSnippet());
    expect(isHidden(document.querySelector('#panels-full-bleed-container'))).toBe(false);
    expect(isHidden(document.querySelector('#chat-container'))).toBe(false);
  });

  it('hideEndScreenCards hides end-screen overlays', () => {
    mountSnippet(
      document,
      `<div class="ytp-ce-element" id="ce"></div>
       <div class="ytp-endscreen-content" id="es"></div>
       <div class="ytp-cards-teaser" id="teaser"></div>
       <div class="ytp-chrome-bottom" id="chrome"></div>`,
    );
    setAttr(document, 'data-ytc-end-cards');
    expect(isHidden(document.querySelector('#ce'))).toBe(true);
    expect(isHidden(document.querySelector('#es'))).toBe(true);
    expect(isHidden(document.querySelector('#teaser'))).toBe(true);
    expect(isHidden(document.querySelector('#chrome'))).toBe(false);
  });

  it('hideEndScreenCards hides the delhi-player end-of-video grid', () => {
    mountSnippet(
      document,
      `<div class="html5-video-player ended-mode" id="player">
         <div class="ytp-fullscreen-grid" id="grid"></div>
         <div class="ytp-chrome-bottom" id="chrome"></div>
       </div>`,
    );
    setAttr(document, 'data-ytc-end-cards');
    expect(isHidden(document.querySelector('#grid'))).toBe(true);
    expect(isHidden(document.querySelector('#chrome'))).toBe(false);
  });

  it('hideEndScreenCards leaves the fullscreen browse grid alone mid-playback', () => {
    mountSnippet(
      document,
      `<div class="html5-video-player playing-mode" id="player">
         <div class="ytp-fullscreen-grid" id="grid"></div>
       </div>`,
    );
    setAttr(document, 'data-ytc-end-cards');
    expect(isHidden(document.querySelector('#grid'))).toBe(false);
  });

  it('hideAutoplayToggle hides the autonav toggle', () => {
    mountSnippet(
      document,
      `<div class="ytp-autonav-toggle-button-container" id="autonav"></div>
       <ytd-compact-autoplay-renderer id="compact"></ytd-compact-autoplay-renderer>
       <div id="volume" class="ytp-volume-panel"></div>`,
    );
    setAttr(document, 'data-ytc-autoplay-toggle');
    expect(isHidden(document.querySelector('#autonav'))).toBe(true);
    expect(isHidden(document.querySelector('#compact'))).toBe(true);
    expect(isHidden(document.querySelector('#volume'))).toBe(false);
  });

  it('hideMerchShelves hides merch and ticket shelves', () => {
    mountSnippet(
      document,
      `<ytd-merch-shelf-renderer id="merch"></ytd-merch-shelf-renderer>
       <ytd-ticket-shelf-renderer id="ticket"></ytd-ticket-shelf-renderer>
       <ytd-product-list-item-renderer id="product"></ytd-product-list-item-renderer>
       <ytd-rich-shelf-renderer id="normal"></ytd-rich-shelf-renderer>`,
    );
    setAttr(document, 'data-ytc-merch');
    expect(isHidden(document.querySelector('#merch'))).toBe(true);
    expect(isHidden(document.querySelector('#ticket'))).toBe(true);
    expect(isHidden(document.querySelector('#product'))).toBe(true);
    expect(isHidden(document.querySelector('#normal'))).toBe(false);
  });

  it('hideDescription clamps the non-expanded expander', () => {
    mountSnippet(
      document,
      `<ytd-watch-metadata>
         <ytd-text-inline-expander id="collapsed"><div>desc</div></ytd-text-inline-expander>
       </ytd-watch-metadata>
       <ytd-watch-metadata>
         <ytd-text-inline-expander is-expanded id="expanded"><div>desc</div></ytd-text-inline-expander>
       </ytd-watch-metadata>`,
    );
    setAttr(document, 'data-ytc-collapse-desc');
    const collapsed = document.querySelector('#collapsed');
    const expanded = document.querySelector('#expanded');
    const cs = document.defaultView.getComputedStyle(collapsed);
    expect(cs.maxHeight).toBe('48px');
    expect(cs.overflow).toBe('hidden');
    const csExp = document.defaultView.getComputedStyle(expanded);
    expect(csExp.maxHeight).not.toBe('48px');
  });
});

describe('youtube.css — blocklist marker', () => {
  it('[data-ytc-blocked] hides a matched card', () => {
    mountSnippet(
      document,
      `<ytd-rich-item-renderer data-ytc-blocked id="blocked"></ytd-rich-item-renderer>
       <ytd-rich-item-renderer id="kept"></ytd-rich-item-renderer>`,
    );
    expect(isHidden(document.querySelector('#blocked'))).toBe(true);
    expect(isHidden(document.querySelector('#kept'))).toBe(false);
  });
});
