import { useEffect, useRef } from 'react';
import { Info, CheckCircle, AlertTriangle, XCircle, X } from 'lucide-react';

const typeConfig = {
  info: { icon: Info, bg: 'var(--info-subtle)', border: 'var(--info)', color: 'var(--info)' },
  success: {
    icon: CheckCircle,
    bg: 'var(--success-subtle)',
    border: 'var(--success)',
    color: 'var(--success)',
  },
  warning: {
    icon: AlertTriangle,
    bg: 'var(--warning-subtle)',
    border: 'var(--warning)',
    color: 'var(--warning)',
  },
  error: {
    icon: XCircle,
    bg: 'var(--error-subtle)',
    border: 'var(--error)',
    color: 'var(--error)',
  },
};

export default function StatusMessage({
  type = 'info',
  dismissible = false,
  onDismiss,
  autoTimeout = 0,
  children,
  className = '',
  style: styleProp = {},
}) {
  const timerRef = useRef(null);
  const config = typeConfig[type] || typeConfig.info;
  const Icon = config.icon;

  useEffect(() => {
    if (autoTimeout > 0 && onDismiss) {
      timerRef.current = setTimeout(onDismiss, autoTimeout);
      return () => clearTimeout(timerRef.current);
    }
  }, [autoTimeout, onDismiss]);

  return (
    <div
      className={`animate-slide-up ${className}`}
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: 10,
        padding: '10px 14px',
        borderRadius: 'var(--radius)',
        background: config.bg,
        borderLeft: `3px solid ${config.border}`,
        fontSize: 13,
        lineHeight: 1.5,
        color: 'var(--text-primary)',
        ...styleProp,
      }}
    >
      <Icon
        size={16}
        style={{ color: config.color, flexShrink: 0, marginTop: 2 }}
      />
      <span style={{ flex: 1 }}>{children}</span>
      {dismissible && onDismiss && (
        <button
          onClick={onDismiss}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: 2,
            color: 'var(--text-muted)',
            flexShrink: 0,
          }}
          aria-label="Dismiss"
        >
          <X size={14} />
        </button>
      )}
    </div>
  );
}
