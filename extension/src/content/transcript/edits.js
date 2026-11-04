/**
 * Inline transcript edits, saved per video + language + track kind in
 * chrome.storage.local. Only the 60 most recently edited tracks are kept.
 *
 * Shape: { [cueStartMs]: 'edited text' }.
 */

export const MAX_EDITED = 60;
const PREFIX = 'transcriptEdits:';
const INDEX_KEY = 'transcriptEditsIndex';

export const editKey = (videoId, lang, kind) => `${PREFIX}${videoId}|${lang}|${kind || ''}`;

const get = (ch, keys) => new Promise((resolve) => ch.storage.local.get(keys, (r) => resolve(r ?? {})));
const set = (ch, items) => new Promise((resolve) => ch.storage.local.set(items, () => resolve()));
const remove = (ch, keys) => new Promise((resolve) => ch.storage.local.remove(keys, () => resolve()));

/** @returns {Promise<Record<string, string>>} */
export async function loadEdits(key, ch = chrome) {
  return (await get(ch, key))[key] ?? {};
}

/** Saves (or, when empty, deletes) one track's edits and prunes old tracks. */
export async function saveEdits(key, edits, ch = chrome, now = Date.now) {
  const index = (await get(ch, INDEX_KEY))[INDEX_KEY] ?? {};
  if (!Object.keys(edits).length) {
    delete index[key];
    await remove(ch, key);
    await set(ch, { [INDEX_KEY]: index });
    return;
  }
  index[key] = now();
  const stale = Object.keys(index)
    .sort((a, b) => index[b] - index[a])
    .slice(MAX_EDITED);
  stale.forEach((k) => delete index[k]);
  await set(ch, { [key]: edits, [INDEX_KEY]: index });
  if (stale.length) await remove(ch, stale);
}
