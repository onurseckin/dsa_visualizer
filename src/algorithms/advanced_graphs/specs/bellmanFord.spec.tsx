import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { MainLayout } from '../../../components/MainLayout';
import {
  bellmanFord,
  DEFAULT_BELLMAN_FORD_INPUT,
  generateBellmanFordSteps,
} from '../bellmanFord';

describe('bellmanFord React component spec', () => {
  it('renders algorithm title and description header in MainLayout', () => {
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

    expect(screen.getByText(/Auxiliary Helper Data Structures/i)).toBeInTheDocument();
  });
});
