import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Search } from 'lucide-react';
import { Button } from '../Button';

describe('Button', () => {
  it('renders a secondary md button by default with type="button"', () => {
    render(<Button>Save</Button>);
    const button = screen.getByRole('button', { name: 'Save' });
    expect(button).toHaveClass('ui-btn', 'ui-btn--secondary', 'ui-btn--md');
    expect(button).toHaveAttribute('type', 'button');
  });

  it('applies variant and size modifier classes', () => {
    render(
      <Button variant="primary" size="lg">
        Run
      </Button>,
    );
    const button = screen.getByRole('button', { name: 'Run' });
    expect(button).toHaveClass('ui-btn--primary', 'ui-btn--lg');
    expect(button).not.toHaveClass('ui-btn--secondary', 'ui-btn--md');
  });

  it('applies the selected treatment and exposes aria-pressed', () => {
    render(<Button selected>Tutorial</Button>);
    const button = screen.getByRole('button', { name: 'Tutorial' });
    expect(button).toHaveClass('ui-btn--selected');
    expect(button).toHaveAttribute('aria-pressed', 'true');
  });

  it('omits aria-pressed and selected class when not selected', () => {
    render(<Button>Tutorial</Button>);
    const button = screen.getByRole('button', { name: 'Tutorial' });
    expect(button).not.toHaveClass('ui-btn--selected');
    expect(button).not.toHaveAttribute('aria-pressed');
  });

  it('renders an icon wrapper hidden from assistive tech', () => {
    const { container } = render(<Button icon={<Search />}>Search</Button>);
    const icon = container.querySelector('.ui-btn__icon');
    expect(icon).not.toBeNull();
    expect(icon).toHaveAttribute('aria-hidden', 'true');
  });

  it('supports fullWidth and merges a custom className', () => {
    render(
      <Button fullWidth className="custom-class">
        Wide
      </Button>,
    );
    const button = screen.getByRole('button', { name: 'Wide' });
    expect(button).toHaveClass('ui-btn--full', 'custom-class', 'ui-btn');
  });

  it('forwards native props like disabled', () => {
    render(<Button disabled>Nope</Button>);
    expect(screen.getByRole('button', { name: 'Nope' })).toBeDisabled();
  });
});
