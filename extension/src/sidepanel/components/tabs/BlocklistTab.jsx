import RuleList from '../blocklist/RuleList';
import { useStorageState } from '../../hooks/useStorageState';

const KEYS = ['blocklistKeywords', 'blocklistChannels'];

export default function BlocklistTab() {
  const [state, setValue] = useStorageState(KEYS);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 14,
        padding: '4px 14px 80px',
      }}
    >
      <RuleList
        title="Keywords"
        subtitle="Hide videos whose title matches"
        listLabel="Keyword"
        rules={state.blocklistKeywords ?? []}
        onChange={(next) => setValue('blocklistKeywords', next)}
      />
      <RuleList
        title="Channels"
        subtitle="Hide videos from matching channels"
        listLabel="Channel"
        rules={state.blocklistChannels ?? []}
        onChange={(next) => setValue('blocklistChannels', next)}
      />
    </div>
  );
}
