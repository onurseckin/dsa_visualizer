import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { MainLayout } from '../../../components/MainLayout';
import {
  binarySearchMatrix,
  DEFAULT_BINARY_SEARCH_MATRIX_INPUT,
  generateBinarySearchMatrixSteps,
} from '../binarySearchMatrix';

describe('BinarySearchMatrix React Component Spec', () => {
  it('renders algorithm title with problem details expanded by default', () => {
    const steps = generateBinarySearchMatrixSteps(DEFAULT_BINARY_SEARCH_MATRIX_INPUT);
    const noop = vi.fn();

    render(
      <MainLayout
        algorithm={binarySearchMatrix}
        currentStep={steps[0]}
        viewMode="split"
        showTutorial={true}
        showAuxiliary={true}
        onToggleTutorial={noop}
        onToggleAuxiliary={noop}
      />
    );

    expect(screen.getByText('Search a 2D Matrix')).toBeInTheDocument();

    expect(
      screen.getAllByText(/Searches for a target value in an m x n integer matrix/i)[0]
    ).toBeInTheDocument();
    expect(
      screen.getAllByText(/Binary search is not really an array algorithm/i)[0]
    ).toBeInTheDocument();
    expect(screen.getByText('The flattening idea')).toBeInTheDocument();
  });

  it('renders matrix grid visualizer and auxiliary state for search steps', () => {
    const steps = generateBinarySearchMatrixSteps(DEFAULT_BINARY_SEARCH_MATRIX_INPUT);
    const midStep = steps[1];
    const noop = vi.fn();

    render(
      <MainLayout
        algorithm={binarySearchMatrix}
        currentStep={midStep}
        viewMode="split"
        showTutorial={true}
        showAuxiliary={true}
        onToggleTutorial={noop}
        onToggleAuxiliary={noop}
      />
    );

    expect(screen.getByText(/Probe the middle at index/i)).toBeInTheDocument();
    expect(screen.getByText('Working data')).toBeInTheDocument();
    // low/high/mid/target pointers surface in the customState "State" row.
    expect(screen.getAllByText('State')[0]).toBeInTheDocument();
  });
});
