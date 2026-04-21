import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import Toggle from '@/sidepanel/components/ui/Toggle';

describe('<Toggle />', () => {
  it('renders with aria-checked="false" when unchecked', () => {
    render(<Toggle checked={false} onChange={() => {}} />);
    const btn = screen.getByRole('switch');
    expect(btn.getAttribute('aria-checked')).toBe('false');
  });

  it('renders with aria-checked="true" when checked', () => {
    render(<Toggle checked={true} onChange={() => {}} />);
    expect(screen.getByRole('switch').getAttribute('aria-checked')).toBe('true');
  });

  it('renders with aria-checked="mixed" when indeterminate', () => {
    render(<Toggle checked={false} indeterminate onChange={() => {}} />);
    expect(screen.getByRole('switch').getAttribute('aria-checked')).toBe('mixed');
  });

  it('flips from off -> on via click', () => {
    const onChange = vi.fn();
    render(<Toggle checked={false} onChange={onChange} />);
    fireEvent.click(screen.getByRole('switch'));
    expect(onChange).toHaveBeenCalledWith(true);
  });

  it('flips from on -> off via click', () => {
    const onChange = vi.fn();
    render(<Toggle checked={true} onChange={onChange} />);
    fireEvent.click(screen.getByRole('switch'));
    expect(onChange).toHaveBeenCalledWith(false);
  });

  it('indeterminate click completes the intent (all on) per spec §3.4', () => {
    const onChange = vi.fn();
    render(<Toggle checked={false} indeterminate onChange={onChange} />);
    fireEvent.click(screen.getByRole('switch'));
    expect(onChange).toHaveBeenCalledWith(true);
  });

  it('disabled button does not fire onChange', () => {
    const onChange = vi.fn();
    render(<Toggle checked={false} onChange={onChange} disabled />);
    fireEvent.click(screen.getByRole('switch'));
    expect(onChange).not.toHaveBeenCalled();
  });

  it('renders label when provided', () => {
    render(<Toggle checked={false} onChange={() => {}} label="Pause" />);
    expect(screen.getByText('Pause')).toBeTruthy();
  });
});
