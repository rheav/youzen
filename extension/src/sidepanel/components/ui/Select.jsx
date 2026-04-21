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
        background: 'rgba(255, 255, 255, 0.5)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius)',
        padding: '6px 10px',
        cursor: disabled ? 'not-allowed' : 'pointer',
        outline: 'none',
        transition: 'border-color var(--transition-fast), box-shadow var(--transition-fast)',
      }}
      onFocus={(e) => {
        e.currentTarget.style.borderColor = 'rgba(3, 102, 214, 0.6)';
        e.currentTarget.style.boxShadow = '0 0 0 2px rgba(3, 102, 214, 0.15)';
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
