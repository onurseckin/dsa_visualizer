import { describe, it, expect } from 'vitest';
import {
  numberOfIslands,
  generateNumberOfIslandsSteps,
  DEFAULT_NUMBER_OF_ISLANDS_INPUT,
} from '../numberOfIslands';

describe('numberOfIslands algorithm logic spec', () => {
  it('generates valid steps for default input', () => {
    const steps = generateNumberOfIslandsSteps(DEFAULT_NUMBER_OF_ISLANDS_INPUT);
    expect(steps.length).toBeGreaterThan(0);

    const firstStep = steps[0];
    expect(firstStep.primarySnapshot.kind).toBe('grid');

    const lastStep = steps[steps.length - 1];
    expect(lastStep.variables.totalIslands).toBe(3);
  });

  it('correctly counts 1 single large island', () => {
    const input = {
      grid: [
        ['1', '1', '1'],
        ['1', '1', '1'],
      ],
    };
    const steps = generateNumberOfIslandsSteps(input);
    const lastStep = steps[steps.length - 1];
    expect(lastStep.variables.totalIslands).toBe(1);
  });

  it('returns 0 islands when grid is all water', () => {
    const input = {
      grid: [
        ['0', '0'],
        ['0', '0'],
      ],
    };
    const steps = generateNumberOfIslandsSteps(input);
    const lastStep = steps[steps.length - 1];
    expect(lastStep.variables.totalIslands).toBe(0);
  });

  it('handles empty grid gracefully', () => {
    const input = { grid: [] };
    const steps = generateNumberOfIslandsSteps(input);
    expect(steps.length).toBe(1);
    expect(steps[0].variables.count).toBe(0);
  });

  it('has proper algorithm definition metadata', () => {
    expect(numberOfIslands.id).toBe('number-of-islands');
    expect(numberOfIslands.category).toBe('graph');
    expect(numberOfIslands.difficulty).toBe('Medium');
  });
});
