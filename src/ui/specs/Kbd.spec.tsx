import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Kbd } from '../Kbd';

describe('Kbd', () => {
  it('renders a kbd element with the chip class', () => {
    render(<Kbd>/</Kbd>);
    const kbd = screen.getByText('/');
    expect(kbd.tagName).toBe('KBD');
    expect(kbd).toHaveClass('ui-kbd');
  });

  it('merges custom className', () => {
    render(<Kbd className="navbar-kbd">Esc</Kbd>);
    expect(screen.getByText('Esc')).toHaveClass('ui-kbd', 'navbar-kbd');
  });
});
