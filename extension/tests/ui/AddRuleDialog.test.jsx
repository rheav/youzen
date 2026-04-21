import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import AddRuleDialog from '@/sidepanel/components/blocklist/AddRuleDialog';

describe('<AddRuleDialog />', () => {
  it('returns null when open is false', () => {
    const { container } = render(
      <AddRuleDialog
        open={false}
        listLabel="Keyword"
        onSave={() => {}}
        onCancel={() => {}}
      />,
    );
    expect(container.querySelector('[role="dialog"]')).toBeNull();
  });

  it('renders the add form when open', () => {
    render(
      <AddRuleDialog
        open
        listLabel="Keyword"
        onSave={() => {}}
        onCancel={() => {}}
      />,
    );
    expect(screen.getByRole('dialog')).toBeTruthy();
    expect(screen.getByText('Add keyword rule')).toBeTruthy();
  });

  it('calls onSave with a new rule object on submit', () => {
    const onSave = vi.fn();
    render(
      <AddRuleDialog
        open
        listLabel="Keyword"
        onSave={onSave}
        onCancel={() => {}}
      />,
    );
    const input = screen.getByPlaceholderText(/e\.g\. reaction/);
    fireEvent.change(input, { target: { value: 'unbox' } });
    fireEvent.click(screen.getByRole('button', { name: 'Add' }));
    expect(onSave).toHaveBeenCalledOnce();
    const arg = onSave.mock.calls[0][0];
    expect(arg.text).toBe('unbox');
    expect(arg.mode).toBe('substring');
    expect(arg.caseSensitive).toBe(false);
    expect(arg.id).toMatch(/^r_/);
  });

  it('pre-fills the form in edit mode and reuses the rule id on save', () => {
    const onSave = vi.fn();
    const initial = {
      id: 'existing-id',
      text: 'reaction',
      mode: 'wholeWord',
      caseSensitive: true,
    };
    render(
      <AddRuleDialog
        open
        listLabel="Keyword"
        initial={initial}
        onSave={onSave}
        onCancel={() => {}}
      />,
    );
    expect(screen.getByText('Edit keyword rule')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));
    expect(onSave).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'existing-id',
        text: 'reaction',
        mode: 'wholeWord',
        caseSensitive: true,
      }),
    );
  });

  it('disables the save button when text is empty', () => {
    render(
      <AddRuleDialog
        open
        listLabel="Keyword"
        onSave={() => {}}
        onCancel={() => {}}
      />,
    );
    const saveBtn = screen.getByRole('button', { name: 'Add' });
    expect(saveBtn.hasAttribute('disabled')).toBe(true);
  });

  it('shows an inline error and disables save when regex is invalid', async () => {
    render(
      <AddRuleDialog
        open
        listLabel="Keyword"
        onSave={() => {}}
        onCancel={() => {}}
      />,
    );
    // Switch to regex mode.
    fireEvent.click(screen.getByText('Regex'));
    const input = screen.getByPlaceholderText(/e\.g\. reaction/);
    await act(async () => {
      fireEvent.change(input, { target: { value: '[unclosed' } });
    });
    expect(screen.getByText(/Invalid regex/)).toBeTruthy();
    const saveBtn = screen.getByRole('button', { name: 'Add' });
    expect(saveBtn.hasAttribute('disabled')).toBe(true);
  });

  it('calls onCancel when the backdrop is clicked', () => {
    const onCancel = vi.fn();
    render(
      <AddRuleDialog
        open
        listLabel="Keyword"
        onSave={() => {}}
        onCancel={onCancel}
      />,
    );
    fireEvent.click(screen.getByRole('dialog'));
    expect(onCancel).toHaveBeenCalledOnce();
  });

  it('calls onCancel when the X button is clicked', () => {
    const onCancel = vi.fn();
    render(
      <AddRuleDialog
        open
        listLabel="Keyword"
        onSave={() => {}}
        onCancel={onCancel}
      />,
    );
    fireEvent.click(screen.getByLabelText('Close'));
    expect(onCancel).toHaveBeenCalledOnce();
  });
});
