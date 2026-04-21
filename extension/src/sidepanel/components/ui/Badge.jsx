const variantStyles = {
  default: { bg: 'var(--bg-tertiary)', color: 'var(--text-secondary)', dot: 'var(--text-muted)' },
  success: { bg: 'var(--success-subtle)', color: 'var(--success)', dot: 'var(--success)' },
  warning: { bg: 'var(--warning-subtle)', color: 'var(--warning)', dot: 'var(--warning)' },
  error: { bg: 'var(--error-subtle)', color: 'var(--error)', dot: 'var(--error)' },
  info: { bg: 'var(--info-subtle)', color: 'var(--info)', dot: 'var(--info)' },
};

const sizeStyles = {
  sm: { fontSize: 10, padding: '1px 6px', dotSize: 5 },
  md: { fontSize: 12, padding: '2px 8px', dotSize: 6 },
};

export default function Badge({
  variant = 'default',
  dot = false,
  size = 'md',
  children,
  className = '',
  style: styleProp = {},
}) {
  const v = variantStyles[variant] || variantStyles.default;
  const s = sizeStyles[size] || sizeStyles.md;

  return (
    <span
      className={className}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        fontSize: s.fontSize,
        fontWeight: 600,
        padding: s.padding,
        borderRadius: 100,
        background: v.bg,
        color: v.color,
        letterSpacing: '0.02em',
        lineHeight: 1.4,
        whiteSpace: 'nowrap',
        ...styleProp,
      }}
    >
      {dot && (
        <span
          className="animate-pulse-dot"
          style={{
            width: s.dotSize,
            height: s.dotSize,
            borderRadius: '50%',
            background: v.dot,
            flexShrink: 0,
          }}
        />
      )}
      {children}
    </span>
  );
}
