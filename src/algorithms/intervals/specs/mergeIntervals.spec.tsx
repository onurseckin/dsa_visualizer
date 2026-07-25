import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import ArrayVisualizer from '../../../components/primitives/ArrayVisualizer';
import { MainLayout } from '../../../components/MainLayout';
import {
  mergeIntervals,
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
        algorithm={mergeIntervals}
        currentStep={steps[0]}
        viewMode="split"
        showTutorial={true}
        showAuxiliary={true}
        onToggleTutorial={vi.fn()}
        onToggleAuxiliary={vi.fn()}
      />
    );

    expect(screen.getAllByText(/Merge Intervals/i)[0]).toBeInTheDocument();
  });
});
