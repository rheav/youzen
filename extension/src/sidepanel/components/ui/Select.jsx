/**
 * Select — minimal wrapper around a native <select> that matches the
 * yt-cleanse design tokens (glass tile + azure focus ring).
 *
 * Props mirror useState: `value`, `onChange: (next) => void`, `options`.
 */
export default function Select({
  value,
  onChange,
  options,
  disabled = false,
  ariaLabel,
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange?.(e.target.value)}
      disabled={disabled}
      aria-label={ariaLabel}
      style={{
        fontFamily: 'inherit',
        fontSize: 12,
        fontWeight: 500,
        color: 'var(--text-primary)',
        background: 'var(--field-bg)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius)',
        padding: '6px 10px',
        cursor: disabled ? 'not-allowed' : 'pointer',
        outline: 'none',
        transition: 'border-color var(--transition-fast), box-shadow var(--transition-fast)',
      }}
      onFocus={(e) => {
        e.currentTarget.style.borderColor = 'var(--accent)';
        e.currentTarget.style.boxShadow = '0 0 0 3px var(--info-subtle)';
      }}
      onBlur={(e) => {
        e.currentTarget.style.borderColor = 'var(--border)';
        e.currentTarget.style.boxShadow = 'none';
      }}
    >
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  );
}
