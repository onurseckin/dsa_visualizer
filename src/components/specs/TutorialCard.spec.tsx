import { render, screen, fireEvent } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { TutorialCard } from '../primitives/TutorialCard';
import type { StepExplanation } from '../../types/dsa';

describe('TutorialCard Component Spec', () => {
  const sampleExplanation: StepExplanation = {
    what: 'Comparing element at index 0 (val 5) with pivot (val 3).',
    why: 'Partitioning step requires smaller elements on the left side.',
  };

  it('renders step number, line indicator, and natural teacher explanation prose', () => {
    render(
      <TutorialCard
        explanation={sampleExplanation}
        stepIndex={2}
        totalSteps={10}
        codeLine={14}
      />
    );

    expect(screen.getByText(/Step 3 \/ 10/i)).toBeInTheDocument();
    expect(screen.getByText(/Line 14/i)).toBeInTheDocument();
    expect(
      screen.getByText(/Comparing element at index 0 \(val 5\) with pivot \(val 3\)\. Partitioning step requires smaller elements on the left side\./i)
    ).toBeInTheDocument();
  });

  it('handles optional close callback when provided', () => {
    const handleClose = vi.fn();
    render(
      <TutorialCard
        explanation={sampleExplanation}
        stepIndex={0}
        onClose={handleClose}
      />
    );

    const closeBtn = screen.getByRole('button', { name: /Dismiss explanation/i });
    fireEvent.click(closeBtn);
    expect(handleClose).toHaveBeenCalled();
  });
});
