import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import SliderRow from '@/sidepanel/components/ui/SliderRow';

describe('<SliderRow />', () => {
  it('shows label and value, labels the range, and reports numbers', () => {
    const onChange = vi.fn();
    render(<SliderRow label="Darkness" description="Help" value={44} min={20} max={95} onChange={onChange} />);
    expect(screen.getByText('Help')).toBeTruthy();
    expect(screen.getByText('44%')).toBeTruthy();
    const range = screen.getByLabelText('Darkness');
    expect(range.type).toBe('range');
    expect(range.min).toBe('20');
    expect(range.max).toBe('95');
    fireEvent.change(range, { target: { value: '70' } });
    expect(onChange).toHaveBeenCalledWith(70);
  });

  it('dims and disables when disabled', () => {
    const { container } = render(<SliderRow label="Darkness" value={44} onChange={() => {}} disabled />);
    expect(screen.getByLabelText('Darkness').disabled).toBe(true);
    expect(container.firstChild.style.opacity).toBe('0.5');
  });
});
