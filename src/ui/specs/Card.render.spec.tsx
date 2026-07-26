import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Activity } from 'lucide-react';
import { Card } from '../Card';

describe('Card', () => {
  it('renders children in an md-padded body without a header by default', () => {
    const { container } = render(<Card>Body content</Card>);
    expect(screen.getByText('Body content')).toHaveClass('ui-card__body', 'ui-card__body--md');
    expect(container.querySelector('.ui-card__header')).toBeNull();
  });

  it('renders a header with title, icon, and actions', () => {
    const { container } = render(
      <Card title="Complexity" icon={<Activity />} actions={<button>Collapse</button>}>
        Details
      </Card>,
    );
    expect(screen.getByText('Complexity')).toHaveClass('ui-card__title');
    expect(container.querySelector('.ui-card__icon')).not.toBeNull();
    expect(screen.getByRole('button', { name: 'Collapse' })).toBeInTheDocument();
  });

  it('supports padding variants and the inset surface', () => {
    const { container } = render(
      <Card padding="none" inset>
        Tight
      </Card>,
    );
    expect(container.querySelector('.ui-card')).toHaveClass('ui-card--inset');
    expect(screen.getByText('Tight')).toHaveClass('ui-card__body--none');
  });

  it('merges custom className on the root', () => {
    const { container } = render(<Card className="my-card">X</Card>);
    expect(container.querySelector('.ui-card')).toHaveClass('my-card');
  });
});
