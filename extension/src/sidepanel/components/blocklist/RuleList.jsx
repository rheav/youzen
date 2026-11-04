import { useState } from 'react';
import { Plus } from 'lucide-react';
import RuleCard from './RuleCard';
import AddRuleDialog from './AddRuleDialog';

/**
 * RuleList — a section of the Blocklist tab holding either keywords or
 * channels. Owns the add/edit dialog state and defers persistence to the
 * parent via the rules/onChange contract.
 *
 * Props:
 *   title     string — section heading (e.g. 'Keywords')
 *   subtitle  string — optional helper text
 *   listLabel string — singular label used inside the dialog ('Keyword' | 'Channel')
 *   rules     array of { id, text, mode, caseSensitive }
 *   onChange  (nextRules) => void
 */
export default function RuleList({
  title,
  subtitle,
  listLabel,
  rules = [],
  onChange,
}) {
  const [editing, setEditing] = useState(null); // rule | 'new' | null

  const openAdd = () => setEditing('new');
  const openEdit = (rule) => setEditing(rule);
  const close = () => setEditing(null);

  const saveRule = (rule) => {
    const next = editing === 'new'
      ? [...rules, rule]
      : rules.map((r) => (r.id === rule.id ? rule : r));
    onChange?.(next);
    close();
  };

  const deleteRule = (rule) => {
    onChange?.(rules.filter((r) => r.id !== rule.id));
  };

  return (
    <section
      style={{
        background: 'var(--bg-secondary)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-lg)',
        padding: 14,
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
      }}
    >
      <header
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: 8,
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <h3
            style={{
              margin: 0,
              fontSize: 13,
              fontWeight: 600,
              color: 'var(--text-primary)',
              letterSpacing: '-0.01em',
            }}
          >
            {title}
            <span
              style={{
                marginLeft: 8,
                fontSize: 11,
                fontWeight: 500,
                color: 'var(--text-muted)',
              }}
            >
              {rules.length}
            </span>
          </h3>
          {subtitle && (
            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
              {subtitle}
            </span>
          )}
        </div>
        <button
          type="button"
          onClick={openAdd}
          aria-label={`Add ${listLabel.toLowerCase()}`}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            fontFamily: 'inherit',
            fontSize: 12,
            fontWeight: 500,
            color: 'var(--text-primary)',
            background: 'var(--seg-rail)',
            border: '1px solid var(--border)',
            borderRadius: 999,
            padding: '5px 11px 5px 9px',
            cursor: 'pointer',
          }}
        >
          <Plus size={13} strokeWidth={2} />
          Add
        </button>
      </header>

      {rules.length === 0 ? (
        <div
          style={{
            padding: '14px 8px',
            textAlign: 'center',
            fontSize: 11,
            color: 'var(--text-muted)',
            fontStyle: 'italic',
          }}
        >
          No {listLabel.toLowerCase()}s yet.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {rules.map((rule) => (
            <RuleCard
              key={rule.id}
              rule={rule}
              onEdit={() => openEdit(rule)}
              onDelete={() => deleteRule(rule)}
            />
          ))}
        </div>
      )}

      <AddRuleDialog
        open={editing !== null}
        listLabel={listLabel}
        initial={editing === 'new' ? null : editing}
        onSave={saveRule}
        onCancel={close}
      />
    </section>
  );
}
