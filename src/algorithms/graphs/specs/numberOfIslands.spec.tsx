import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import GridVisualizer from '../../../components/primitives/GridVisualizer';
import {
  generateNumberOfIslandsSteps,
  DEFAULT_NUMBER_OF_ISLANDS_INPUT,
} from '../numberOfIslands';
import type { GridVisualSnapshot } from '../../../types/dsa';

describe('numberOfIslands React component spec', () => {
  it('renders GridVisualizer with generated snapshot steps', () => {
    const steps = generateNumberOfIslandsSteps(DEFAULT_NUMBER_OF_ISLANDS_INPUT);
    const snapshot = steps[0].primarySnapshot as GridVisualSnapshot;

    render(<GridVisualizer grid={snapshot.grid} title="Number of Islands" />);

    expect(screen.getByText('Number of Islands')).toBeInTheDocument();
  });

  it('renders visited and active grid states properly without crash', () => {
    const steps = generateNumberOfIslandsSteps(DEFAULT_NUMBER_OF_ISLANDS_INPUT);
    const midStep = steps[Math.floor(steps.length / 2)];
    const snapshot = midStep.primarySnapshot as GridVisualSnapshot;

    const { container } = render(<GridVisualizer grid={snapshot.grid} />);
    expect(container.firstChild).toBeInTheDocument();
  });
});
