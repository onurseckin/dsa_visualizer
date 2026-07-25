import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { MainLayout } from '../../../components/MainLayout';
import {
  bellmanFord,
  DEFAULT_BELLMAN_FORD_INPUT,
  generateBellmanFordSteps,
} from '../bellmanFord';

describe('bellmanFord React component spec', () => {
  it('renders algorithm title and expands the description in MainLayout', () => {
    const steps = generateBellmanFordSteps(DEFAULT_BELLMAN_FORD_INPUT);
    const noop = vi.fn();

    render(
      <MainLayout
        algorithm={bellmanFord}
        currentStep={steps[0]}
        viewMode="split"
        showTutorial={true}
        showAuxiliary={true}
        onToggleTutorial={noop}
        onToggleAuxiliary={noop}
      />
    );

    expect(screen.getByText('Bellman-Ford Shortest Path')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /details/i }));

    expect(
      screen.getByText(/computes shortest paths from one source vertex to every other vertex/i)
    ).toBeInTheDocument();
  });

  it('renders auxiliary distance table and graph visualizer without crashing', () => {
    const steps = generateBellmanFordSteps(DEFAULT_BELLMAN_FORD_INPUT);
    const midStep = steps[Math.floor(steps.length / 2)];
    const noop = vi.fn();

    render(
      <MainLayout
        algorithm={bellmanFord}
        currentStep={midStep}
        viewMode="split"
        showTutorial={true}
        showAuxiliary={true}
        onToggleTutorial={noop}
        onToggleAuxiliary={noop}
      />
    );

    expect(screen.getByText('Working data')).toBeInTheDocument();
    expect(screen.getAllByText('Distances')[0]).toBeInTheDocument();
    expect(screen.getByText('Visited (5)')).toBeInTheDocument();
  });
});
