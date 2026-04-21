import { describe, it, expect, beforeEach } from 'vitest';
import { buildQuickLinksCard, reconcileHomeDom } from '@/content/pages/home';

beforeEach(() => {
  document.body.innerHTML = '';
});

describe('buildQuickLinksCard', () => {
  it('returns an element with the canonical id and 4 link anchors', () => {
    const el = buildQuickLinksCard(document);
    expect(el.id).toBe('ytc-home-quicklinks');
    expect(el.getAttribute('role')).toBe('navigation');
    const links = el.querySelectorAll('a');
    expect(links).toHaveLength(4);
    const hrefs = Array.from(links).map((a) => a.getAttribute('href'));
    expect(hrefs).toContain('/feed/subscriptions');
    expect(hrefs).toContain('/feed/history');
    expect(hrefs).toContain('/feed/playlists');
    expect(hrefs).toContain('/playlist?list=WL');
  });
});

describe('reconcileHomeDom', () => {
  it('inserts the card into the home browse mount when enabled + quickLinks mode', () => {
    const browse = document.createElement('ytd-browse');
    browse.setAttribute('page-subtype', 'home');
    const primary = document.createElement('div');
    primary.id = 'primary';
    browse.appendChild(primary);
    document.body.appendChild(browse);

    reconcileHomeDom(document, { enabled: true, mode: 'quickLinks' });

    const card = document.getElementById('ytc-home-quicklinks');
    expect(card).not.toBeNull();
    expect(primary.contains(card)).toBe(true);
  });

  it('does nothing when disabled', () => {
    const browse = document.createElement('ytd-browse');
    browse.setAttribute('page-subtype', 'home');
    document.body.appendChild(browse);
    reconcileHomeDom(document, { enabled: false, mode: 'quickLinks' });
    expect(document.getElementById('ytc-home-quicklinks')).toBeNull();
  });

  it('removes a previously-inserted card when mode changes away from quickLinks', () => {
    const browse = document.createElement('ytd-browse');
    browse.setAttribute('page-subtype', 'home');
    const primary = document.createElement('div');
    primary.id = 'primary';
    browse.appendChild(primary);
    document.body.appendChild(browse);

    reconcileHomeDom(document, { enabled: true, mode: 'quickLinks' });
    expect(document.getElementById('ytc-home-quicklinks')).not.toBeNull();

    reconcileHomeDom(document, { enabled: true, mode: 'empty' });
    expect(document.getElementById('ytc-home-quicklinks')).toBeNull();
  });

  it('is idempotent — calling twice with the same params does not duplicate', () => {
    const browse = document.createElement('ytd-browse');
    browse.setAttribute('page-subtype', 'home');
    document.body.appendChild(browse);
    reconcileHomeDom(document, { enabled: true, mode: 'quickLinks' });
    reconcileHomeDom(document, { enabled: true, mode: 'quickLinks' });
    const all = document.querySelectorAll('#ytc-home-quicklinks');
    expect(all.length).toBe(1);
  });

  it('falls back to document.body when no ytd-browse exists yet', () => {
    reconcileHomeDom(document, { enabled: true, mode: 'quickLinks' });
    const card = document.getElementById('ytc-home-quicklinks');
    expect(card).not.toBeNull();
    expect(document.body.contains(card)).toBe(true);
  });
});
