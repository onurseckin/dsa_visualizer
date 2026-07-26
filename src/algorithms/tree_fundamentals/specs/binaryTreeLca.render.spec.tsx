import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { MainLayout } from '../../../components/MainLayout';
import { ALGORITHM_REGISTRY } from '../../registry';
import {
  DEFAULT_BINARY_TREE_LCA_INPUT,
  generateBinaryTreeLcaSteps,
} from '../binaryTreeLca';

describe('BinaryTreeLca React Component Spec', () => {
  it('renders algorithm title and problem header', () => {
    const steps = generateBinaryTreeLcaSteps(DEFAULT_BINARY_TREE_LCA_INPUT);
    const noop = vi.fn();

    render(
      <MainLayout
        algorithm={ALGORITHM_REGISTRY['binary-tree-lca']}
        currentStep={steps[0]}
        panels={{ visualizer: true, code: true, tutorial: true, auxiliary: true }}
        onToggleTutorial={noop}
        onToggleAuxiliary={noop}
      />
    );

    expect(
      screen.getByText('Lowest Common Ancestor of a Binary Tree')
    ).toBeInTheDocument();

    // Problem details render expanded, so the description needs no disclosure click.
    expect(
      screen.getAllByText(/find the lowest common ancestor \(LCA\) node/i)[0]
    ).toBeInTheDocument();
  });

  it('renders tree visualizer and call stack auxiliary state', () => {
    const steps = generateBinaryTreeLcaSteps(DEFAULT_BINARY_TREE_LCA_INPUT);
    const midStep = steps[3];
    const noop = vi.fn();

    render(
      <MainLayout
        algorithm={ALGORITHM_REGISTRY['binary-tree-lca']}
        currentStep={midStep}
        panels={{ visualizer: true, code: true, tutorial: true, auxiliary: true }}
        onToggleTutorial={noop}
        onToggleAuxiliary={noop}
      />
    );

    expect(screen.getByText(/Evaluate Node/i)).toBeInTheDocument();
    expect(screen.getByText(/Working Data/i)).toBeInTheDocument();
  });
});
