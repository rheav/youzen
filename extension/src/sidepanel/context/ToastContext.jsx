import { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react';

const ToastContext = createContext(null);

const ICONS = {
  success: CheckCircle,
  error: XCircle,
  warning: AlertTriangle,
  info: Info,
};

const COLORS = {
  success: { bg: 'var(--success-subtle)', border: 'var(--success)', text: 'var(--success)' },
  error: { bg: 'var(--error-subtle)', border: 'var(--error)', text: 'var(--error)' },
  warning: { bg: 'var(--warning-subtle)', border: 'var(--warning)', text: 'var(--warning)' },
  info: { bg: 'var(--info-subtle)', border: 'var(--info)', text: 'var(--info)' },
};

const MAX_TOASTS = 5;

let toastId = 0;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const timeoutRefs = useRef(new Map());

  // Cleanup all timeouts on unmount. ToastProvider is app-lifetime, so the
  // ref-on-cleanup exhaustive-deps warning doesn't apply here.
  useEffect(() => {
    const refs = timeoutRefs;
    return () => {
      refs.current.forEach((id) => clearTimeout(id));
      refs.current.clear();
    };
  }, []);

  const removeToast = useCallback((id) => {
    // Trigger exit animation
    setToasts((prev) => prev.map((t) => (t.id === id ? { ...t, exiting: true } : t)));

    // Remove after animation
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 200);

    // Clear timeout
    const tid = timeoutRefs.current.get(id);
    if (tid) {
      clearTimeout(tid);
      timeoutRefs.current.delete(id);
    }
  }, []);

  const addToast = useCallback(
    (type, message, duration = 3000) => {
      const id = ++toastId;

      setToasts((prev) => {
        const next = [...prev, { id, type, message, exiting: false }];
        // Cap at MAX_TOASTS — remove oldest
        return next.length > MAX_TOASTS ? next.slice(next.length - MAX_TOASTS) : next;
      });

      if (duration > 0) {
        const tid = setTimeout(() => removeToast(id), duration);
        timeoutRefs.current.set(id, tid);
      }

      return id;
    },
    [removeToast],
  );

  const toast = {
    success: (msg, dur) => addToast('success', msg, dur),
    error: (msg, dur) => addToast('error', msg, dur),
    warning: (msg, dur) => addToast('warning', msg, dur),
    info: (msg, dur) => addToast('info', msg, dur),
  };

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}

      {/* Toast container */}
      <div
        style={{
          position: 'fixed',
          bottom: 16,
          right: 16,
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
          zIndex: 9999,
          pointerEvents: 'none',
          maxWidth: 320,
        }}
      >
        {toasts.map((t) => {
          const Icon = ICONS[t.type];
          const colors = COLORS[t.type];

          return (
            <div
              key={t.id}
              className={t.exiting ? 'animate-toast-exit' : 'animate-toast-enter'}
              style={{
                pointerEvents: 'auto',
                display: 'flex',
                alignItems: 'flex-start',
                gap: 10,
                padding: '10px 14px',
                borderRadius: 'var(--radius)',
                background: colors.bg,
                border: `1px solid ${colors.border}`,
                boxShadow: 'var(--shadow-md)',
                fontSize: 13,
                lineHeight: 1.4,
                color: 'var(--text-primary)',
              }}
            >
              <Icon
                size={16}
                style={{ color: colors.text, flexShrink: 0, marginTop: 1 }}
              />
              <span style={{ flex: 1 }}>{t.message}</span>
              <button
                onClick={() => removeToast(t.id)}
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
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}
