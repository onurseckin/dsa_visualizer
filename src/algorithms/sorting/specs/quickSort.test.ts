import { describe, expect, it } from 'vitest';
import { generateQuickSortSteps, quickSort } from '../quickSort';
import type { ArrayVisualSnapshot } from '../../../types/dsa';

describe('quickSort algorithm', () => {
  it('should have correct metadata', () => {
    expect(quickSort.id).toBe('quick-sort');
    expect(quickSort.title).toBe('Quick Sort');
    expect(quickSort.category).toBe('sorting');
    expect(quickSort.defaultInput).toEqual([6, 2, 9, 3, 7, 1, 5]);
  });

  it('should generate steps with call stack auxiliary state and sort default input correctly', () => {
    const steps = generateQuickSortSteps(quickSort.defaultInput);
    expect(steps.length).toBeGreaterThan(0);

    // Check that auxiliaryState.stack is populated in recursive steps
    const hasStackFrames = steps.some(
      (step) => step.auxiliaryState.stack && step.auxiliaryState.stack.length > 0
    );
    expect(hasStackFrames).toBe(true);

    // Check that pivot state is used in partition steps
    const hasPivotState = steps.some((step) => {
      const snap = step.primarySnapshot as ArrayVisualSnapshot;
      return snap.elements.some((el) => el.state === 'pivot');
    });
    expect(hasPivotState).toBe(true);

    // Check final step
    const lastStep = steps[steps.length - 1];
    expect(lastStep.codeLine).toBe(7);

    const finalSnapshot = lastStep.primarySnapshot as ArrayVisualSnapshot;
    const finalValues = finalSnapshot.elements.map((el) => el.value);
    expect(finalValues).toEqual([1, 2, 3, 5, 6, 7, 9]);
    finalSnapshot.elements.forEach((el) => {
      expect(el.state).toBe('sorted');
    });
  });

  it('should handle single element input', () => {
    const steps = generateQuickSortSteps([10]);
    expect(steps.length).toBeGreaterThan(0);
    const lastStep = steps[steps.length - 1];
    const snap = lastStep.primarySnapshot as ArrayVisualSnapshot;
    expect(snap.elements.map((e) => e.value)).toEqual([10]);
  });

  it('should handle empty input', () => {
    const steps = generateQuickSortSteps([]);
    expect(steps.length).toBeGreaterThan(0);
    const lastStep = steps[steps.length - 1];
    const snap = lastStep.primarySnapshot as ArrayVisualSnapshot;
    expect(snap.elements).toEqual([]);
  });

  it('should handle array with duplicate elements', () => {
    const steps = generateQuickSortSteps([4, 2, 4, 1]);
    const lastStep = steps[steps.length - 1];
    const snap = lastStep.primarySnapshot as ArrayVisualSnapshot;
    expect(snap.elements.map((e) => e.value)).toEqual([1, 2, 4, 4]);
  });
});
