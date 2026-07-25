import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { MainLayout } from '../../../components/MainLayout';
import {
  floydWarshall,
  DEFAULT_FLOYD_WARSHALL_INPUT,
  generateFloydWarshallSteps,
} from '../floydWarshall';

describe('floydWarshall React component spec', () => {
  it('renders algorithm title and the description in MainLayout', () => {
    const steps = generateFloydWarshallSteps(DEFAULT_FLOYD_WARSHALL_INPUT);
    const noop = vi.fn();

    render(
      <MainLayout
        algorithm={floydWarshall}
        currentStep={steps[0]}
        viewMode="split"
        showTutorial={true}
        showAuxiliary={true}
        onToggleTutorial={noop}
        onToggleAuxiliary={noop}
      />
    );

    expect(
      screen.getByText('Floyd-Warshall All-Pairs Shortest Path')
    ).toBeInTheDocument();

    // Details are expanded by default, so the description renders without any interaction.
    expect(
      screen.getByText(/shortest path between every pair of vertices in a weighted directed graph/i)
    ).toBeInTheDocument();
    expect(screen.getByText(/How the triple loop implements that/i)).toBeInTheDocument();
  });

  it('renders auxiliary 2D matrix state and grid visualizer without crashing', () => {
    const steps = generateFloydWarshallSteps(DEFAULT_FLOYD_WARSHALL_INPUT);
    const midStep = steps[Math.floor(steps.length / 2)];
    const noop = vi.fn();

    render(
      <MainLayout
        algorithm={floydWarshall}
        currentStep={midStep}
        viewMode="split"
        showTutorial={true}
        showAuxiliary={true}
        onToggleTutorial={noop}
        onToggleAuxiliary={noop}
      />
    );

    expect(screen.getByText('Working data')).toBeInTheDocument();
    // The all-pairs matrix flattens into the Distances row of the working-data card.
    expect(screen.getAllByText('Distances')[0]).toBeInTheDocument();
    expect(screen.getAllByText('State')[0]).toBeInTheDocument();
  });
});
