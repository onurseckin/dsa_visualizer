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
