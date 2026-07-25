import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { MainLayout } from '../../../components/MainLayout';
import {
  DEFAULT_TWO_SUM_SORTED_INPUT,
  generateTwoSumSortedSteps,
  twoSumSorted,
} from '../twoSumSorted';

describe('TwoSumSorted React Component Spec', () => {
  it('renders title and algorithm information correctly', () => {
    const steps = generateTwoSumSortedSteps(DEFAULT_TWO_SUM_SORTED_INPUT);
    const noop = vi.fn();

    render(
      <MainLayout
        algorithm={twoSumSorted}
        currentStep={steps[0]}
        viewMode="split"
        showTutorial={true}
        showAuxiliary={true}
        onToggleTutorial={noop}
        onToggleAuxiliary={noop}
      />
    );

    expect(screen.getByText('Two Sum II (Sorted)')).toBeInTheDocument();

    // The problem description is collapsed by default; expand it first.
    fireEvent.click(screen.getByRole('button', { name: /details/i }));
    expect(
      screen.getAllByText(/Find two numbers in a sorted array/i)[0]
    ).toBeInTheDocument();
  });

  it('renders step visualizer with two pointers and match status', () => {
    const steps = generateTwoSumSortedSteps(DEFAULT_TWO_SUM_SORTED_INPUT);
    const lastStep = steps[steps.length - 1];
    const noop = vi.fn();

    render(
      <MainLayout
        algorithm={twoSumSorted}
        currentStep={lastStep}
        viewMode="split"
        showTutorial={true}
        showAuxiliary={true}
        onToggleTutorial={noop}
        onToggleAuxiliary={noop}
      />
    );

    expect(screen.getByText(/Return the pair \[0, 6\]/i)).toBeInTheDocument();
    expect(screen.getAllByText('MATCH').length).toBeGreaterThan(0);
  });
});
