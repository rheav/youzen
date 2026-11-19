import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import SelectRow from '@/sidepanel/components/ui/SelectRow';

const OPTIONS = [
  { value: 'a', label: 'Alpha' },
  { value: 'b', label: 'Beta' },
];

describe('<SelectRow />', () => {
  it('shows label and description, labels the select, and reports changes', () => {
    const onChange = vi.fn();
    render(<SelectRow label="Pick one" description="Some help" value="a" onChange={onChange} options={OPTIONS} />);
    expect(screen.getByText('Some help')).toBeTruthy();
    const select = screen.getByLabelText('Pick one');
    expect(select.value).toBe('a');
    fireEvent.change(select, { target: { value: 'b' } });
    expect(onChange).toHaveBeenCalledWith('b');
  });

  it('dims and disables when disabled', () => {
    const { container } = render(<SelectRow label="Pick one" value="a" onChange={() => {}} options={OPTIONS} disabled />);
    expect(screen.getByLabelText('Pick one').disabled).toBe(true);
    expect(container.firstChild.style.opacity).toBe('0.5');
  });
});
