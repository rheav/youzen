import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import Panel from '../../src/content/transcript/Panel.jsx';

const CUES = {
  v1: [
    { start: 0, end: 2, text: 'Hello there.' },
    { start: 2, end: 4, text: 'Second phrase here.' },
    { start: 4, end: 6, text: 'Another phrase.' },
  ],
  v2: [{ start: 0, end: 3, text: 'Brand new video.' }],
};
const track = { lang: 'en', label: 'English', auto: true, params: { kind: 'asr', name: null, variant: null } };

function setup({ tracks = [track] } = {}) {
  let videoId = 'v1';
  const video = new EventTarget();
  video.currentTime = 0;
  const source = {
    getPlayer: vi.fn(async (id) => ({ videoId: id, title: 'My: video', tracks, translations: [{ code: 'pt', label: 'Portuguese' }] })),
    loadTrack: vi.fn(async (id) => ({ cues: CUES[id] })),
    isAdShowing: () => false,
  };
  const ch = {
    storage: { local: { get: (_k, cb) => cb({}), set: vi.fn(), remove: (_k, cb) => cb?.() } },
  };
  const onClose = vi.fn();
  const utils = render(
    <Panel source={source} doc={document} ch={ch} getVideoId={() => videoId} getVideo={() => video} onClose={onClose} />,
  );
  const tick = (t) =>
    act(() => {
      video.currentTime = t;
      video.dispatchEvent(new Event('timeupdate'));
    });
  return { ...utils, source, video, onClose, tick, setVideo: (id) => (videoId = id) };
}

describe('transcript panel', () => {
  beforeEach(() => {
    Object.defineProperty(navigator, 'clipboard', { value: { writeText: vi.fn(async () => {}) }, configurable: true });
  });

  it('renders blocks and marks the active cue yellow', async () => {
    const { tick, container } = setup();
    await screen.findByText('Second phrase here.');
    tick(2.5);
    expect(container.querySelector('.ph.say').textContent).toBe('Second phrase here.');
    expect(container.querySelector('.row.now')).not.toBeNull();
  });

  it('clicking a phrase seeks the video', async () => {
    const { video } = setup();
    fireEvent.click(await screen.findByText('Another phrase.'));
    expect(video.currentTime).toBe(4);
  });

  it('search highlights matches and counts n of m', async () => {
    const { container } = setup();
    await screen.findByText('Hello there.');
    fireEvent.click(screen.getByLabelText('Search (Ctrl+F)'));
    fireEvent.change(screen.getByLabelText('Search the transcript'), { target: { value: 'PHRASE' } });
    expect(screen.getByText('1 of 2')).toBeTruthy();
    expect(container.querySelectorAll('mark')).toHaveLength(2);
    expect(container.querySelector('mark.cur').textContent).toBe('phrase');
    fireEvent.keyDown(screen.getByLabelText('Search the transcript'), { key: 'Enter' });
    expect(screen.getByText('2 of 2')).toBeTruthy();
  });

  it('Esc closes search', async () => {
    setup();
    await screen.findByText('Hello there.');
    fireEvent.click(screen.getByLabelText('Search (Ctrl+F)'));
    fireEvent.keyDown(screen.getByLabelText('Search the transcript'), { key: 'Escape' });
    expect(screen.queryByLabelText('Search the transcript')).toBeNull();
  });

  it('copy writes buildTxt output to the clipboard', async () => {
    setup();
    await screen.findByText('Hello there.');
    await act(async () => fireEvent.click(screen.getByText('Copy')));
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith('0:00\nHello there. Second phrase here. Another phrase.');
    expect(await screen.findByText('Copied')).toBeTruthy();
  });

  it('resets when videoId changes', async () => {
    const { setVideo, source } = setup();
    await screen.findByText('Hello there.');
    setVideo('v2');
    expect(await screen.findByText('Brand new video.')).toBeTruthy();
    expect(screen.queryByText('Hello there.')).toBeNull();
    await waitFor(() => expect(source.getPlayer).toHaveBeenCalledWith('v2'));
  });

  it('shows No transcript for this video on noCaptions', async () => {
    const { source } = setup({ tracks: [] });
    expect(await screen.findByText('No transcript for this video')).toBeTruthy();
    expect(source.loadTrack).not.toHaveBeenCalled();
  });

  it('close button calls onClose', async () => {
    const { onClose } = setup();
    fireEvent.click(screen.getByLabelText('Close transcript'));
    expect(onClose).toHaveBeenCalled();
  });
});
