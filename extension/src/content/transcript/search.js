/**
 * Accent- and case-insensitive transcript search ("cafe" finds "Café").
 * Ranges are [start, end) in the ORIGINAL string, so highlights land on the
 * real characters even when accents are decomposed or emoji are present.
 */

const MARKS = /\p{M}/gu;
const LETTER = /[\p{L}\p{N}]/gu;
const MIN_LETTERS = 2;

/** @param {string} text @returns {{ folded: string, starts: number[], ends: number[] }} */
export function fold(text) {
  let folded = '';
  const starts = [];
  const ends = [];
  let i = 0;
  for (const ch of text) {
    const base = ch.normalize('NFD').replace(MARKS, '').toLowerCase();
    // One map entry per UTF-16 unit, so indexOf on `folded` lines up with the map.
    for (let k = 0; k < base.length; k++) {
      starts.push(i);
      ends.push(i + ch.length);
    }
    folded += base;
    // A bare combining mark folds to nothing; stretch the previous char over it.
    if (!base && ends.length) ends[ends.length - 1] = i + ch.length;
    i += ch.length;
  }
  return { folded, starts, ends };
}

/** @param {string} text @param {string} query @returns {Array<[number, number]>} */
export function findMatches(text, query) {
  const q = String(query ?? '').trim().replace(/\s+/g, ' ');
  if ((q.match(LETTER)?.length ?? 0) < MIN_LETTERS) return [];
  const needle = fold(q).folded;
  const { folded, starts, ends } = fold(text);
  const ranges = [];
  for (let at = folded.indexOf(needle); at !== -1; at = folded.indexOf(needle, at + needle.length)) {
    ranges.push([starts[at], ends[at + needle.length - 1]]);
  }
  return ranges;
}
