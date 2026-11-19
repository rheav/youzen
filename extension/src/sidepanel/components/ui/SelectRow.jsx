import Select from './Select';

/**
 * SelectRow — a settings line with a label, an optional description and a
 * select on the right. The select is labelled by `label` unless `ariaLabel`
 * says otherwise.
 */
export default function SelectRow({ label, description, value, onChange, options, disabled = false, ariaLabel }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 10,
        padding: '8px 0',
        opacity: disabled ? 0.5 : 1,
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-primary)' }}>{label}</span>
        {description && <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{description}</span>}
      </div>
      <Select value={value} onChange={onChange} options={options} disabled={disabled} ariaLabel={ariaLabel ?? label} />
    </div>
  );
}
