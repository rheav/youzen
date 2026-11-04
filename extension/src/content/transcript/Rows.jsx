/**
 * Transcript rows. A row is a block of cues; each cue is a clickable phrase.
 * The phrase being spoken gets `.say` (yellow). Rows are memoised so a time
 * update only re-renders the rows whose state changed.
 */

import { memo } from 'react';
import { formatTime } from './exporters.js';

const Pieces = ({ pieces, cur }) =>
  pieces.map((p, k) =>
    p.m < 0 ? (
      p.text
    ) : (
      <mark key={k} className={p.m === cur ? 'cur' : undefined} data-m={p.m}>
        {p.text}
      </mark>
    ),
  );

function Phrase({ i, text, say, edited, pieces, cur, editing, onSeek, onCommit, version }) {
  if (editing) {
    return (
      <span
        key={version}
        className={`ph${edited ? ' edited' : ''}`}
        data-i={i}
        contentEditable="plaintext-only"
        suppressContentEditableWarning
        spellCheck
        onFocus={(e) => (e.currentTarget.dataset.before = e.currentTarget.textContent)}
        onBlur={(e) => onCommit(i, e.currentTarget.textContent)}
        onKeyDown={(e) => {
          const el = e.currentTarget;
          if (e.key === 'Enter') {
            e.preventDefault();
            el.blur();
            el.getRootNode().querySelector(`[data-i="${i + 1}"]`)?.focus();
          } else if (e.key === 'Escape') {
            e.preventDefault();
            el.textContent = el.dataset.before ?? text;
            el.blur();
          }
        }}
      >
        {text}
      </span>
    );
  }
  return (
    <span className={`ph${say ? ' say' : ''}${edited ? ' edited' : ''}`} data-i={i} onClick={() => onSeek(i)}>
      {pieces ? <Pieces pieces={pieces} cur={cur} /> : text}
    </span>
  );
}

export const Row = memo(function Row({
  index,
  block,
  phrases,
  say,
  now,
  past,
  showTime,
  translation,
  hits,
  cur,
  editing,
  versions,
  onSeek,
  onCommit,
}) {
  const className = ['row', now && 'now', past && 'past', !showTime && 'no-time'].filter(Boolean).join(' ');
  return (
    <div className={className} data-b={index}>
      {showTime && (
        <span className="t" onClick={() => onSeek(block.from)}>
          {formatTime(block.start)}
        </span>
      )}
      <div>
        <p>
          {phrases.map((ph, k) => (
            <span key={ph.i}>
              {k > 0 && ' '}
              <Phrase
                {...ph}
                say={ph.i === say}
                pieces={hits?.o?.[k] ?? null}
                cur={cur}
                editing={editing}
                version={versions?.[ph.i] ?? 0}
                onSeek={onSeek}
                onCommit={onCommit}
              />
            </span>
          ))}
        </p>
        {translation && (
          <span className="tr">{hits?.t ? <Pieces pieces={hits.t} cur={cur} /> : translation}</span>
        )}
      </div>
    </div>
  );
});
