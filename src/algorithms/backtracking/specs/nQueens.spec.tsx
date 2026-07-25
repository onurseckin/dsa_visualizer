import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { MainLayout } from '../../../components/MainLayout';
import {
  DEFAULT_NQUEENS_INPUT,
  generateNQueensSteps,
  nQueens,
} from '../nQueens';

describe('NQueens React Component Spec', () => {
  it('renders algorithm title and problem header', () => {
    const steps = generateNQueensSteps(DEFAULT_NQUEENS_INPUT);
    const noop = vi.fn();

    render(
      <MainLayout
        algorithm={nQueens}
        currentStep={steps[0]}
        viewMode="split"
        showTutorial={true}
        showAuxiliary={true}
        onToggleTutorial={noop}
        onToggleAuxiliary={noop}
      />
    );

    expect(screen.getByText('N-Queens Backtracking')).toBeInTheDocument();

    // Problem details are collapsed by default; expand them to reveal the description.
    fireEvent.click(screen.getByRole('button', { name: /details/i }));
    expect(
      screen.getByText(/placing N chess queens on an N×N chessboard/i)
    ).toBeInTheDocument();
  });

  it('renders grid visualizer and auxiliary state for N-Queens steps', () => {
    const steps = generateNQueensSteps(DEFAULT_NQUEENS_INPUT);
    const midStep = steps[3];
    const noop = vi.fn();

    render(
      <MainLayout
        algorithm={nQueens}
        currentStep={midStep}
        viewMode="split"
        showTutorial={true}
        showAuxiliary={true}
        onToggleTutorial={noop}
        onToggleAuxiliary={noop}
      />
    );

    expect(screen.getByText(/Place a queen/i)).toBeInTheDocument();
    expect(screen.getByText('Working data')).toBeInTheDocument();
    // Backtracking state (n, activeQueens, solutionsFound) renders as chips in the State row.
    expect(screen.getByText('activeQueens')).toBeInTheDocument();
    // solutionsFound also appears in the variables readout, so scope to the first match.
    expect(screen.getAllByText('solutionsFound')[0]).toBeInTheDocument();
  });
});
