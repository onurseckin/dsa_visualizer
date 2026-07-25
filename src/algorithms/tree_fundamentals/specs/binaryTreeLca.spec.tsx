import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { MainLayout } from '../../../components/MainLayout';
import {
  binaryTreeLca,
  DEFAULT_BINARY_TREE_LCA_INPUT,
  generateBinaryTreeLcaSteps,
} from '../binaryTreeLca';

describe('BinaryTreeLca React Component Spec', () => {
  it('renders algorithm title and problem header', () => {
    const steps = generateBinaryTreeLcaSteps(DEFAULT_BINARY_TREE_LCA_INPUT);
    const noop = vi.fn();

    render(
      <MainLayout
        algorithm={binaryTreeLca}
        currentStep={steps[0]}
        viewMode="split"
        showTutorial={true}
        showAuxiliary={true}
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
        algorithm={binaryTreeLca}
        currentStep={midStep}
        viewMode="split"
        showTutorial={true}
        showAuxiliary={true}
        onToggleTutorial={noop}
        onToggleAuxiliary={noop}
      />
    );

    expect(screen.getByText(/Evaluate Node/i)).toBeInTheDocument();
    expect(screen.getByText('Working data')).toBeInTheDocument();
  });
});
