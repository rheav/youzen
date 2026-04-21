import { describe, it, expect } from 'vitest';
import {
  FEATURES,
  GROUPS,
  findFeature,
  findMaster,
  featuresIn,
} from '@/config/features';

describe('config/features — integrity', () => {
  it('all entries have an id and tab', () => {
    for (const e of FEATURES) {
      expect(typeof e.id).toBe('string');
      expect(e.id.length).toBeGreaterThan(0);
      expect(['feeds', 'watch']).toContain(e.tab);
    }
  });

  it('feature IDs are unique across the whole FEATURES array', () => {
    const ids = FEATURES.map((e) => e.id);
    const uniq = new Set(ids);
    expect(uniq.size).toBe(ids.length);
  });

  it('every non-master feature has a unique data-ytc-* attribute', () => {
    const features = FEATURES.filter((e) => !e.isMaster);
    const attrs = features.map((f) => f.attr);
    const uniq = new Set(attrs);
    expect(uniq.size).toBe(attrs.length);
    for (const attr of attrs) {
      expect(attr).toMatch(/^data-ytc-[a-z0-9-]+$/);
    }
  });

  it('every non-master feature has a boolean default and a valid kind', () => {
    for (const f of FEATURES.filter((e) => !e.isMaster)) {
      expect(typeof f.default).toBe('boolean');
      expect(['css', 'js', 'hybrid']).toContain(f.kind);
    }
  });

  it('every master references only existing feature IDs as subs', () => {
    const featureIds = new Set(
      FEATURES.filter((e) => !e.isMaster).map((f) => f.id),
    );
    for (const m of FEATURES.filter((e) => e.isMaster)) {
      expect(Array.isArray(m.subs)).toBe(true);
      expect(m.subs.length).toBeGreaterThan(0);
      for (const subId of m.subs) {
        expect(
          featureIds.has(subId),
          `master ${m.id} references missing sub '${subId}'`,
        ).toBe(true);
      }
    }
  });

  it('every master sub shares its master.tab', () => {
    for (const m of FEATURES.filter((e) => e.isMaster)) {
      for (const subId of m.subs) {
        const sub = findFeature(subId);
        expect(sub, `sub ${subId} must exist`).not.toBeNull();
        expect(
          sub.tab,
          `sub ${subId}.tab=${sub.tab} must equal master ${m.id}.tab=${m.tab}`,
        ).toBe(m.tab);
      }
    }
  });

  it('every master sub declares group === master.id', () => {
    for (const m of FEATURES.filter((e) => e.isMaster)) {
      for (const subId of m.subs) {
        const sub = findFeature(subId);
        expect(sub.group).toBe(m.id);
      }
    }
  });
});

describe('config/features — groups', () => {
  it('GROUPS has feeds and watch tabs', () => {
    expect(GROUPS).toHaveProperty('feeds');
    expect(GROUPS).toHaveProperty('watch');
    expect(Array.isArray(GROUPS.feeds)).toBe(true);
    expect(Array.isArray(GROUPS.watch)).toBe(true);
  });

  it('every non-master feature belongs to a declared group on its tab', () => {
    for (const f of FEATURES.filter((e) => !e.isMaster)) {
      const declaredGroupIds = new Set(GROUPS[f.tab].map((g) => g.id));
      expect(
        declaredGroupIds.has(f.group),
        `feature ${f.id} (tab=${f.tab}) has group '${f.group}' not in GROUPS.${f.tab}`,
      ).toBe(true);
    }
  });

  it('every master-style group has a master FEATURES entry with the same id and tab', () => {
    for (const tab of ['feeds', 'watch']) {
      for (const g of GROUPS[tab]) {
        if (!g.hasMaster || g.id === null) continue;
        const master = findMaster(g.id);
        expect(master, `group ${g.id} claims hasMaster but no master entry exists`).not.toBeNull();
        expect(master.tab).toBe(tab);
      }
    }
  });

  it('featuresIn returns the right features for each (tab, group)', () => {
    const hs = featuresIn('feeds', 'hideShorts').map((f) => f.id);
    expect(hs).toEqual([
      'hideHomeShorts',
      'hideNavShorts',
      'hideChannelShortsTab',
      'hideSearchShorts',
      'hideSubsShorts',
    ]);

    const loose = featuresIn('watch', null).map((f) => f.id);
    expect(loose).toEqual(['redirectShorts']);
  });
});

describe('config/features — expected feature set', () => {
  it('has exactly 25 non-master feature entries', () => {
    const count = FEATURES.filter((e) => !e.isMaster).length;
    expect(count).toBe(25);
  });

  it('has exactly 5 master entries (spec §4.3)', () => {
    const count = FEATURES.filter((e) => e.isMaster).length;
    expect(count).toBe(5);
  });

  it('hideHomeFeed has a select extra with three options', () => {
    const f = findFeature('hideHomeFeed');
    expect(f).not.toBeNull();
    expect(f.extra).toBeTruthy();
    expect(f.extra.kind).toBe('select');
    expect(f.extra.key).toBe('hideHomeFeedMode');
    expect(f.extra.default).toBe('quickLinks');
    const values = f.extra.options.map((o) => o.value);
    expect(values).toEqual(['empty', 'quickLinks', 'redirect']);
  });

  it('redirectShorts is JS-kind, default ON, group null', () => {
    const f = findFeature('redirectShorts');
    expect(f.kind).toBe('js');
    expect(f.default).toBe(true);
    expect(f.group).toBe(null);
    expect(f.tab).toBe('watch');
  });

  it('default-ON features match the spec §2.1 list', () => {
    const defaultOn = FEATURES.filter((e) => !e.isMaster && e.default === true)
      .map((f) => f.id)
      .sort();
    expect(defaultOn).toEqual(
      [
        'hideAutoplayToggle',
        'hideChannelShortsTab',
        'hideCreateButton',
        'hideEndScreenCards',
        'hideHomeShorts',
        'hideJoinButton',
        'hideLikeDislike',
        'hideMerchShelves',
        'hideNavShorts',
        'hideSearchShorts',
        'hideSubscribeBell',
        'hideSubsShorts',
        'hideWatchActions',
        'redirectShorts',
      ].sort(),
    );
  });
});
