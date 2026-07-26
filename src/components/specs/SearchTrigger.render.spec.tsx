import { render, screen, fireEvent } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { SearchTrigger } from '../SearchTrigger';

describe('SearchTrigger Component Spec', () => {
  it('renders a button styled like an input with placeholder text and "/" keycap hint', () => {
    render(<SearchTrigger onOpenDrawer={vi.fn()} />);

    const trigger = screen.getByRole('button', { name: /Search algorithms/i });
    expect(trigger).toBeInTheDocument();
    expect(screen.getByText(/Search algorithms…/i)).toBeInTheDocument();
    expect(screen.getByText('/')).toBeInTheDocument();
  });

  it('uses the sm control height so it lines up with the navbar toggle row', () => {
    render(<SearchTrigger onOpenDrawer={vi.fn()} />);

    const trigger = screen.getByRole('button', { name: /Search algorithms/i });
    expect(trigger.style.height).toBe('var(--control-h-sm)');
    expect(trigger.style.fontSize).toBe('var(--text-xs)');
  });

  it('sits on the neutral inset tier so it reads as an input, not a filled button', () => {
    render(<SearchTrigger onOpenDrawer={vi.fn()} />);

    const trigger = screen.getByRole('button', { name: /Search algorithms/i });
    expect(trigger.style.background).toBe('var(--bg-inset)');
    expect(trigger.style.color).toBe('var(--text-muted)');
  });

  it('promotes its border and text on hover without tinting either', () => {
    render(<SearchTrigger onOpenDrawer={vi.fn()} />);

    const trigger = screen.getByRole('button', { name: /Search algorithms/i });
    fireEvent.mouseEnter(trigger);
    expect(trigger.style.borderColor).toBe('var(--border-strong)');
    expect(trigger.style.color).toBe('var(--text-primary)');

    fireEvent.mouseLeave(trigger);
    expect(trigger.style.borderColor).toBe('var(--border-default)');
    expect(trigger.style.color).toBe('var(--text-muted)');
  });

  it('does not render an actual text input or dropdown result list', () => {
    render(<SearchTrigger onOpenDrawer={vi.fn()} />);

    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
    expect(screen.queryByRole('combobox')).not.toBeInTheDocument();
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });

  it('fires onOpenDrawer when clicked', () => {
    const onOpenDrawer = vi.fn();
    render(<SearchTrigger onOpenDrawer={onOpenDrawer} />);

    fireEvent.click(screen.getByRole('button', { name: /Search algorithms/i }));

    expect(onOpenDrawer).toHaveBeenCalledTimes(1);
  });
});
