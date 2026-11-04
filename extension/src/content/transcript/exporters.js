/**
 * Transcript export and clipboard text — pure functions.
 *
 * `text(i)` returns cue i's text (edits applied); `tr(i)` returns its
 * translation or '' (null when no translation is loaded).
 */

const pad = (n, len = 2) => String(n).padStart(len, '0');

/** `m:ss`, or `h:mm:ss` from one hour. @param {number} seconds */
export function formatTime(seconds) {
  const s = Math.max(0, Math.floor(seconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  return h ? `${h}:${pad(m)}:${pad(s % 60)}` : `${m}:${pad(s % 60)}`;
}

/** `HH:MM:SS<sep>mmm` for SRT (`,`) and VTT (`.`). */
function stamp(seconds, sep) {
  const ms = Math.round(Math.max(0, seconds) * 1000);
  return `${pad(Math.floor(ms / 3_600_000))}:${pad(Math.floor(ms / 60_000) % 60)}:${pad(Math.floor(ms / 1000) % 60)}${sep}${pad(ms % 1000, 3)}`;
}

/** Edit-aware text lookup; edits are keyed by the cue's start in ms. */
export function textOf(cues, edits) {
  return (i) => edits?.[Math.round(cues[i].start * 1000)] ?? cues[i].text;
}

const joinRange = (from, to, get) => {
  const parts = [];
  for (let i = from; i <= to; i++) {
    const t = get(i);
    if (t) parts.push(t);
  }
  return parts.join(' ');
};

/** One paragraph per block, for Copy and TXT export. */
export function buildTxt({ blocks, text, time, tr }) {
  return blocks
    .map((b) => {
      const lines = [];
      if (time) lines.push(formatTime(b.start));
      lines.push(joinRange(b.from, b.to, text));
      const translated = tr ? joinRange(b.from, b.to, tr) : '';
      if (translated) lines.push(translated);
      return lines.join('\n');
    })
    .join('\n\n');
}

function cueList({ cues, text, tr }, sep) {
  return cues
    .map((c, i) => {
      const lines = [`${stamp(c.start, sep)} --> ${stamp(c.end, sep)}`, text(i)];
      const translated = tr?.(i);
      if (translated) lines.push(translated);
      return lines;
    });
}

export function buildSrt(args) {
  return cueList(args, ',')
    .map((lines, i) => `${i + 1}\n${lines.join('\n')}\n`)
    .join('\n');
}

export function buildVtt(args) {
  return `WEBVTT\n\n${cueList(args, '.')
    .map((lines) => `${lines.join('\n')}\n`)
    .join('\n')}`;
}

/** @param {string} title */
export function safeFileName(title) {
  const name = String(title ?? '')
    .replace(/[/\\?%*:|"<>]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  return name || 'transcript';
}
