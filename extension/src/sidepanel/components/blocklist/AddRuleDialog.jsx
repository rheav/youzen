import { useEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';
import { compileRule } from '@/utils/blocklist-matcher';
import { newRuleId } from '@/utils/rule-id';

const MODES = [
  { value: 'substring', label: 'Substring' },
  { value: 'wholeWord', label: 'Whole word' },
  { value: 'regex', label: 'Regex' },
];

/**
 * AddRuleDialog — inline modal form for adding or editing a blocklist rule.
 *
 * Props:
 *   open       boolean
 *   listLabel  string  — 'Keyword' | 'Channel' (for the heading)
 *   initial    rule | null — when truthy, the dialog is in edit mode
 *   onSave     (rule) => void
 *   onCancel   () => void
 */
export default function AddRuleDialog({
  open,
  listLabel,
  initial,
  onSave,
  onCancel,
}) {
  const isEdit = !!initial;
  const [text, setText] = useState(initial?.text ?? '');
  const [mode, setMode] = useState(initial?.mode ?? 'substring');
  const [caseSensitive, setCaseSensitive] = useState(
    !!initial?.caseSensitive,
  );
  const inputRef = useRef(null);

  // Reset state when reopening the dialog.
  useEffect(() => {
    if (!open) return;
    setText(initial?.text ?? '');
    setMode(initial?.mode ?? 'substring');
    setCaseSensitive(!!initial?.caseSensitive);
    // Focus input on open for faster keyboard flow.
    requestAnimationFrame(() => inputRef.current?.focus());
  }, [open, initial]);

  if (!open) return null;

  const preview = compileRule({ id: 'preview', text, mode, caseSensitive });
  const invalid = mode === 'regex' && text && !preview.valid;
  const canSave = text.trim().length > 0 && !invalid;

  const handleSave = (e) => {
    e?.preventDefault?.();
    if (!canSave) return;
    const rule = {
      id: initial?.id ?? newRuleId(),
      text: text.trim(),
      mode,
      caseSensitive,
    };
    onSave(rule);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`${isEdit ? 'Edit' : 'Add'} ${listLabel}`}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 100,
        background: 'rgba(20, 32, 50, 0.35)',
        backdropFilter: 'blur(3px)',
        WebkitBackdropFilter: 'blur(3px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onCancel?.();
      }}
    >
      <form
        onSubmit={handleSave}
        style={{
          width: '100%',
          maxWidth: 420,
          background: 'var(--bg-primary)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-lg)',
          boxShadow: 'var(--shadow-hover)',
          padding: 16,
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <h3
            style={{
              margin: 0,
              fontSize: 14,
              fontWeight: 600,
              color: 'var(--text-primary)',
              letterSpacing: '-0.01em',
            }}
          >
            {isEdit ? 'Edit' : 'Add'} {listLabel.toLowerCase()} rule
          </h3>
          <button
            type="button"
            onClick={onCancel}
            aria-label="Close"
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              padding: 4,
              display: 'flex',
            }}
          >
            <X size={16} />
          </button>
        </div>

        <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
            Text
          </span>
          <input
            ref={inputRef}
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={
              listLabel === 'Keyword' ? 'e.g. reaction' : 'e.g. RantChannel'
            }
            style={{
              fontFamily: 'inherit',
              fontSize: 13,
              color: 'var(--text-primary)',
              background: 'rgba(255,255,255,0.5)',
              border: `1px solid ${invalid ? 'var(--color-brute-red)' : 'var(--border)'}`,
              borderRadius: 'var(--radius)',
              padding: '8px 10px',
              outline: 'none',
            }}
          />
          {invalid && (
            <span style={{ fontSize: 11, color: 'var(--color-brute-red)' }}>
              Invalid regex: {preview.error}
            </span>
          )}
        </label>

        <fieldset
          style={{
            border: 'none',
            padding: 0,
            margin: 0,
            display: 'flex',
            gap: 6,
          }}
        >
          <legend
            style={{
              fontSize: 11,
              color: 'var(--text-secondary)',
              marginBottom: 6,
            }}
          >
            Match mode
          </legend>
          {MODES.map((m) => (
            <label
              key={m.value}
              style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 4,
                fontSize: 11,
                fontWeight: 500,
                color:
                  mode === m.value
                    ? 'var(--color-accent-from)'
                    : 'var(--text-secondary)',
                padding: '6px 8px',
                background:
                  mode === m.value
                    ? 'rgba(255,77,77,0.08)'
                    : 'rgba(255,255,255,0.4)',
                border: `1px solid ${mode === m.value ? 'rgba(255,77,77,0.5)' : 'var(--border)'}`,
                borderRadius: 'var(--radius)',
                cursor: 'pointer',
                userSelect: 'none',
              }}
            >
              <input
                type="radio"
                name="mode"
                value={m.value}
                checked={mode === m.value}
                onChange={() => setMode(m.value)}
                style={{ display: 'none' }}
              />
              {m.label}
            </label>
          ))}
        </fieldset>

        <label
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            fontSize: 12,
            color: 'var(--text-secondary)',
            cursor: 'pointer',
          }}
        >
          <input
            type="checkbox"
            checked={caseSensitive}
            onChange={(e) => setCaseSensitive(e.target.checked)}
          />
          Case-sensitive
        </label>

        <div
          style={{
            display: 'flex',
            justifyContent: 'flex-end',
            gap: 8,
            marginTop: 4,
          }}
        >
          <button
            type="button"
            onClick={onCancel}
            style={{
              padding: '8px 14px',
              fontSize: 12,
              fontWeight: 500,
              background: 'transparent',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius)',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              fontFamily: 'inherit',
            }}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={!canSave}
            style={{
              padding: '8px 14px',
              fontSize: 12,
              fontWeight: 600,
              background: canSave ? 'var(--color-accent-from)' : 'var(--border)',
              color: canSave ? '#fff' : 'var(--text-muted)',
              border: 'none',
              borderRadius: 'var(--radius)',
              cursor: canSave ? 'pointer' : 'not-allowed',
              fontFamily: 'inherit',
            }}
          >
            {isEdit ? 'Save' : 'Add'}
          </button>
        </div>
      </form>
    </div>
  );
}
