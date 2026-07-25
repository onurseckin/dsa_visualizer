import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { MainLayout } from '../../../components/MainLayout';
import { bubbleSort, generateBubbleSortSteps } from '../bubbleSort';

describe('BubbleSort React Component Spec', () => {
  it('renders algorithm title and problem description', () => {
    const steps = generateBubbleSortSteps(bubbleSort.defaultInput);
    const noop = vi.fn();

    render(
      <MainLayout
        algorithm={bubbleSort}
        currentStep={steps[0]}
        viewMode="split"
        showTutorial={true}
        showAuxiliary={true}
        onToggleTutorial={noop}
        onToggleAuxiliary={noop}
      />
    );

    expect(screen.getByText('Bubble Sort')).toBeInTheDocument();

    // Problem details are collapsed by default; expand them to reveal the description.
    fireEvent.click(screen.getByRole('button', { name: /details/i }));
    expect(
      screen.getByText(/Bubble Sort is a simple comparison-based sorting algorithm/i)
    ).toBeInTheDocument();
  });

  it('renders step visualizer with element array state', () => {
    const steps = generateBubbleSortSteps(bubbleSort.defaultInput);
    const lastStep = steps[steps.length - 1];
    const noop = vi.fn();

    render(
      <MainLayout
        algorithm={bubbleSort}
        currentStep={lastStep}
        viewMode="split"
        showTutorial={true}
        showAuxiliary={true}
        onToggleTutorial={noop}
        onToggleAuxiliary={noop}
      />
    );

    expect(screen.getByText(/Bubble Sort complete/i)).toBeInTheDocument();
  });
});
