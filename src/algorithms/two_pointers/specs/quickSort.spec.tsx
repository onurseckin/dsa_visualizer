import { fireEvent, render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { MainLayout } from '../../../components/MainLayout';
import { generateQuickSortSteps, quickSort } from '../quickSort';

/* The AuxiliaryPanel card is the only reliable scope for short row labels
   like "Stack" that also appear in badges and segmented controls. */
const getWorkingDataCard = (): HTMLElement => {
  const card = screen.getByText('Working data').closest('.ui-card');
  if (!(card instanceof HTMLElement)) {
    throw new Error('Working data card not found');
  }
  return card;
};

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

    // The problem description is collapsed by default; expand it first.
    fireEvent.click(screen.getByRole('button', { name: /details/i }));
    expect(
      screen.getAllByText(
        /Quick Sort is an efficient divide-and-conquer sorting algorithm/i
      )[0]
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

    const aux = within(getWorkingDataCard());
    expect(aux.getByText('Stack')).toBeInTheDocument();
    // Default input has 7 elements, so the first pushed frame spans [0..6].
    expect(aux.getAllByText(/quickSort\(0, 6\)/)[0]).toBeInTheDocument();
  });
});
