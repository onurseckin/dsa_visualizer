import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { MainLayout } from '../../../components/MainLayout';
import {
  DEFAULT_SLIDING_WINDOW_MIN_INPUT,
  generateSlidingWindowMinSteps,
  slidingWindowMin,
} from '../slidingWindowMin';

describe('SlidingWindowMin React Component Spec', () => {
  it('renders algorithm header and title', () => {
    const steps = generateSlidingWindowMinSteps(DEFAULT_SLIDING_WINDOW_MIN_INPUT);
    const noop = vi.fn();

    render(
      <MainLayout
        algorithm={slidingWindowMin}
        currentStep={steps[0]}
        viewMode="split"
        showTutorial={true}
        showAuxiliary={true}
        onToggleTutorial={noop}
        onToggleAuxiliary={noop}
      />
    );

    expect(screen.getByText('Sliding Window Minimum')).toBeInTheDocument();

    expect(
      screen.getAllByText(/Finds the minimum element in every contiguous sliding window/i)[0]
    ).toBeInTheDocument();
    expect(
      screen.getAllByText(/monotonic deque is a double-ended queue/i)[0]
    ).toBeInTheDocument();
  });

  it('renders monotonic deque status in auxiliary panel', () => {
    const steps = generateSlidingWindowMinSteps(DEFAULT_SLIDING_WINDOW_MIN_INPUT);
    const stepWithQueue = steps.find((s) => (s.auxiliaryState.queue?.length ?? 0) > 0) || steps[1];
    const noop = vi.fn();

    render(
      <MainLayout
        algorithm={slidingWindowMin}
        currentStep={stepWithQueue}
        viewMode="split"
        showTutorial={true}
        showAuxiliary={true}
        onToggleTutorial={noop}
        onToggleAuxiliary={noop}
      />
    );

    // The monotonic deque lands in the AuxiliaryPanel's "Queue" row of the "Working data" card.
    expect(screen.getByText('Working data')).toBeInTheDocument();
    expect(screen.getAllByText('Queue')[0]).toBeInTheDocument();
  });
});
