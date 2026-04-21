import { Loader2 } from 'lucide-react';

const variants = {
  primary: {
    background: 'var(--accent)',
    color: 'var(--accent-text)',
    border: 'none',
    hover: 'var(--accent-hover)',
  },
  secondary: {
    background: 'var(--bg-secondary)',
    color: 'var(--text-primary)',
    border: '1px solid var(--border)',
    hover: 'var(--bg-tertiary)',
  },
  ghost: {
    background: 'transparent',
    color: 'var(--text-secondary)',
    border: 'none',
    hover: 'var(--bg-tertiary)',
  },
  danger: {
    background: 'var(--error)',
    color: '#fff',
    border: 'none',
    hover: '#dc2626',
  },
};

const sizes = {
  sm: { height: 28, fontSize: 12, padding: '0 10px', iconSize: 13, gap: 5 },
  md: { height: 34, fontSize: 13, padding: '0 14px', iconSize: 15, gap: 6 },
  lg: { height: 40, fontSize: 14, padding: '0 20px', iconSize: 16, gap: 8 },
};

export default function Button({
  variant = 'primary',
  size = 'md',
  icon: Icon,
  loading = false,
  disabled = false,
  fullWidth = false,
  children,
  onClick,
  className = '',
  style: styleProp = {},
  ...rest
}) {
  const v = variants[variant] || variants.primary;
  const s = sizes[size] || sizes.md;
  const isDisabled = disabled || loading;

  return (
    <button
      onClick={onClick}
      disabled={isDisabled}
      className={className}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: s.gap,
        height: s.height,
        fontSize: s.fontSize,
        fontWeight: 500,
        fontFamily: 'inherit',
        padding: s.padding,
        borderRadius: 'var(--radius)',
        background: v.background,
        color: v.color,
        border: v.border,
        cursor: isDisabled ? 'not-allowed' : 'pointer',
        opacity: isDisabled ? 0.5 : 1,
        transition: 'all var(--transition-fast)',
        width: fullWidth ? '100%' : 'auto',
        whiteSpace: 'nowrap',
        letterSpacing: '0.01em',
        ...styleProp,
      }}
      onMouseEnter={(e) => {
        if (!isDisabled) e.currentTarget.style.background = v.hover;
      }}
      onMouseLeave={(e) => {
        if (!isDisabled) e.currentTarget.style.background = v.background;
      }}
      {...rest}
    >
      {loading ? (
        <Loader2 size={s.iconSize} className="animate-spin" />
      ) : Icon ? (
        <Icon size={s.iconSize} />
      ) : null}
      {children && <span>{children}</span>}
    </button>
  );
}
