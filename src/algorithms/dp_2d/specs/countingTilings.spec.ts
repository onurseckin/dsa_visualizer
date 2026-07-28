import { describe, expect, it } from "vitest";
import {
  countingTilings,
  generateCountingTilingsSteps,
  DEFAULT_COUNTING_TILINGS_INPUT,
  type CountingTilingsInput,
} from "../countingTilings";

describe("countingTilings algorithm logic spec", () => {
  it("has categories ['dp_2d'] and valid metadata", () => {
    expect(countingTilings.id).toBe("counting-tilings");
    expect(countingTilings.topicIds).toEqual(["dp_2d"]);
    expect(countingTilings.difficulty).toBe("Hard");
    expect(countingTilings.code).toContain("def count_tilings");
  });

  it("generates valid steps for default input (4x3)", () => {
    const steps = generateCountingTilingsSteps(DEFAULT_COUNTING_TILINGS_INPUT);
    expect(steps.length).toBeGreaterThanOrEqual(20);
    const lastStep = steps[steps.length - 1];
    expect(lastStep.primarySnapshot.kind).toBe("grid");
    expect(lastStep.variables.result).toBe(11);
  });

  it("handles odd total area grid (3x3)", () => {
    const steps = generateCountingTilingsSteps({ n: 3, m: 3 });
    const lastStep = steps[steps.length - 1];
    expect(lastStep.variables.result).toBe(0);
  });

  it("handles empty / default input fallback", () => {
    const steps = generateCountingTilingsSteps({} as CountingTilingsInput);
    expect(steps.length).toBeGreaterThan(0);
  });

  it("provides 3 typed examples (basic, complex, negative) that generate steps without errors", () => {
    expect(countingTilings.examples).toHaveLength(3);
    expect(countingTilings.examples?.map((ex) => ex.kind)).toEqual([
      "basic",
      "complex",
      "negative",
    ]);

    for (const example of countingTilings.examples!) {
      const steps = countingTilings.generateSteps(example.input as CountingTilingsInput);
      expect(steps.length).toBeGreaterThan(0);
    }
  });
});
