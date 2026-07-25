import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { MainLayout } from '../../../components/MainLayout';
import {
  kosarajuScc,
  DEFAULT_KOSARAJU_INPUT,
  generateKosarajuSccSteps,
} from '../kosarajuScc';

describe('KosarajuScc React Component Spec', () => {
  it('renders algorithm title and shows problem details expanded by default', () => {
    const steps = generateKosarajuSccSteps(DEFAULT_KOSARAJU_INPUT);
    const noop = vi.fn();

    render(
      <MainLayout
        algorithm={kosarajuScc}
        currentStep={steps[0]}
        viewMode="split"
        showTutorial={true}
        showAuxiliary={true}
        onToggleTutorial={noop}
        onToggleAuxiliary={noop}
      />
    );

    expect(
      screen.getAllByText(/Kosaraju's Strongly Connected Components/i)[0]
    ).toBeInTheDocument();

    expect(
      screen.getByText(/Finds all Strongly Connected Components/i)
    ).toBeInTheDocument();
  });

  it('renders graph visualizer and auxiliary state', () => {
    const steps = generateKosarajuSccSteps(DEFAULT_KOSARAJU_INPUT);
    const midStep = steps[3];
    const noop = vi.fn();

    render(
      <MainLayout
        algorithm={kosarajuScc}
        currentStep={midStep}
        viewMode="split"
        showTutorial={true}
        showAuxiliary={true}
        onToggleTutorial={noop}
        onToggleAuxiliary={noop}
      />
    );

    // Phase chip in the "State" row reports the current DFS pass.
    expect(screen.getAllByText(/Pass 1/i)[0]).toBeInTheDocument();
    expect(screen.getByText('Working data')).toBeInTheDocument();
    expect(screen.getByText('Visited (1)')).toBeInTheDocument();
  });
});
