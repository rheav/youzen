import Toggle from './Toggle';

/**
 * FeatureRow — one sub-feature line inside a Card body or a loose row.
 *
 * Layout:
 *   [ label + optional description ]                        [ Toggle ]
 *   [ optional select / custom extra control below label ]
 *
 * Props:
 *   label         string — main feature name
 *   description   string — optional one-line context
 *   checked       boolean
 *   onToggle      (next: boolean) => void
 *   disabled      boolean — ghosts the row (used when global pause is on)
 *   extra         ReactNode — rendered below the label/description (e.g. a <select>)
 */
export default function FeatureRow({
  label,
  description,
  checked,
  onToggle,
  disabled = false,
  extra,
}) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 6,
        padding: '8px 0',
        opacity: disabled ? 0.5 : 1,
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 10,
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}>
          <span
            style={{
              fontSize: 12,
              fontWeight: 500,
              color: 'var(--text-primary)',
              lineHeight: 1.3,
            }}
          >
            {label}
          </span>
          {description && (
            <span
              style={{
                fontSize: 11,
                color: 'var(--text-muted)',
                lineHeight: 1.3,
              }}
            >
              {description}
            </span>
          )}
        </div>
        <Toggle
          checked={!!checked}
          onChange={(v) => onToggle?.(v)}
          disabled={disabled}
        />
      </div>
      {extra && <div style={{ marginLeft: 0 }}>{extra}</div>}
    </div>
  );
}
