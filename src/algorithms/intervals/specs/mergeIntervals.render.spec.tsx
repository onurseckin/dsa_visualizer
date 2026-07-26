import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import ArrayVisualizer from '../../../components/primitives/ArrayVisualizer';
import { MainLayout } from '../../../components/MainLayout';
import { ALGORITHM_REGISTRY } from '../../registry';
import {
  generateMergeIntervalsSteps,
  DEFAULT_MERGE_INTERVALS_INPUT,
} from '../mergeIntervals';
import type { ArrayVisualSnapshot } from '../../../types/dsa';

describe('mergeIntervals React component spec', () => {
  it('renders ArrayVisualizer with interval snapshot', () => {
    const steps = generateMergeIntervalsSteps(DEFAULT_MERGE_INTERVALS_INPUT);
    const snapshot = steps[steps.length - 1].primarySnapshot as ArrayVisualSnapshot;

    render(
      <ArrayVisualizer
        elements={snapshot.elements}
        title="Merge Intervals Visualizer"
      />
    );

    expect(screen.getByText('Merge Intervals Visualizer')).toBeInTheDocument();
  });

  it('renders MainLayout cleanly with mergeIntervals definition', () => {
    const steps = generateMergeIntervalsSteps(DEFAULT_MERGE_INTERVALS_INPUT);
    render(
      <MainLayout
        algorithm={ALGORITHM_REGISTRY['merge-intervals']}
        currentStep={steps[0]}
        panels={{ visualizer: true, code: true, tutorial: true, auxiliary: true }}
        onToggleTutorial={vi.fn()}
        onToggleAuxiliary={vi.fn()}
      />
    );

    expect(screen.getAllByText(/Merge Intervals/i)[0]).toBeInTheDocument();
  });
});
