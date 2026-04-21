import { useMemo } from 'react';
import { FEATURES, GROUPS, featuresIn } from '@/config/features';
import { getMasterState, setMasterState } from '@/utils/features';
import { useStorageState, writePatch } from '../hooks/useStorageState';
import Card from './ui/Card';
import Toggle from './ui/Toggle';
import FeatureRow from './ui/FeatureRow';
import Select from './ui/Select';

/**
 * FeaturePanel — renders all groups on a tab, driven by FEATURES + GROUPS.
 *
 * Reads every relevant key (all feature ids + all select extras + master ids
 * + globallyPaused) in a single useStorageState so the panel re-renders
 * synchronously on storage changes.
 *
 * @param {Object} props
 * @param {'feeds'|'watch'} props.tab
 */
export default function FeaturePanel({ tab }) {
  const keys = useMemo(() => collectKeysForTab(tab), [tab]);
  const [state, setValue] = useStorageState(keys);
  const paused = !!state.globallyPaused;

  const groups = GROUPS[tab] ?? [];

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 14,
        padding: '4px 14px 80px',
      }}
    >
      {groups.map((g, i) => (
        <GroupSection
          key={g.id ?? `loose-${i}`}
          tab={tab}
          group={g}
          state={state}
          setValue={setValue}
          disabled={paused}
        />
      ))}
    </div>
  );
}

function GroupSection({ tab, group, state, setValue, disabled }) {
  const subs = featuresIn(tab, group.id);
  if (subs.length === 0) return null;

  // "Loose" pseudo-group: standalone rows with no Card wrapper.
  if (group.loose) {
    return (
      <div
        style={{
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-lg)',
          padding: '4px 14px',
        }}
      >
        {subs.map((sub, i) => (
          <div
            key={sub.id}
            style={{
              borderTop: i === 0 ? 'none' : '1px solid var(--border-subtle)',
            }}
          >
            <FeatureRow
              label={sub.label}
              description={sub.description}
              checked={!!state[sub.id]}
              onToggle={(v) => setValue(sub.id, v)}
              disabled={disabled}
              extra={renderExtra(sub, state, setValue, disabled)}
            />
          </div>
        ))}
      </div>
    );
  }

  if (group.hasMaster) {
    const masterState = getMasterState(group.id, state);
    const masterToggle = (
      <Toggle
        checked={masterState === 'on'}
        indeterminate={masterState === 'indeterminate'}
        onChange={(next) => {
          const patch = setMasterState(group.id, next, state);
          // Update local state synchronously + persist everything at once.
          for (const [k, v] of Object.entries(patch)) setValue(k, v);
          writePatch(patch);
        }}
        disabled={disabled}
      />
    );

    return (
      <Card
        title={group.title}
        subtitle={subs[0]?.description ? undefined : findMasterDescription(group.id)}
        collapsible
        defaultCollapsed={false}
        trailing={masterToggle}
      >
        {subs.map((sub, i) => (
          <div
            key={sub.id}
            style={{
              borderTop: i === 0 ? 'none' : '1px solid var(--border-subtle)',
            }}
          >
            <FeatureRow
              label={sub.label}
              description={sub.description}
              checked={!!state[sub.id]}
              onToggle={(v) => setValue(sub.id, v)}
              disabled={disabled}
              extra={renderExtra(sub, state, setValue, disabled)}
            />
          </div>
        ))}
      </Card>
    );
  }

  // Non-master group: Card with title, no trailing toggle.
  return (
    <Card title={group.title} collapsible defaultCollapsed={false}>
      {subs.map((sub, i) => (
        <div
          key={sub.id}
          style={{
            borderTop: i === 0 ? 'none' : '1px solid var(--border-subtle)',
          }}
        >
          <FeatureRow
            label={sub.label}
            description={sub.description}
            checked={!!state[sub.id]}
            onToggle={(v) => setValue(sub.id, v)}
            disabled={disabled}
            extra={renderExtra(sub, state, setValue, disabled)}
          />
        </div>
      ))}
    </Card>
  );
}

function renderExtra(sub, state, setValue, disabled) {
  if (sub.extra?.kind !== 'select') return null;
  const value = state[sub.extra.key] ?? sub.extra.default;
  return (
    <Select
      value={value}
      onChange={(v) => setValue(sub.extra.key, v)}
      options={sub.extra.options}
      disabled={disabled || !state[sub.id]}
      ariaLabel={`${sub.label} mode`}
    />
  );
}

function findMasterDescription(groupId) {
  const master = FEATURES.find((e) => e.id === groupId && e.isMaster);
  return master?.description;
}

function collectKeysForTab(tab) {
  const keys = new Set(['globallyPaused']);
  for (const entry of FEATURES) {
    if (entry.tab !== tab) continue;
    keys.add(entry.id);
    if (!entry.isMaster && entry.extra?.kind === 'select') {
      keys.add(entry.extra.key);
    }
  }
  return [...keys];
}
