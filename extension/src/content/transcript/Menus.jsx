/** Floating menus of the transcript panel (Nord `nv-menu`). */

import { useState } from 'react';
import { Check } from 'lucide-react';
import { findMatches } from './search.js';

export function Menu({ place, label, children }) {
  return (
    <div className={`menu nv-menu ${place}`} role="menu" aria-label={label}>
      {children}
    </div>
  );
}

const Item = ({ checked, onClick, children, hint }) => (
  <button type="button" className="item" role="menuitemradio" aria-checked={!!checked} onClick={onClick}>
    <span className="check">{checked && <Check size={14} />}</span>
    <span>{children}</span>
    {hint && <small>{hint}</small>}
  </button>
);

export function TrackMenu({ tracks, current, onPick }) {
  return (
    <Menu place="top left" label="Caption track">
      {tracks.map((t) => (
        <Item key={t.lang} checked={t.lang === current?.lang} onClick={() => onPick(t)} hint={t.auto ? 'auto' : null}>
          {t.label}
        </Item>
      ))}
    </Menu>
  );
}

export function TranslateMenu({ languages, current, onPick }) {
  const [filter, setFilter] = useState('');
  const shown = filter.trim().length >= 2 ? languages.filter((l) => findMatches(`${l.label} ${l.code}`, filter).length) : languages;
  return (
    <Menu place="top left" label="Translate to">
      <input
        className="filter nv-field"
        placeholder="Find a language"
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
        autoFocus
      />
      <Item checked={!current} onClick={() => onPick(null)}>
        Off
      </Item>
      <hr />
      {shown.map((l) => (
        <Item key={l.code} checked={l.code === current} onClick={() => onPick(l.code)}>
          {l.label}
        </Item>
      ))}
    </Menu>
  );
}

const FORMATS = ['TXT', 'SRT', 'VTT'];

export function ExportMenu({ hasTranslation, defaultTime, onDownload }) {
  const [format, setFormat] = useState('TXT');
  const [time, setTime] = useState(defaultTime);
  const [withTr, setWithTr] = useState(hasTranslation);
  return (
    <Menu place="bottom right" label="Export">
      <p className="label nv-label">Format</p>
      <div className="seg" role="group" aria-label="Format">
        {FORMATS.map((f) => (
          <button key={f} type="button" aria-pressed={f === format} onClick={() => setFormat(f)}>
            {f}
          </button>
        ))}
      </div>
      {format === 'TXT' && (
        <label className="check-row">
          <input type="checkbox" checked={time} onChange={(e) => setTime(e.target.checked)} />
          Timestamps
        </label>
      )}
      {hasTranslation && (
        <label className="check-row">
          <input type="checkbox" checked={withTr} onChange={(e) => setWithTr(e.target.checked)} />
          Include translation
        </label>
      )}
      <button type="button" className="primary" onClick={() => onDownload({ format, time, withTr: hasTranslation && withTr })}>
        Download .{format.toLowerCase()}
      </button>
    </Menu>
  );
}

export function MoreMenu({ hasEdits, onEdit, onUndoAll }) {
  return (
    <Menu place="bottom right" label="More">
      <button type="button" className="item" role="menuitem" onClick={onEdit}>
        <span className="check" />
        Edit transcript
      </button>
      {hasEdits && (
        <button type="button" className="item" role="menuitem" onClick={onUndoAll}>
          <span className="check" />
          Undo all edits
        </button>
      )}
    </Menu>
  );
}
