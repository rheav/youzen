import { useState, useRef, useEffect, useCallback } from 'react';
import { Settings, Moon, Sun } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import Toggle from './Toggle';

export default function OptionsDropdown() {
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef(null);
  const triggerRef = useRef(null);
  const { theme, toggleTheme } = useTheme();

  // Close on outside click
  useEffect(() => {
    if (!open) return;

    const handler = (e) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target) &&
        !triggerRef.current.contains(e.target)
      ) {
        setOpen(false);
      }
    };

    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  // Keyboard navigation
  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Escape') {
      setOpen(false);
      triggerRef.current?.focus();
    }
  }, []);

  return (
    <div style={{ position: 'relative' }}>
      <button
        ref={triggerRef}
        onClick={() => setOpen(!open)}
        aria-haspopup="true"
        aria-expanded={open}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: 30,
          height: 30,
          borderRadius: 'var(--radius-sm)',
          background: open ? 'var(--bg-tertiary)' : 'transparent',
          border: 'none',
          cursor: 'pointer',
          color: 'var(--text-muted)',
          transition: 'all var(--transition-fast)',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = 'var(--bg-tertiary)';
          e.currentTarget.style.color = 'var(--text-secondary)';
        }}
        onMouseLeave={(e) => {
          if (!open) {
            e.currentTarget.style.background = 'transparent';
            e.currentTarget.style.color = 'var(--text-muted)';
          }
        }}
      >
        <Settings size={16} />
      </button>

      {open && (
        <div
          ref={dropdownRef}
          className="animate-slide-down"
          role="menu"
          onKeyDown={handleKeyDown}
          style={{
            position: 'absolute',
            top: '100%',
            right: 0,
            marginTop: 6,
            width: 200,
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius)',
            boxShadow: 'var(--shadow-md)',
            padding: 6,
            zIndex: 200,
          }}
        >
          {/* Theme toggle */}
          <div
            role="menuitem"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '8px 10px',
              borderRadius: 'var(--radius-sm)',
              cursor: 'pointer',
              transition: 'background var(--transition-fast)',
            }}
            onClick={toggleTheme}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'var(--bg-tertiary)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {theme === 'dark' ? (
                <Moon size={14} style={{ color: 'var(--text-muted)' }} />
              ) : (
                <Sun size={14} style={{ color: 'var(--text-muted)' }} />
              )}
              <span style={{ fontSize: 13, color: 'var(--text-primary)' }}>Dark mode</span>
            </div>
            <Toggle checked={theme === 'dark'} onChange={toggleTheme} />
          </div>

          {/* Divider */}
          <div
            style={{
              height: 1,
              background: 'var(--border-subtle)',
              margin: '4px 0',
            }}
          />

          {/* Info */}
          <div
            style={{
              padding: '6px 10px',
              fontSize: 11,
              color: 'var(--text-muted)',
            }}
          >
            youZen v{chrome?.runtime?.getManifest?.()?.version_name ?? chrome?.runtime?.getManifest?.()?.version ?? '1.0.0j'}
          </div>
        </div>
      )}
    </div>
  );
}
