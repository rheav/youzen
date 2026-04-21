import { useCallback, useState, useRef, useEffect } from 'react';
import { Copy, Check } from 'lucide-react';

/**
 * GlassTile — translucent data chip (design spec §5.4).
 *
 * Lives in a 3-up grid (grid-cols-3 gap-2) in the caller's layout.
 * Content: [icon 14px pink stroke-1.25] + [label 11px] on a header row,
 *          [value 12px azure font-medium] below.
 *
 * If `copyValue` is provided (defaults to `value`), the tile exposes a
 * Copy icon in the top-right that flashes a green Check for 1200ms after
 * a successful copy.
 *
 * Props:
 *   icon        Lucide-style icon component (required)
 *   label       string — short name for the chip (required)
 *   value       string | number — value to display
 *   copyValue   string | null — text copied on click; defaults to `value`. Pass
 *               null to disable the copy affordance (pure-display chip).
 *   onClick     optional click handler; called BEFORE copy happens
 */
export default function GlassTile({
  icon: Icon,
  label,
  value,
  copyValue,
  onClick,
}) {
  const [copied, setCopied] = useState(false);
  const timerRef = useRef(null);
  const canCopy = copyValue !== null;
  const effectiveCopyText = copyValue ?? String(value ?? '');

  useEffect(
    () => () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    },
    [],
  );

  const handleClick = useCallback(async () => {
    onClick?.();
    if (!canCopy || !effectiveCopyText) return;
    try {
      await navigator.clipboard.writeText(effectiveCopyText);
      setCopied(true);
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => setCopied(false), 1200);
    } catch {
      // Clipboard blocked — silently no-op.
    }
  }, [onClick, canCopy, effectiveCopyText]);

  return (
    <button
      type="button"
      className="group"
      onClick={handleClick}
      aria-label={canCopy ? `Copy ${label}` : label}
      style={{
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        gap: 4,
        padding: 8,
        borderRadius: 'var(--radius)',
        background: 'rgba(255, 255, 255, 0.4)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        border: '1px solid var(--border)',
        boxShadow: 'var(--shadow-sm)',
        cursor: canCopy ? 'pointer' : 'default',
        fontFamily: 'inherit',
        textAlign: 'left',
        transition:
          'background var(--transition-fast), border-color var(--transition-fast), box-shadow var(--transition-fast)',
      }}
      onMouseEnter={(e) => {
        if (!canCopy) return;
        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.7)';
        e.currentTarget.style.borderColor = 'rgba(3, 102, 214, 0.5)';
        e.currentTarget.style.boxShadow = '0 4px 12px rgba(3, 102, 214, 0.2)';
      }}
      onMouseLeave={(e) => {
        if (!canCopy) return;
        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.4)';
        e.currentTarget.style.borderColor = 'var(--border)';
        e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
      }}
    >
      {/* Header row: icon + label */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        {Icon && (
          <Icon
            size={14}
            strokeWidth={1.25}
            color="var(--color-accent-from)"
            aria-hidden="true"
          />
        )}
        <span
          style={{
            fontSize: 11,
            fontWeight: 500,
            color: 'var(--text-primary)',
            letterSpacing: '0.01em',
          }}
        >
          {label}
        </span>
      </div>

      {/* Value centered below */}
      <span
        style={{
          fontSize: 12,
          fontWeight: 600,
          color: 'var(--color-accent-to)',
          letterSpacing: '0.01em',
          textAlign: 'center',
        }}
      >
        {value}
      </span>

      {/* Copy affordance (top-right) */}
      {canCopy && (
        <span
          aria-hidden="true"
          className={copied ? undefined : 'glass-tile-copy'}
          style={{
            position: 'absolute',
            top: 6,
            right: 6,
            opacity: copied ? 1 : 0,
            transition: 'opacity var(--transition-fast)',
            color: copied ? 'var(--success)' : 'var(--text-muted)',
          }}
        >
          {copied ? <Check size={12} /> : <Copy size={12} />}
        </span>
      )}

      {/* Inline style for group-hover to reveal Copy icon.
          A tiny local rule beats dragging in a Tailwind plugin. */}
      <style>
        {`
          .group:hover .glass-tile-copy { opacity: 0.6 !important; }
        `}
      </style>
    </button>
  );
}
