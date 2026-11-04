import { useRef, useEffect } from 'react';

/**
 * TabNav — Nord segmented control: a glass rail with a pill on the active tab
 * (active tab in plain text, never accent). Scrolls horizontally if it ever
 * outgrows the panel and keeps the active tab in view.
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
      role="tablist"
      style={{
        display: 'flex',
        gap: 2,
        width: 'calc(100% - 24px)',
        maxWidth: 456,
        margin: '0 auto 16px',
        padding: 3,
        overflowX: 'auto',
        borderRadius: 12,
        background: 'var(--seg-rail)',
        boxShadow: 'inset 0 0 0 1px var(--border-subtle)',
      }}
    >
      {tabs.map((tab) => {
        const isActive = active === tab.id;
        return (
          <button
            key={tab.id}
            ref={(el) => (tabRefs.current[tab.id] = el)}
            type="button"
            role="tab"
            onClick={() => onChange(tab.id)}
            aria-selected={isActive}
            aria-pressed={isActive}
            style={{
              flex: 1,
              height: 30,
              padding: '0 14px',
              fontFamily: 'inherit',
              fontSize: 12.5,
              fontWeight: isActive ? 600 : 500,
              color: isActive ? 'var(--text-primary)' : 'var(--text-muted)',
              background: isActive ? 'var(--seg-thumb)' : 'transparent',
              border: 'none',
              borderRadius: 9,
              boxShadow: isActive
                ? 'inset 0 1px 0 rgb(255 255 255 / 0.09), 0 4px 10px -6px rgb(0 0 0 / 0.6)'
                : 'none',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              transition:
                'background-color var(--transition-slow), color var(--transition-fast), box-shadow var(--transition-slow)',
            }}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
