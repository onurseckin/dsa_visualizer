import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import ArrayVisualizer from '../../components/primitives/ArrayVisualizer';
import {
  generateMergeIntervalsSteps,
  DEFAULT_MERGE_INTERVALS_INPUT,
} from './mergeIntervals';
import type { ArrayVisualSnapshot } from '../../types/dsa';

describe('mergeIntervals React spec (category root)', () => {
  it('renders ArrayVisualizer correctly', () => {
    const steps = generateMergeIntervalsSteps(DEFAULT_MERGE_INTERVALS_INPUT);
    const snapshot = steps[steps.length - 1].primarySnapshot as ArrayVisualSnapshot;

    render(
      <ArrayVisualizer
        elements={snapshot.elements}
        title="Merge Intervals"
      />
    );

    expect(screen.getByText('Merge Intervals')).toBeInTheDocument();
  });
});
