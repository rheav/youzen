import { useRef, useEffect } from 'react';

/**
 * TabNav — horizontal scroll-snap segmented control.
 *
 * Per design-extension.md §5.2:
 *   • Tabs share one segmented-control row (rounded only on first and last).
 *   • Labels wear code-bracket ornaments: `<{label} />`.
 *   • Active tab renders the label in the vision gradient + azure border/shadow.
 *   • The container scroll-snaps horizontally and auto-centers the active tab.
 *
 * Props:
 *   tabs    Array<{ id: string, label: string }>
 *   active  id of the currently-active tab
 *   onChange(id) called when a tab is clicked
 */
export default function TabNav({ tabs = [], active, onChange }) {
  const containerRef = useRef(null);
  const tabRefs = useRef({});

  // Auto-center the active tab in the scroll container.
  useEffect(() => {
    const el = tabRefs.current[active];
    if (!el) return;
    el.scrollIntoView({ inline: 'center', block: 'nearest', behavior: 'smooth' });
  }, [active]);

  return (
    <div
      ref={containerRef}
      className="no-scrollbar"
      style={{
        display: 'flex',
        width: '100%',
        maxWidth: 480,
        margin: '0 auto 16px',
        padding: '0 12px',
        overflowX: 'auto',
        scrollSnapType: 'x mandatory',
        scrollBehavior: 'smooth',
        whiteSpace: 'nowrap',
      }}
    >
      {tabs.map((tab, index) => {
        const isActive = active === tab.id;
        const isFirst = index === 0;
        const isLast = index === tabs.length - 1;

        return (
          <button
            key={tab.id}
            ref={(el) => (tabRefs.current[tab.id] = el)}
            type="button"
            onClick={() => onChange(tab.id)}
            aria-pressed={isActive}
            style={{
              flexShrink: 0,
              scrollSnapAlign: 'center',
              padding: '10px 16px',
              fontSize: 13,
              fontWeight: 500,
              letterSpacing: '-0.005em',
              lineHeight: 1.1,
              background: isActive ? 'var(--bg-secondary)' : 'var(--bg-tertiary)',
              border: isActive ? '1px solid rgba(127, 168, 127, 0.55)' : '1px solid var(--border)',
              borderRadius: 0,
              borderTopLeftRadius: isFirst ? 10 : 0,
              borderBottomLeftRadius: isFirst ? 10 : 0,
              borderTopRightRadius: isLast ? 10 : 0,
              borderBottomRightRadius: isLast ? 10 : 0,
              // Prevent double borders between adjacent tabs.
              marginLeft: isFirst ? 0 : -1,
              boxShadow: isActive
                ? '0 0 0 1px rgba(127, 168, 127, 0.35), 0 6px 18px rgba(127, 168, 127, 0.12)'
                : 'var(--shadow-sm)',
              color: isActive ? 'transparent' : 'var(--text-muted)',
              cursor: 'pointer',
              transition:
                'background var(--transition-fast), border-color var(--transition-fast), box-shadow var(--transition-fast)',
              whiteSpace: 'nowrap',
              position: 'relative',
            }}
          >
            <span
              className={isActive ? 'text-accent-gradient' : undefined}
              style={{
                display: 'inline-block',
                fontWeight: 500,
                fontSize: 13,
              }}
            >
              {tab.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
