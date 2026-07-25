import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { MainLayout } from '../../../components/MainLayout';
import { generateTwoPointersSteps, twoPointers } from '../twoPointers';

describe('TwoPointers React Component Spec', () => {
  it('renders algorithm title and problem description', () => {
    const steps = generateTwoPointersSteps(twoPointers.defaultInput);
    const noop = vi.fn();

    render(
      <MainLayout
        algorithm={twoPointers}
        currentStep={steps[0]}
        viewMode="split"
        showTutorial={true}
        showAuxiliary={true}
        onToggleTutorial={noop}
        onToggleAuxiliary={noop}
      />
    );

    expect(screen.getByText('Two Pointers (Subarray Sum)')).toBeInTheDocument();

    // The problem description is collapsed by default; expand it first.
    fireEvent.click(screen.getByRole('button', { name: /details/i }));
    expect(
      screen.getAllByText(/Finds a contiguous subarray that sums to a target value/i)[0]
    ).toBeInTheDocument();
  });

  it('renders step visualizer with target sum found status', () => {
    const steps = generateTwoPointersSteps(twoPointers.defaultInput);
    const lastStep = steps[steps.length - 1];
    const noop = vi.fn();

    render(
      <MainLayout
        algorithm={twoPointers}
        currentStep={lastStep}
        viewMode="split"
        showTutorial={true}
        showAuxiliary={true}
        onToggleTutorial={noop}
        onToggleAuxiliary={noop}
      />
    );

    expect(screen.getByText(/Return the window \[1\.\.3\]/i)).toBeInTheDocument();
  });
});
