import { describe, expect, it } from 'vitest';
import { bubbleSort, generateBubbleSortSteps } from '../bubbleSort';
import type { ArrayVisualSnapshot } from '../../../types/dsa';

describe('bubbleSort algorithm spec', () => {
  it('should have correct algorithm metadata', () => {
    expect(bubbleSort.id).toBe('bubble-sort');
    expect(bubbleSort.title).toBe('Bubble Sort');
    expect(bubbleSort.category).toBe('arrays_and_hashing');
    expect(bubbleSort.defaultInput).toEqual([5, 2, 8, 1, 4]);
  });

  it('should generate valid steps for default input', () => {
    const steps = generateBubbleSortSteps(bubbleSort.defaultInput);
    expect(steps.length).toBeGreaterThan(0);

    const firstStep = steps[0];
    expect(firstStep.stepIndex).toBe(0);
    expect(firstStep.codeLine).toBe(1);
    expect(firstStep.explanation.what).toContain('Initialize');

    const lastStep = steps[steps.length - 1];
    expect(lastStep.codeLine).toBe(10);
    expect(lastStep.explanation.what).toContain('complete');

    const snapshot = lastStep.primarySnapshot as ArrayVisualSnapshot;
    const finalValues = snapshot.elements.map((el) => el.value);
    expect(finalValues).toEqual([1, 2, 4, 5, 8]);

    snapshot.elements.forEach((el) => {
      expect(el.state).toBe('sorted');
    });
  });

  it('should handle single element array', () => {
    const steps = generateBubbleSortSteps([42]);
    expect(steps.length).toBeGreaterThan(0);
    const lastStep = steps[steps.length - 1];
    const snapshot = lastStep.primarySnapshot as ArrayVisualSnapshot;
    expect(snapshot.elements.map((el) => el.value)).toEqual([42]);
    expect(snapshot.elements[0].state).toBe('sorted');
  });

  it('should handle empty array', () => {
    const steps = generateBubbleSortSteps([]);
    expect(steps.length).toBeGreaterThan(0);
    const lastStep = steps[steps.length - 1];
    const snapshot = lastStep.primarySnapshot as ArrayVisualSnapshot;
    expect(snapshot.elements).toEqual([]);
  });

  it('should handle reverse sorted array', () => {
    const steps = generateBubbleSortSteps([3, 2, 1]);
    const lastStep = steps[steps.length - 1];
    const snapshot = lastStep.primarySnapshot as ArrayVisualSnapshot;
    expect(snapshot.elements.map((el) => el.value)).toEqual([1, 2, 3]);
  });
});
