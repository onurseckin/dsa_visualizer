import { describe, expect, it } from "vitest";
import {
  gridPathsDp,
  generateGridPathsDpSteps,
  DEFAULT_GRID_PATHS_INPUT,
  type GridPathsDpInput,
} from "../gridPathsDp";

describe("gridPathsDp algorithm logic spec", () => {
  it("has categories ['dp_2d'] and valid metadata", () => {
    expect(gridPathsDp.id).toBe("grid-paths-dp");
    expect(gridPathsDp.categories).toEqual(["dp_2d"]);
    expect(gridPathsDp.difficulty).toBe("Medium");
    expect(gridPathsDp.code).toContain("def unique_paths_with_obstacles");
  });

  it("generates valid steps for default input", () => {
    const steps = generateGridPathsDpSteps(DEFAULT_GRID_PATHS_INPUT);
    expect(steps.length).toBeGreaterThan(0);
    const lastStep = steps[steps.length - 1];
    expect(lastStep.primarySnapshot.kind).toBe("grid");
    expect(lastStep.variables.result).toBe(2);
  });

  it("handles blocked start cell", () => {
    const steps = generateGridPathsDpSteps({
      grid: [
        [1, 0],
        [0, 0],
      ],
    });
    const lastStep = steps[steps.length - 1];
    expect(lastStep.variables.result).toBe(0);
  });

  it("handles empty / default input fallback", () => {
    const steps = generateGridPathsDpSteps({} as GridPathsDpInput);
    expect(steps.length).toBeGreaterThan(0);
  });

  it("provides 3 typed examples (basic, complex, negative) that generate steps without errors", () => {
    expect(gridPathsDp.examples).toHaveLength(3);
    expect(gridPathsDp.examples?.map((ex) => ex.kind)).toEqual(["basic", "complex", "negative"]);

    for (const example of gridPathsDp.examples!) {
      const steps = gridPathsDp.generateSteps(example.input as GridPathsDpInput);
      expect(steps.length).toBeGreaterThan(0);
    }
  });
});
