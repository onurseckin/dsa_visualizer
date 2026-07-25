import { render, screen, fireEvent } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { TutorialCard } from '../primitives/TutorialCard';
import type { StepExplanation } from '../../types/dsa';

describe('TutorialCard Component Spec', () => {
  const sampleExplanation: StepExplanation = {
    what: 'Compare 5 with the pivot 3',
    why: 'We need smaller elements on the left side, so we check where 5 belongs before moving on.',
  };

  it('renders the step label and one flowing paragraph with a bold lead-in', () => {
    render(
      <TutorialCard
        explanation={sampleExplanation}
        stepIndex={2}
        totalSteps={10}
        codeLine={14}
      />
    );

    expect(screen.getByText('Step 3 of 10')).toBeInTheDocument();

    // The "what" becomes a bold lead-in sentence with terminal punctuation.
    const lead = screen.getByText('Compare 5 with the pivot 3.');
    expect(lead.tagName).toBe('STRONG');

    expect(
      screen.getByText(/We need smaller elements on the left side/i)
    ).toBeInTheDocument();

    // No WHAT/WHY section headers in the teacher strip.
    expect(screen.queryByText(/^what$/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/^why$/i)).not.toBeInTheDocument();
  });

  it('omits the total when only stepIndex is known', () => {
    render(<TutorialCard explanation={sampleExplanation} stepIndex={0} />);
    expect(screen.getByText('Step 1')).toBeInTheDocument();
  });

  it('invokes onClose from the "Hide tutorial" icon button', () => {
    const handleClose = vi.fn();
    render(
      <TutorialCard
        explanation={sampleExplanation}
        stepIndex={0}
        onClose={handleClose}
      />
    );

    const closeBtn = screen.getByRole('button', { name: /Hide tutorial/i });
    fireEvent.click(closeBtn);
    expect(handleClose).toHaveBeenCalled();
  });

  it('renders nothing when there is no explanation text', () => {
    const { container } = render(<TutorialCard stepIndex={0} totalSteps={5} />);
    expect(container).toBeEmptyDOMElement();
  });
});
