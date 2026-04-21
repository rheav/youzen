import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import Badge from './Badge';

export default function Card({
  title,
  subtitle,
  badge,
  trailing,
  collapsible = false,
  defaultCollapsed = false,
  padding = true,
  children,
  className = '',
  style: styleProp = {},
}) {
  const [collapsed, setCollapsed] = useState(defaultCollapsed);
  const [hovered, setHovered] = useState(false);

  return (
    <div
      className={`animate-fade-in ${className}`}
      style={{
        background: 'var(--bg-secondary)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-lg)',
        boxShadow: hovered ? 'var(--shadow-hover)' : 'var(--shadow)',
        transition: 'box-shadow var(--transition), transform var(--transition)',
        transform: hovered ? 'translateY(-1px)' : 'translateY(0)',
        overflow: 'hidden',
        ...styleProp,
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Header */}
      {(title || subtitle) && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '10px 14px',
            borderBottom: collapsed ? 'none' : '1px solid var(--border-subtle)',
            cursor: collapsible ? 'pointer' : 'default',
            userSelect: 'none',
          }}
          onClick={collapsible ? () => setCollapsed(!collapsed) : undefined}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span
                style={{
                  fontSize: 13,
                  fontWeight: 600,
                  color: 'var(--text-primary)',
                  letterSpacing: '-0.01em',
                }}
              >
                {title}
              </span>
              {badge !== undefined && badge !== null && <Badge size="sm">{badge}</Badge>}
            </div>
            {subtitle && (
              <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{subtitle}</span>
            )}
          </div>

          <div
            style={{ display: 'flex', alignItems: 'center', gap: 10 }}
            onClick={(e) => {
              // Don't let clicks on the trailing node (e.g. master Toggle)
              // accidentally collapse the card.
              if (trailing) e.stopPropagation();
            }}
          >
            {trailing}
            {collapsible && (
              <ChevronDown
                size={15}
                style={{
                  color: 'var(--text-muted)',
                  transition: 'transform var(--transition)',
                  transform: collapsed ? 'rotate(-90deg)' : 'rotate(0deg)',
                  flexShrink: 0,
                  cursor: 'pointer',
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  setCollapsed(!collapsed);
                }}
                aria-label={collapsed ? 'Expand' : 'Collapse'}
              />
            )}
          </div>
        </div>
      )}

      {/* Body */}
      <div
        style={{
          maxHeight: collapsed ? 0 : 2000,
          overflow: 'hidden',
          transition: 'max-height var(--transition-slow)',
        }}
      >
        <div style={{ padding: padding ? 14 : 0 }}>{children}</div>
      </div>
    </div>
  );
}
