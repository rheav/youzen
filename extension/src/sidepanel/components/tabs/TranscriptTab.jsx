import { MousePointerClick, Search, Languages, Download, PencilLine, Captions } from 'lucide-react';
import Card from '../ui/Card';
import FeatureRow from '../ui/FeatureRow';
import Select from '../ui/Select';
import { useStorageState } from '../../hooks/useStorageState';
import { findFeature } from '@/config/features';

/**
 * Transcript tab — the in-page transcript panel's switch, its defaults, and how
 * to use it. The panel reads these keys when it opens and live while open.
 */

const KEYS = [
  'transcriptPanel',
  'transcriptShowTime',
  'transcriptAutoScroll',
  'transcriptColorLeak',
  'transcriptFullscreenMode',
  'transcriptTranslateLang',
  'globallyPaused',
];

const FULLSCREEN_MODES = [
  ['split', 'Side by side'],
  ['floating', 'Floating (frosted glass)'],
  ['off', 'Hidden'],
].map(([value, label]) => ({ value, label }));

// YouTube `tlang` codes. The panel's own menu lists every language YouTube
// offers for the video; these are the common defaults.
const LANGUAGES = [
  ['', 'Off'],
  ['en', 'English'],
  ['pt', 'Portuguese'],
  ['es', 'Spanish'],
  ['fr', 'French'],
  ['de', 'German'],
  ['it', 'Italian'],
  ['nl', 'Dutch'],
  ['pl', 'Polish'],
  ['ru', 'Russian'],
  ['uk', 'Ukrainian'],
  ['tr', 'Turkish'],
  ['ar', 'Arabic'],
  ['hi', 'Hindi'],
  ['id', 'Indonesian'],
  ['vi', 'Vietnamese'],
  ['ja', 'Japanese'],
  ['ko', 'Korean'],
  ['zh-Hans', 'Chinese (Simplified)'],
  ['zh-Hant', 'Chinese (Traditional)'],
].map(([value, label]) => ({ value, label }));

const TIPS = [
  [Captions, 'Open it', 'Click the transcript button next to CC in the player.'],
  [MousePointerClick, 'Jump around', 'Click any line or time to play the video from there.'],
  [Search, 'Search', 'Ctrl+F (⌘F) inside the panel. Accents and case are ignored.'],
  [Languages, 'Translate', 'Pick a language in the panel header; it stays on for the next video.'],
  [Download, 'Keep it', 'Copy it, or export TXT, SRT or VTT from the dock.'],
  [PencilLine, 'Fix it', 'Edit transcript in the ⋯ menu; your edits are saved per video.'],
];

export default function TranscriptTab() {
  const [state, setValue] = useStorageState(KEYS);
  const paused = !!state.globallyPaused;
  const enabled = state.transcriptPanel ?? findFeature('transcriptPanel').default;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14, padding: '4px 14px 80px' }}>
      <Card title="Transcript panel" subtitle="The transcript beside the video, following along">
        <FeatureRow
          label="Show the transcript button"
          description="Off removes the button and the panel"
          checked={!!enabled}
          onToggle={(v) => setValue('transcriptPanel', v)}
          disabled={paused}
        />
      </Card>

      <Card title="Defaults" subtitle="Used every time the panel opens">
        <FeatureRow
          label="Show timestamps"
          checked={state.transcriptShowTime ?? true}
          onToggle={(v) => setValue('transcriptShowTime', v)}
          disabled={paused}
        />
        <FeatureRow
          label="Follow the video"
          description="Keeps the line being spoken in view"
          checked={state.transcriptAutoScroll ?? true}
          onToggle={(v) => setValue('transcriptAutoScroll', v)}
          disabled={paused}
        />
        <FeatureRow
          label="Dynamic color glow"
          description="Tints the panel with the colours on screen"
          checked={state.transcriptColorLeak ?? true}
          onToggle={(v) => setValue('transcriptColorLeak', v)}
          disabled={paused}
        />
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 10,
            padding: '8px 0',
            opacity: paused ? 0.5 : 1,
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-primary)' }}>
              In fullscreen
            </span>
            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
              Side by side or frosted glass over the video
            </span>
          </div>
          <Select
            value={state.transcriptFullscreenMode ?? 'split'}
            onChange={(v) => setValue('transcriptFullscreenMode', v)}
            options={FULLSCREEN_MODES}
            disabled={paused}
            ariaLabel="In fullscreen"
          />
        </div>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 10,
            padding: '8px 0',
            opacity: paused ? 0.5 : 1,
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-primary)' }}>
              Translate to
            </span>
            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
              Shown under each paragraph
            </span>
          </div>
          <Select
            value={state.transcriptTranslateLang ?? ''}
            onChange={(v) => setValue('transcriptTranslateLang', v || null)}
            options={LANGUAGES}
            disabled={paused}
            ariaLabel="Translate to"
          />
        </div>
      </Card>

      <Card title="How it works">
        <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 12, padding: '4px 0' }}>
          {TIPS.map(([Icon, title, text]) => (
            <li key={title} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
              <span
                style={{
                  width: 26,
                  height: 26,
                  flexShrink: 0,
                  display: 'grid',
                  placeItems: 'center',
                  borderRadius: 8,
                  background: 'var(--seg-rail)',
                  boxShadow: 'inset 0 0 0 1px var(--border-subtle)',
                  color: 'var(--accent)',
                }}
              >
                <Icon size={14} />
              </span>
              <span style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)' }}>{title}</span>
                <span style={{ fontSize: 11.5, color: 'var(--text-muted)', lineHeight: 1.45 }}>{text}</span>
              </span>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
