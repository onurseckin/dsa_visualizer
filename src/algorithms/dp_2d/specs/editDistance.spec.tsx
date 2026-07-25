import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import GridVisualizer from '../../../components/primitives/GridVisualizer';
import {
  generateEditDistanceSteps,
  DEFAULT_EDIT_DISTANCE_INPUT,
} from '../editDistance';
import type { GridVisualSnapshot } from '../../../types/dsa';

describe('editDistance React component spec', () => {
  it('renders GridVisualizer with initial DP snapshot', () => {
    const steps = generateEditDistanceSteps(DEFAULT_EDIT_DISTANCE_INPUT);
    const snapshot = steps[0].primarySnapshot as GridVisualSnapshot;

    render(<GridVisualizer grid={snapshot.grid} title="Edit Distance DP Table" />);

    expect(screen.getByText('Edit Distance DP Table')).toBeInTheDocument();
  });

  it('renders active cell and comparison cells during tabulation', () => {
    const steps = generateEditDistanceSteps(DEFAULT_EDIT_DISTANCE_INPUT);
    const midStep = steps[Math.floor(steps.length / 2)];
    const snapshot = midStep.primarySnapshot as GridVisualSnapshot;

    const { container } = render(<GridVisualizer grid={snapshot.grid} showDistance={true} />);
    expect(container.firstChild).toBeInTheDocument();
  });
});
