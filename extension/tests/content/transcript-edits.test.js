import { describe, it, expect } from 'vitest';
import { editKey, loadEdits, saveEdits, MAX_EDITED } from '../../src/content/transcript/edits.js';

function fakeChrome() {
  const data = {};
  const pick = (keys) => {
    const list = typeof keys === 'string' ? [keys] : keys;
    return Object.fromEntries(list.filter((k) => k in data).map((k) => [k, data[k]]));
  };
  return {
    data,
    storage: {
      local: {
        get: (keys, cb) => cb(pick(keys)),
        set: (items, cb) => {
          Object.assign(data, items);
          cb?.();
        },
        remove: (keys, cb) => {
          (Array.isArray(keys) ? keys : [keys]).forEach((k) => delete data[k]);
          cb?.();
        },
      },
    },
  };
}

describe('transcript edits', () => {
  it('editKey includes video, language and kind', () => {
    expect(editKey('abc', 'en', 'asr')).toBe('transcriptEdits:abc|en|asr');
    expect(editKey('abc', 'pt', null)).toBe('transcriptEdits:abc|pt|');
  });

  it('round-trips edits', async () => {
    const ch = fakeChrome();
    const key = editKey('abc', 'en', 'asr');
    await saveEdits(key, { 1500: 'Fixed' }, ch);
    expect(await loadEdits(key, ch)).toEqual({ 1500: 'Fixed' });
    expect(await loadEdits(editKey('zzz', 'en', ''), ch)).toEqual({});
  });

  it('saveEdits keeps the 60 most recent and removes empty', async () => {
    const ch = fakeChrome();
    let now = 1000;
    for (let i = 0; i < MAX_EDITED + 2; i++) {
      await saveEdits(editKey(`v${i}`, 'en', ''), { 0: `t${i}` }, ch, () => now++);
    }
    expect(MAX_EDITED).toBe(60);
    expect(ch.data[editKey('v0', 'en', '')]).toBeUndefined();
    expect(ch.data[editKey('v1', 'en', '')]).toBeUndefined();
    expect(ch.data[editKey('v2', 'en', '')]).toEqual({ 0: 't2' });
    expect(Object.keys(ch.data.transcriptEditsIndex)).toHaveLength(MAX_EDITED);

    await saveEdits(editKey('v2', 'en', ''), {}, ch, () => now++);
    expect(ch.data[editKey('v2', 'en', '')]).toBeUndefined();
    expect(ch.data.transcriptEditsIndex[editKey('v2', 'en', '')]).toBeUndefined();
  });
});
