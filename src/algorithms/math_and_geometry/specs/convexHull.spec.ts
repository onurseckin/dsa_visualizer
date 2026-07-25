import { describe, it, expect } from 'vitest';
import {
  convexHull,
  generateConvexHullSteps,
  DEFAULT_CONVEX_HULL_INPUT,
} from '../convexHull';

describe('convexHull algorithm logic spec', () => {
  it('generates valid steps for default 2D points input', () => {
    const steps = generateConvexHullSteps(DEFAULT_CONVEX_HULL_INPUT);
    expect(steps.length).toBeGreaterThan(0);

    const firstStep = steps[0];
    expect(firstStep.primarySnapshot.kind).toBe('graph');

    const lastStep = steps[steps.length - 1];
    expect(lastStep.variables.hullVerticesCount).toBeGreaterThanOrEqual(3);
  });

  it('correctly finds hull for a simple triangle plus interior point', () => {
    const input = {
      points: [
        { x: 0, y: 0, id: 'A' },
        { x: 0, y: 100, id: 'B' },
        { x: 100, y: 0, id: 'C' },
        { x: 20, y: 20, id: 'Inside' },
      ],
    };
    const steps = generateConvexHullSteps(input);
    const lastStep = steps[steps.length - 1];
    expect(lastStep.variables.hullVerticesCount).toBe(3);
  });

  it('handles empty points array gracefully', () => {
    const steps = generateConvexHullSteps({ points: [] });
    expect(steps.length).toBe(1);
    expect(steps[0].variables.hullSize).toBe(0);
  });

  it('verifies algorithm definition metadata', () => {
    expect(convexHull.id).toBe('convex-hull');
    expect(convexHull.category).toBe('advanced');
    expect(convexHull.difficulty).toBe('Hard');
  });
});
