/**
 * Toggle — iOS-style switch with optional indeterminate state.
 *
 * Props:
 *   checked       boolean — on/off
 *   indeterminate boolean — overrides `checked` visually; renders a striped
 *                           track with the thumb at the midpoint. Used for
 *                           master toggles whose subs are mixed.
 *   onChange      (nextValue: boolean) => void
 *                 Convention (spec §3.4): clicking an indeterminate toggle
 *                 calls onChange(true) — "complete the intent" sets all subs on.
 *   label         optional right-aligned label text
 *   disabled      boolean
 */
export default function Toggle({
  checked = false,
  indeterminate = false,
  onChange,
  label,
  disabled = false,
  className = '',
}) {
  const handleClick = () => {
    if (disabled) return;
    // Indeterminate click completes the intent: set all on.
    if (indeterminate) return onChange?.(true);
    onChange?.(!checked);
  };

  // Visual state: indeterminate > checked > unchecked.
  const thumbLeft = indeterminate ? 10 : checked ? 18 : 2;

  const trackBackground = indeterminate
    ? // Diagonal stripes at low alpha over the border token — reads as "mixed".
      'repeating-linear-gradient(45deg, rgba(201,100,66,0.55) 0 4px, rgba(135,134,127,0.35) 4px 8px)'
    : checked
      ? 'var(--accent)'
      : 'var(--border)';

  const ariaChecked = indeterminate ? 'mixed' : checked ? 'true' : 'false';

  return (
    <label
      className={className}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 8,
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.5 : 1,
        userSelect: 'none',
      }}
    >
      <button
        type="button"
        role="switch"
        aria-checked={ariaChecked}
        disabled={disabled}
        onClick={handleClick}
        style={{
          position: 'relative',
          width: 36,
          height: 20,
          borderRadius: 100,
          background: trackBackground,
          border: 'none',
          cursor: 'inherit',
          padding: 0,
          transition: 'background var(--transition)',
          flexShrink: 0,
        }}
      >
        <span
          style={{
            position: 'absolute',
            top: 2,
            left: thumbLeft,
            width: 16,
            height: 16,
            borderRadius: '50%',
            background: '#fff',
            boxShadow: '0 1px 3px rgba(0,0,0,0.15)',
            transition: 'left var(--transition) cubic-bezier(0.34, 1.56, 0.64, 1)',
          }}
        />
      </button>
      {label && <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{label}</span>}
    </label>
  );
}
