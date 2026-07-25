import { render, screen, fireEvent } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { Drawer } from '../Drawer';

describe('Drawer', () => {
  it('renders nothing when closed', () => {
    render(
      <Drawer isOpen={false} onClose={() => undefined} title="Algorithms">
        Content
      </Drawer>,
    );
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('renders an aria-modal dialog labelled by its title when open', () => {
    render(
      <Drawer isOpen onClose={() => undefined} title="Algorithms">
        Content
      </Drawer>,
    );
    const dialog = screen.getByRole('dialog', { name: 'Algorithms' });
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(dialog).toHaveClass('ui-drawer', 'ui-drawer--right');
    expect(screen.getByText('Content')).toBeInTheDocument();
  });

  it('defaults to a 440px width and accepts a custom width', () => {
    const { rerender } = render(
      <Drawer isOpen onClose={() => undefined} title="T">
        C
      </Drawer>,
    );
    expect(screen.getByRole('dialog')).toHaveStyle({ width: '440px' });

    rerender(
      <Drawer isOpen onClose={() => undefined} title="T" width={520}>
        C
      </Drawer>,
    );
    expect(screen.getByRole('dialog')).toHaveStyle({ width: '520px' });
  });

  it('closes on Escape', () => {
    const onClose = vi.fn();
    render(
      <Drawer isOpen onClose={onClose} title="T">
        C
      </Drawer>,
    );
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('closes on backdrop click but not on panel click', () => {
    const onClose = vi.fn();
    render(
      <Drawer isOpen onClose={onClose} title="T">
        C
      </Drawer>,
    );
    fireEvent.click(screen.getByText('C'));
    expect(onClose).not.toHaveBeenCalled();

    const backdrop = document.querySelector('.ui-drawer-backdrop');
    expect(backdrop).not.toBeNull();
    fireEvent.click(backdrop as Element);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('closes via the header close button', () => {
    const onClose = vi.fn();
    render(
      <Drawer isOpen onClose={onClose} title="T">
        C
      </Drawer>,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Close' }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('locks body scroll while open and restores it on unmount', () => {
    const { unmount } = render(
      <Drawer isOpen onClose={() => undefined} title="T">
        C
      </Drawer>,
    );
    expect(document.body.style.overflow).toBe('hidden');
    unmount();
    expect(document.body.style.overflow).toBe('');
  });

  it('renders an optional footer', () => {
    render(
      <Drawer isOpen onClose={() => undefined} title="T" footer={<span>Footer actions</span>}>
        C
      </Drawer>,
    );
    expect(screen.getByText('Footer actions')).toBeInTheDocument();
  });
});
