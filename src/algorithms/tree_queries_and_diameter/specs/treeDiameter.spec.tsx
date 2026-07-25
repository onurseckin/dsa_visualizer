import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { MainLayout } from '../../../components/MainLayout';
import {
  treeDiameter,
  DEFAULT_TREE_DIAMETER_INPUT,
  generateTreeDiameterSteps,
} from '../treeDiameter';

describe('TreeDiameter React Component Spec', () => {
  it('renders algorithm title and problem header', () => {
    const steps = generateTreeDiameterSteps(DEFAULT_TREE_DIAMETER_INPUT);
    const noop = vi.fn();

    render(
      <MainLayout
        algorithm={treeDiameter}
        currentStep={steps[0]}
        viewMode="split"
        showTutorial={true}
        showAuxiliary={true}
        onToggleTutorial={noop}
        onToggleAuxiliary={noop}
      />
    );

    expect(
      screen.getByText('Tree Diameter (2-DFS Algorithm)')
    ).toBeInTheDocument();
    expect(
      screen.getByText(/longest simple path/i)
    ).toBeInTheDocument();
  });

  it('renders tree visualizer and auxiliary state', () => {
    const steps = generateTreeDiameterSteps(DEFAULT_TREE_DIAMETER_INPUT);
    const midStep = steps[4];
    const noop = vi.fn();

    render(
      <MainLayout
        algorithm={treeDiameter}
        currentStep={midStep}
        viewMode="split"
        showTutorial={true}
        showAuxiliary={true}
        onToggleTutorial={noop}
        onToggleAuxiliary={noop}
      />
    );

    expect(screen.getAllByText(/DFS 1/i)[0]).toBeInTheDocument();
    expect(screen.getByText(/Auxiliary Helper Data Structures/i)).toBeInTheDocument();
  });
});
