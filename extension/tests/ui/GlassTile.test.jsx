import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { Sparkles } from 'lucide-react';
import GlassTile from '@/sidepanel/components/ui/GlassTile';

// jsdom doesn't provide navigator.clipboard by default.
beforeEach(() => {
  Object.defineProperty(navigator, 'clipboard', {
    value: { writeText: vi.fn().mockResolvedValue(undefined) },
    configurable: true,
    writable: true,
  });
  vi.useFakeTimers();
});

describe('<GlassTile />', () => {
  it('renders label, value, and icon', () => {
    render(<GlassTile icon={Sparkles} label="Hidden" value="42" />);
    expect(screen.getByText('Hidden')).toBeTruthy();
    expect(screen.getByText('42')).toBeTruthy();
  });

  it('copies value to clipboard on click', async () => {
    render(<GlassTile icon={Sparkles} label="API Key" value="abc123" />);
    const button = screen.getByRole('button', { name: /copy api key/i });
    await act(async () => {
      fireEvent.click(button);
    });
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith('abc123');
  });

  it('prefers copyValue over value when both are provided', async () => {
    render(
      <GlassTile
        icon={Sparkles}
        label="Truncated"
        value="abc…"
        copyValue="abcdefghij"
      />,
    );
    await act(async () => {
      fireEvent.click(screen.getByRole('button'));
    });
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith('abcdefghij');
  });

  it('disables copy when copyValue === null', async () => {
    render(
      <GlassTile icon={Sparkles} label="Display" value="nope" copyValue={null} />,
    );
    const button = screen.getByRole('button', { name: 'Display' });
    await act(async () => {
      fireEvent.click(button);
    });
    expect(navigator.clipboard.writeText).not.toHaveBeenCalled();
  });

  it('fires onClick before writing to the clipboard', async () => {
    const onClick = vi.fn();
    render(
      <GlassTile icon={Sparkles} label="Click" value="x" onClick={onClick} />,
    );
    await act(async () => {
      fireEvent.click(screen.getByRole('button'));
    });
    expect(onClick).toHaveBeenCalledOnce();
    expect(navigator.clipboard.writeText).toHaveBeenCalledOnce();
  });

  it('silently no-ops when the clipboard API rejects', async () => {
    navigator.clipboard.writeText.mockRejectedValueOnce(new Error('denied'));
    render(<GlassTile icon={Sparkles} label="X" value="y" />);
    // No throw is the contract.
    await act(async () => {
      fireEvent.click(screen.getByRole('button'));
    });
    expect(navigator.clipboard.writeText).toHaveBeenCalled();
  });
});
