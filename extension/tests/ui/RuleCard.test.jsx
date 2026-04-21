import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import RuleCard from '@/sidepanel/components/blocklist/RuleCard';

describe('<RuleCard />', () => {
  it('renders the rule text and mode badge', () => {
    const rule = { id: '1', text: 'reaction', mode: 'substring' };
    render(<RuleCard rule={rule} onEdit={() => {}} onDelete={() => {}} />);
    expect(screen.getByText('reaction')).toBeTruthy();
    expect(screen.getByText('substring')).toBeTruthy();
  });

  it('shows the "Aa" badge for case-sensitive rules', () => {
    const rule = { id: '1', text: 'cat', caseSensitive: true };
    render(<RuleCard rule={rule} onEdit={() => {}} onDelete={() => {}} />);
    expect(screen.getByText('Aa')).toBeTruthy();
  });

  it('flags invalid regex visually', () => {
    const rule = { id: '1', text: '[unclosed', mode: 'regex' };
    render(<RuleCard rule={rule} onEdit={() => {}} onDelete={() => {}} />);
    expect(screen.getByText('invalid regex')).toBeTruthy();
  });

  it('does not flag a valid regex', () => {
    const rule = { id: '1', text: '^breaking', mode: 'regex' };
    render(<RuleCard rule={rule} onEdit={() => {}} onDelete={() => {}} />);
    expect(screen.queryByText('invalid regex')).toBeNull();
  });

  it('calls onEdit when the edit button is clicked', () => {
    const rule = { id: '1', text: 'reaction' };
    const onEdit = vi.fn();
    render(<RuleCard rule={rule} onEdit={onEdit} onDelete={() => {}} />);
    fireEvent.click(screen.getByLabelText('Edit rule'));
    expect(onEdit).toHaveBeenCalledOnce();
  });

  it('calls onDelete when the delete button is clicked', () => {
    const rule = { id: '1', text: 'reaction' };
    const onDelete = vi.fn();
    render(<RuleCard rule={rule} onEdit={() => {}} onDelete={onDelete} />);
    fireEvent.click(screen.getByLabelText('Delete rule'));
    expect(onDelete).toHaveBeenCalledOnce();
  });

  it('shows "whole word" badge for wholeWord mode', () => {
    const rule = { id: '1', text: 'cat', mode: 'wholeWord' };
    render(<RuleCard rule={rule} onEdit={() => {}} onDelete={() => {}} />);
    expect(screen.getByText('whole word')).toBeTruthy();
  });
});
