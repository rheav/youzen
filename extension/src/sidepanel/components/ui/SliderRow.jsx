/**
 * SliderRow — a settings line with a label, an optional description, the
 * current value as a percentage, and a range input under them.
 * `onChange` receives a number.
 */
export default function SliderRow({ label, description, value, onChange, min = 0, max = 100, step = 1, disabled = false }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: '8px 0', opacity: disabled ? 0.5 : 1 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-primary)' }}>{label}</span>
          {description && <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{description}</span>}
        </div>
        <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-muted)', fontVariantNumeric: 'tabular-nums' }}>
          {value}%
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        disabled={disabled}
        aria-label={label}
        onChange={(e) => onChange?.(Number(e.target.value))}
        style={{ width: '100%', accentColor: 'var(--accent)', cursor: disabled ? 'not-allowed' : 'pointer' }}
      />
    </div>
  );
}
