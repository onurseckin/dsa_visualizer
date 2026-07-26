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
      <TutorialCard explanation={sampleExplanation} stepIndex={2} totalSteps={10} />
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

  it('renders as a flush band with no chrome and no height of its own', () => {
    const { container } = render(<TutorialCard explanation={sampleExplanation} stepIndex={0} />);

    const strip = container.querySelector('.ui-card');
    expect(strip).toBeInstanceOf(HTMLElement);
    const style = (strip as HTMLElement).style;

    /* It sits inside the visualizer panel now (R5.2), which owns the band fill and
       the single divider facing the canvas — drawing any of that here would double
       the edge and cover the panel's fill. */
    expect(style.borderWidth).toBe('0px');
    expect(style.borderRadius).toBe('0');
    expect(style.boxShadow).toBe('none');
    expect(style.background).toBe('transparent');
    // The visualizer panel has to be able to hug it, so it pins no height (R5.3).
    expect(style.height).toBe('');
    expect(style.minHeight).toBe('');
    expect(style.flex).toBe('');
  });

  it('keeps the step counter on the same row as the prose', () => {
    render(
      <TutorialCard explanation={sampleExplanation} stepIndex={2} totalSteps={10} />
    );

    const label = screen.getByText('Step 3 of 10');
    const paragraph = screen.getByText(/We need smaller elements on the left side/i);
    // Same flex row: a stacked label would make the strip twice as tall.
    expect(label.parentElement).toBe(paragraph.parentElement);
  });

  it('renders no card header band above the strip', () => {
    const { container } = render(<TutorialCard explanation={sampleExplanation} stepIndex={0} />);
    expect(container.querySelector('.ui-card__header')).toBeNull();
  });
});
