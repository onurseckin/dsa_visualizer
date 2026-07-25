import { describe, expect, it } from 'vitest';
import {
  binarySearchMatrix,
  DEFAULT_BINARY_SEARCH_MATRIX_INPUT,
  generateBinarySearchMatrixSteps,
} from './binarySearchMatrix';
import type { GridVisualSnapshot } from '../../types/dsa';

describe('binarySearchMatrix algorithm spec', () => {
  it('should have valid definition metadata', () => {
    expect(binarySearchMatrix.id).toBe('binary-search-matrix');
    expect(binarySearchMatrix.title).toBe('Search a 2D Matrix');
    expect(binarySearchMatrix.category).toBe('fundamentals');
    expect(binarySearchMatrix.difficulty).toBe('Medium');
    expect(binarySearchMatrix.defaultInput).toEqual(DEFAULT_BINARY_SEARCH_MATRIX_INPUT);
  });

  it('should generate steps and find existing target in 2D matrix', () => {
    const steps = generateBinarySearchMatrixSteps(DEFAULT_BINARY_SEARCH_MATRIX_INPUT);
    expect(steps.length).toBeGreaterThan(0);

    const firstStep = steps[0];
    expect(firstStep.codeLine).toBe(4);
    expect(firstStep.variables.low).toBe(0);
    expect(firstStep.variables.high).toBe(11);

    const lastStep = steps[steps.length - 1];
    expect(lastStep.variables.found).toBe(true);
    expect(lastStep.variables.midVal).toBe(3);

    const snapshot = lastStep.primarySnapshot as GridVisualSnapshot;
    expect(snapshot.kind).toBe('grid');
    expect(snapshot.grid).toHaveLength(3);
    expect(snapshot.grid[0]).toHaveLength(4);
    expect(snapshot.grid[0][1].state).toBe('sorted');
  });

  it('should generate steps and handle target not present in matrix', () => {
    const input = {
      matrix: [
        [1, 3, 5],
        [10, 11, 16],
      ],
      target: 15,
    };
    const steps = generateBinarySearchMatrixSteps(input);
    const lastStep = steps[steps.length - 1];

    expect(lastStep.variables.found).toBe(false);
    expect(lastStep.explanation.what).toContain('not found');
  });

  it('should handle single element matrix input correctly', () => {
    const input = {
      matrix: [[42]],
      target: 42,
    };
    const steps = generateBinarySearchMatrixSteps(input);
    expect(steps.length).toBeGreaterThan(0);
    const lastStep = steps[steps.length - 1];

    expect(lastStep.variables.found).toBe(true);
    expect(lastStep.variables.row).toBe(0);
    expect(lastStep.variables.col).toBe(0);
  });
});
