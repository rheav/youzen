import { describe, it, expect } from 'vitest';
import { getMasterState, setMasterState } from '@/utils/features';
import { findMaster } from '@/config/features';

describe('getMasterState', () => {
  it("returns 'on' when every sub is truthy", () => {
    const subs = findMaster('hideShorts').subs;
    const storage = Object.fromEntries(subs.map((id) => [id, true]));
    expect(getMasterState('hideShorts', storage)).toBe('on');
  });

  it("returns 'off' when every sub is falsy or missing", () => {
    expect(getMasterState('hideShorts', {})).toBe('off');

    const subs = findMaster('hideShorts').subs;
    const allFalse = Object.fromEntries(subs.map((id) => [id, false]));
    expect(getMasterState('hideShorts', allFalse)).toBe('off');
  });

  it("returns 'indeterminate' when subs are mixed", () => {
    const subs = findMaster('hideShorts').subs;
    const mixed = Object.fromEntries(subs.map((id, i) => [id, i % 2 === 0]));
    expect(getMasterState('hideShorts', mixed)).toBe('indeterminate');
  });

  it('handles single-sub masters correctly (declutterSearch)', () => {
    expect(getMasterState('declutterSearch', {})).toBe('off');
    expect(
      getMasterState('declutterSearch', { hideSearchMixedShelves: true }),
    ).toBe('on');
  });

  it("treats undefined / null storage as 'off'", () => {
    expect(getMasterState('hideShorts', undefined)).toBe('off');
    expect(getMasterState('hideShorts', null)).toBe('off');
  });

  it('throws for unknown master id', () => {
    expect(() => getMasterState('nope', {})).toThrow(/unknown master/);
  });
});

describe('setMasterState', () => {
  it('produces a patch turning all subs on', () => {
    const patch = setMasterState('hideShorts', true, {});
    const subs = findMaster('hideShorts').subs;
    expect(Object.keys(patch).sort()).toEqual([...subs].sort());
    for (const subId of subs) expect(patch[subId]).toBe(true);
  });

  it('produces a patch turning all subs off', () => {
    const patch = setMasterState('hideShorts', false, {});
    const subs = findMaster('hideShorts').subs;
    for (const subId of subs) expect(patch[subId]).toBe(false);
  });

  it('coerces truthy inputs to strict booleans', () => {
    const patch = setMasterState('commentsArea', 1, {});
    for (const v of Object.values(patch)) {
      expect(typeof v).toBe('boolean');
      expect(v).toBe(true);
    }
  });

  it('coerces null / undefined to false', () => {
    const patch1 = setMasterState('commentsArea', null, {});
    const patch2 = setMasterState('commentsArea', undefined, {});
    for (const v of [...Object.values(patch1), ...Object.values(patch2)]) {
      expect(v).toBe(false);
    }
  });

  it('throws for unknown master id', () => {
    expect(() => setMasterState('nope', true, {})).toThrow(/unknown master/);
  });
});

describe('master-state round-trip', () => {
  it('applying setMasterState(on) to an off storage yields on state', () => {
    const storage = {};
    const patch = setMasterState('hideShorts', true, storage);
    expect(getMasterState('hideShorts', { ...storage, ...patch })).toBe('on');
  });

  it('applying setMasterState(off) to an on storage yields off state', () => {
    const subs = findMaster('hideShorts').subs;
    const storage = Object.fromEntries(subs.map((id) => [id, true]));
    const patch = setMasterState('hideShorts', false, storage);
    expect(getMasterState('hideShorts', { ...storage, ...patch })).toBe('off');
  });

  it('indeterminate click (simulated as setMasterState(true)) resolves to on', () => {
    // Convention from spec §3.4: clicking indeterminate = complete the intent (all on).
    const subs = findMaster('hideShorts').subs;
    const storage = Object.fromEntries(subs.map((id, i) => [id, i % 2 === 0]));
    expect(getMasterState('hideShorts', storage)).toBe('indeterminate');
    const patch = setMasterState('hideShorts', true, storage);
    expect(getMasterState('hideShorts', { ...storage, ...patch })).toBe('on');
  });
});
