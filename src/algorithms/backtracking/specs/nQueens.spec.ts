import { describe, expect, it } from 'vitest';
import {
  DEFAULT_NQUEENS_INPUT,
  generateNQueensSteps,
  nQueens,
} from '../nQueens';
import type { GridVisualSnapshot } from '../../../types/dsa';

describe('nQueens algorithm spec', () => {
  it('should have valid definition metadata', () => {
    expect(nQueens.id).toBe('n-queens');
    expect(nQueens.title).toBe('N-Queens Backtracking');
    expect(nQueens.category).toBe('backtracking');
    expect(nQueens.difficulty).toBe('Hard');
    expect(nQueens.defaultInput).toEqual(DEFAULT_NQUEENS_INPUT);
  });

  it('should generate steps and find 2 solutions for 4-Queens', () => {
    const steps = generateNQueensSteps(DEFAULT_NQUEENS_INPUT);
    expect(steps.length).toBeGreaterThan(0);

    const firstStep = steps[0];
    expect(firstStep.codeLine).toBe(1);

    const lastStep = steps[steps.length - 1];
    expect(lastStep.variables.totalSolutions).toBe(2);

    const snapshot = lastStep.primarySnapshot as GridVisualSnapshot;
    expect(snapshot.kind).toBe('grid');
    expect(snapshot.grid).toHaveLength(4);
    expect(snapshot.grid[0]).toHaveLength(4);
  });

  it('should handle N = 1 board correctly', () => {
    const steps = generateNQueensSteps({ n: 1 });
    const lastStep = steps[steps.length - 1];

    expect(lastStep.variables.totalSolutions).toBe(1);
  });
});
