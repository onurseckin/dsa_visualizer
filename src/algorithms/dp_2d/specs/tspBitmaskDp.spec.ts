import { describe, expect, it } from "vitest";
import {
  tspBitmaskDp,
  generateTspBitmaskDpSteps,
  DEFAULT_TSP_BITMASK_INPUT,
  type TspBitmaskDpInput,
} from "../tspBitmaskDp";

describe("tspBitmaskDp algorithm logic spec", () => {
  it("has categories ['dp_2d'] and valid metadata", () => {
    expect(tspBitmaskDp.id).toBe("tsp-bitmask-dp");
    expect(tspBitmaskDp.categories).toEqual(["dp_2d"]);
    expect(tspBitmaskDp.difficulty).toBe("Hard");
    expect(tspBitmaskDp.code).toContain("def tsp_bitmask");
  });

  it("generates valid steps for default input (4 cities)", () => {
    const steps = generateTspBitmaskDpSteps(DEFAULT_TSP_BITMASK_INPUT);
    expect(steps.length).toBeGreaterThan(0);
    const lastStep = steps[steps.length - 1];
    expect(lastStep.primarySnapshot.kind).toBe("graph");
    expect(lastStep.variables.result).toBe(80);
  });

  it("handles disconnected graph returning -1", () => {
    const INF = Infinity;
    const steps = generateTspBitmaskDpSteps({
      n: 3,
      dist: [
        [0, INF, 5],
        [INF, 0, INF],
        [5, INF, 0],
      ],
    });
    const lastStep = steps[steps.length - 1];
    expect(lastStep.variables.result).toBe(-1);
  });

  it("handles empty / default input fallback", () => {
    const steps = generateTspBitmaskDpSteps({} as TspBitmaskDpInput);
    expect(steps.length).toBeGreaterThan(0);
  });

  it("provides 3 typed examples (basic, complex, negative) that generate steps without errors", () => {
    expect(tspBitmaskDp.examples).toHaveLength(3);
    expect(tspBitmaskDp.examples?.map((ex) => ex.kind)).toEqual(["basic", "complex", "negative"]);

    for (const example of tspBitmaskDp.examples!) {
      const steps = tspBitmaskDp.generateSteps(example.input as TspBitmaskDpInput);
      expect(steps.length).toBeGreaterThan(0);
    }
  });
});
