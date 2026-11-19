import { describe, it, expect, beforeEach } from 'vitest';
import { detectLayout, placeHost } from '../../src/content/transcript/placement.js';

const PAGE = `
  <ytd-watch-flexy is-two-columns_>
    <div id="full-bleed-container">
      <div id="player-full-bleed-container"></div>
      <div id="panels-full-bleed-container"></div>
    </div>
    <div id="columns">
      <div id="primary"><div id="primary-inner"><div id="player"></div><div id="below"><div id="meta"></div></div></div></div>
      <div id="secondary"><div id="secondary-inner"><div id="playlist"></div></div></div>
    </div>
  </ytd-watch-flexy>`;

describe('transcript placement', () => {
  let host;
  let flexy;
  beforeEach(() => {
    document.body.innerHTML = PAGE;
    Object.defineProperty(document, 'fullscreenElement', { value: null, configurable: true });
    flexy = document.querySelector('ytd-watch-flexy');
    host = document.createElement('div');
  });

  it('detectLayout reads theater / is-two-columns_', () => {
    expect(detectLayout(flexy)).toBe('columns');
    flexy.setAttribute('theater', '');
    expect(detectLayout(flexy)).toBe('theater');
    flexy.removeAttribute('is-two-columns_');
    expect(detectLayout(flexy)).toBe('single');
  });

  it('placeHost puts the host after #player-full-bleed-container in theater with flex 0 0 400px', () => {
    flexy.setAttribute('theater', '');
    expect(placeHost(host, document)).toBe('theater');
    expect(document.querySelector('#player-full-bleed-container').nextElementSibling).toBe(host);
    expect(host.style.flex).toBe('0 0 400px');
    expect(host.hidden).toBe(false);
  });

  it('placeHost prepends to #secondary-inner in columns', () => {
    expect(placeHost(host, document)).toBe('columns');
    expect(document.querySelector('#secondary-inner').firstElementChild).toBe(host);
    expect(host.style.height).toBe('360px'); // jsdom player height is 0 → minimum
  });

  it('placeHost prepends to #below in single', () => {
    flexy.removeAttribute('is-two-columns_');
    expect(placeHost(host, document)).toBe('single');
    expect(document.querySelector('#below').firstElementChild).toBe(host);
  });

  it('places side-by-side in fullscreen when mode is split (default)', () => {
    flexy.setAttribute('fullscreen', '');
    expect(placeHost(host, document)).toBe('fullscreen-split');
    expect(document.querySelector('#player-full-bleed-container').nextElementSibling).toBe(host);
    expect(host.style.flex).toBe('0 0 400px');
    expect(host.hasAttribute('data-yz-floating')).toBe(false);
    expect(host.hidden).toBe(false);
  });

  it('places floating with data-yz-floating in fullscreen when mode is floating, and clears it on exit', () => {
    Object.defineProperty(document, 'fullscreenElement', { value: flexy, configurable: true });
    expect(placeHost(host, document, 'floating')).toBe('fullscreen-floating');
    expect(document.querySelector('#player-full-bleed-container').nextElementSibling).toBe(host);
    expect(host.style.position).toBe('absolute');
    expect(host.style.width).toBe('400px');
    expect(host.hasAttribute('data-yz-floating')).toBe(true);
    expect(host.hidden).toBe(false);

    Object.defineProperty(document, 'fullscreenElement', { value: null, configurable: true });
    flexy.setAttribute('theater', '');
    expect(placeHost(host, document, 'floating')).toBe('theater');
    expect(host.hasAttribute('data-yz-floating')).toBe(false);
    expect(host.style.flex).toBe('0 0 400px');
  });

  it('hides in fullscreen when mode is off and restores when leaving fullscreen', () => {
    placeHost(host, document, 'off');
    flexy.setAttribute('fullscreen', '');
    expect(placeHost(host, document, 'off')).toBe(null);
    expect(host.hidden).toBe(true);
    flexy.removeAttribute('fullscreen');
    flexy.setAttribute('theater', '');
    expect(placeHost(host, document, 'off')).toBe('theater');
    expect(document.querySelector('#secondary-inner').contains(host)).toBe(false);
    expect(host.hidden).toBe(false);
  });

  it('returns null without a watch page', () => {
    document.body.innerHTML = '';
    expect(placeHost(host, document)).toBe(null);
  });
});
