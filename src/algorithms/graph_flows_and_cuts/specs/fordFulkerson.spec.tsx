import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { MainLayout } from '../../../components/MainLayout';
import {
  fordFulkerson,
  DEFAULT_FORD_FULKERSON_INPUT,
  generateFordFulkersonSteps,
} from '../fordFulkerson';

describe('fordFulkerson React component spec', () => {
  it('renders algorithm title and the expanded description in MainLayout', () => {
    const steps = generateFordFulkersonSteps(DEFAULT_FORD_FULKERSON_INPUT);
    const noop = vi.fn();

    render(
      <MainLayout
        algorithm={fordFulkerson}
        currentStep={steps[0]}
        viewMode="split"
        showTutorial={true}
        showAuxiliary={true}
        onToggleTutorial={noop}
        onToggleAuxiliary={noop}
      />
    );

    expect(screen.getByText('Ford-Fulkerson Maximum Flow')).toBeInTheDocument();

    expect(
      screen.getByText(/Computes the maximum flow from a source vertex S to a sink vertex T/i)
    ).toBeInTheDocument();
  });

  it('renders auxiliary network flow data and graph visualizer without crashing', () => {
    const steps = generateFordFulkersonSteps(DEFAULT_FORD_FULKERSON_INPUT);
    const midStep = steps[Math.floor(steps.length / 2)];
    const noop = vi.fn();

    render(
      <MainLayout
        algorithm={fordFulkerson}
        currentStep={midStep}
        viewMode="split"
        showTutorial={true}
        showAuxiliary={true}
        onToggleTutorial={noop}
        onToggleAuxiliary={noop}
      />
    );

    expect(screen.getByText('Working data')).toBeInTheDocument();
    expect(screen.getByText('Visited (4)')).toBeInTheDocument();
    // Flow bookkeeping (source/sink/max-flow/augmenting path) lives in the State row chips.
    expect(screen.getAllByText(/Augmenting Path/i)[0]).toBeInTheDocument();
  });
});
