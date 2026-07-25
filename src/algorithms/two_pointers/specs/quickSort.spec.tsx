import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { MainLayout } from '../../../components/MainLayout';
import { generateQuickSortSteps, quickSort } from '../quickSort';

describe('QuickSort React Component Spec', () => {
  it('renders algorithm title and problem description', () => {
    const steps = generateQuickSortSteps(quickSort.defaultInput);
    const noop = vi.fn();

    render(
      <MainLayout
        algorithm={quickSort}
        currentStep={steps[0]}
        viewMode="split"
        showTutorial={true}
        showAuxiliary={true}
        onToggleTutorial={noop}
        onToggleAuxiliary={noop}
      />
    );

    expect(screen.getByText('Quick Sort')).toBeInTheDocument();
    expect(
      screen.getByText(/Quick Sort is an efficient divide-and-conquer sorting algorithm/i)
    ).toBeInTheDocument();
  });

  it('renders step visualizer with call stack auxiliary panel', () => {
    const steps = generateQuickSortSteps(quickSort.defaultInput);
    const stepWithStack = steps.find((s) => (s.auxiliaryState.stack?.length ?? 0) > 0) || steps[0];
    const noop = vi.fn();

    render(
      <MainLayout
        algorithm={quickSort}
        currentStep={stepWithStack}
        viewMode="split"
        showTutorial={true}
        showAuxiliary={true}
        onToggleTutorial={noop}
        onToggleAuxiliary={noop}
      />
    );

    expect(screen.getByText(/Call Stack \(LIFO\)/i)).toBeInTheDocument();
  });
});
