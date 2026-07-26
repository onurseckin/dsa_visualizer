import { useState } from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { Collapsible } from '../Collapsible';

describe('Collapsible (uncontrolled)', () => {
  it('starts closed by default and hides its content', () => {
    render(<Collapsible title="Details">Hidden body</Collapsible>);
    const header = screen.getByRole('button', { name: 'Details' });
    expect(header).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByText('Hidden body')).toBeNull();
  });

  it('opens on header click and closes on a second click', () => {
    render(<Collapsible title="Details">Body text</Collapsible>);
    const header = screen.getByRole('button', { name: 'Details' });

    fireEvent.click(header);
    expect(header).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByText('Body text')).toBeInTheDocument();

    fireEvent.click(header);
    expect(header).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByText('Body text')).toBeNull();
  });

  it('respects defaultOpen and applies the open modifier class', () => {
    const { container } = render(
      <Collapsible title="Details" defaultOpen>
        Visible body
      </Collapsible>,
    );
    expect(screen.getByText('Visible body')).toBeInTheDocument();
    expect(container.querySelector('.ui-collapsible')).toHaveClass('ui-collapsible--open');
  });

  it('renders the meta node on the header', () => {
    render(
      <Collapsible title="Category" meta={<span>12</span>}>
        Rows
      </Collapsible>,
    );
    expect(screen.getByText('12')).toBeInTheDocument();
  });
});

describe('Collapsible (controlled)', () => {
  it('follows the open prop and reports toggles through onOpenChange', () => {
    const onOpenChange = vi.fn();
    const { rerender } = render(
      <Collapsible title="Panel" open={false} onOpenChange={onOpenChange}>
        Panel body
      </Collapsible>,
    );
    expect(screen.queryByText('Panel body')).toBeNull();

    fireEvent.click(screen.getByRole('button', { name: 'Panel' }));
    expect(onOpenChange).toHaveBeenCalledWith(true);
    // Still closed: the parent owns the state in controlled mode.
    expect(screen.queryByText('Panel body')).toBeNull();

    rerender(
      <Collapsible title="Panel" open onOpenChange={onOpenChange}>
        Panel body
      </Collapsible>,
    );
    expect(screen.getByText('Panel body')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Panel' }));
    expect(onOpenChange).toHaveBeenLastCalledWith(false);
  });

  it('works end-to-end with a stateful parent', () => {
    function Harness(): React.ReactElement {
      const [open, setOpen] = useState(false);
      return (
        <Collapsible title="Stateful" open={open} onOpenChange={setOpen}>
          Stateful body
        </Collapsible>
      );
    }
    render(<Harness />);
    fireEvent.click(screen.getByRole('button', { name: 'Stateful' }));
    expect(screen.getByText('Stateful body')).toBeInTheDocument();
  });
});
