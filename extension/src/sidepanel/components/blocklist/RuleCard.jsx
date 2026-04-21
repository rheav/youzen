import { useMemo } from 'react';
import { Pencil, Trash2, AlertTriangle } from 'lucide-react';
import { compileRule } from '@/utils/blocklist-matcher';

const MODE_LABELS = {
  substring: 'substring',
  wholeWord: 'whole word',
  regex: 'regex',
};

/**
 * RuleCard — one blocklist rule.
 *
 * Shows the rule text, a mode badge, an optional case-sensitive badge, and
 * edit / delete affordances. If the rule is a regex with invalid syntax,
 * the card is outlined in red and the mode badge carries an alert icon.
 */
export default function RuleCard({ rule, onEdit, onDelete }) {
  const validity = useMemo(() => compileRule(rule), [rule]);
  const isInvalid = rule?.mode === 'regex' && !validity.valid;
  const mode = rule?.mode ?? 'substring';

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        padding: '8px 10px',
        background: isInvalid ? 'rgba(255, 77, 77, 0.08)' : 'rgba(255, 255, 255, 0.5)',
        border: `1px solid ${isInvalid ? 'rgba(255, 77, 77, 0.5)' : 'var(--border)'}`,
        borderRadius: 'var(--radius)',
        transition: 'background var(--transition-fast), border-color var(--transition-fast)',
      }}
    >
      <div
        style={{
          flex: 1,
          minWidth: 0,
          display: 'flex',
          flexDirection: 'column',
          gap: 4,
        }}
      >
        <div
          style={{
            fontSize: 12,
            fontWeight: 500,
            color: 'var(--text-primary)',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
          title={rule.text}
        >
          {rule.text || <em style={{ color: 'var(--text-muted)' }}>(empty)</em>}
        </div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          <Badge color={isInvalid ? 'var(--color-brute-red)' : 'var(--color-accent-from)'}>
            {isInvalid && <AlertTriangle size={10} style={{ marginRight: 4 }} />}
            {MODE_LABELS[mode]}
          </Badge>
          {rule.caseSensitive && <Badge color="var(--text-muted)">Aa</Badge>}
          {isInvalid && (
            <span
              style={{
                fontSize: 10,
                color: 'var(--color-brute-red)',
                fontWeight: 500,
              }}
              title={validity.error}
            >
              invalid regex
            </span>
          )}
        </div>
      </div>

      <div style={{ display: 'flex', gap: 4 }}>
        <IconButton onClick={onEdit} aria-label="Edit rule">
          <Pencil size={12} />
        </IconButton>
        <IconButton onClick={onDelete} aria-label="Delete rule" destructive>
          <Trash2 size={12} />
        </IconButton>
      </div>
    </div>
  );
}

function Badge({ children, color }) {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 2,
        fontSize: 10,
        fontWeight: 500,
        color,
        padding: '1px 6px',
        borderRadius: 4,
        border: `1px solid ${color}`,
        letterSpacing: '0.02em',
      }}
    >
      {children}
    </span>
  );
}

function IconButton({ children, onClick, destructive, ...rest }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: 24,
        height: 24,
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius)',
        background: 'transparent',
        color: destructive ? 'var(--color-brute-red)' : 'var(--text-secondary)',
        cursor: 'pointer',
        padding: 0,
        transition: 'background var(--transition-fast), color var(--transition-fast)',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = destructive
          ? 'rgba(255,77,77,0.1)'
          : 'rgba(255,77,77,0.08)';
        e.currentTarget.style.color = destructive
          ? 'var(--color-brute-red)'
          : 'var(--color-accent-from)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = 'transparent';
        e.currentTarget.style.color = destructive
          ? 'var(--color-brute-red)'
          : 'var(--text-secondary)';
      }}
      {...rest}
    >
      {children}
    </button>
  );
}
