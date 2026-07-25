import { describe, expect, it } from 'vitest';
import {
  polygonArea,
  DEFAULT_POLYGON_AREA_INPUT,
  generatePolygonAreaSteps,
  PYTHON_POLYGON_AREA_CODE,
} from '../polygonArea';
import type { GraphVisualSnapshot } from '../../../types/dsa';

describe('polygonArea spec logic', () => {
  it('has category math_and_geometry and valid metadata', () => {
    expect(polygonArea.id).toBe('polygon-area');
    expect(polygonArea.category).toBe('math_and_geometry');
    expect(polygonArea.defaultInput).toEqual(DEFAULT_POLYGON_AREA_INPUT);
    expect(polygonArea.code).toBe(PYTHON_POLYGON_AREA_CODE);
  });

  it('generates correct steps for default polygon input', () => {
    const steps = generatePolygonAreaSteps(DEFAULT_POLYGON_AREA_INPUT);
    expect(steps.length).toBeGreaterThan(0);

    const lastStep = steps[steps.length - 1];
    const snap = lastStep.primarySnapshot as GraphVisualSnapshot;
    expect(snap.kind).toBe('graph');
    expect(lastStep.variables.final_area).toBe(50000);
  });

  it('handles square input correctly', () => {
    const squareInput = {
      points: [
        { x: 0, y: 0 },
        { x: 10, y: 0 },
        { x: 10, y: 10 },
        { x: 0, y: 10 },
      ],
    };
    const steps = generatePolygonAreaSteps(squareInput);
    const lastStep = steps[steps.length - 1];
    expect(lastStep.variables.final_area).toBe(100);
  });

  it('returns area 0 for less than 3 points', () => {
    const invalidInput = {
      points: [
        { x: 0, y: 0 },
        { x: 5, y: 5 },
      ],
    };
    const steps = generatePolygonAreaSteps(invalidInput);
    const lastStep = steps[steps.length - 1];
    expect(lastStep.variables.area).toBe(0);
  });
});
