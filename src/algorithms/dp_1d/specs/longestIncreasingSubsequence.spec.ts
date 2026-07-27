import { describe, expect, it } from "vitest";
import {
  longestIncreasingSubsequence,
  generateLisSteps,
  DEFAULT_LIS_INPUT,
  type LongestIncreasingSubsequenceInput,
} from "../longestIncreasingSubsequence";

describe("longestIncreasingSubsequence algorithm logic spec", () => {
  it("has categories ['dp_1d'] and valid metadata", () => {
    expect(longestIncreasingSubsequence.id).toBe("longest-increasing-subsequence");
    expect(longestIncreasingSubsequence.categories).toEqual(["dp_1d"]);
    expect(longestIncreasingSubsequence.difficulty).toBe("Medium");
    expect(longestIncreasingSubsequence.code).toContain("def length_of_lis");
  });

  it("generates valid steps for default input", () => {
    const steps = generateLisSteps(DEFAULT_LIS_INPUT);
    expect(steps.length).toBeGreaterThan(0);
    const lastStep = steps[steps.length - 1];
    expect(lastStep.primarySnapshot.kind).toBe("array");
    expect(lastStep.variables.result).toBe(4);
  });

  it("handles identical elements case", () => {
    const steps = generateLisSteps({ nums: [7, 7, 7, 7, 7] });
    const lastStep = steps[steps.length - 1];
    expect(lastStep.variables.result).toBe(1);
  });

  it("handles empty / default input fallback", () => {
    const steps = generateLisSteps({} as LongestIncreasingSubsequenceInput);
    expect(steps.length).toBeGreaterThan(0);
  });

  it("provides 3 typed examples (basic, complex, negative) that generate steps without errors", () => {
    expect(longestIncreasingSubsequence.examples).toHaveLength(3);
    expect(longestIncreasingSubsequence.examples?.map((ex) => ex.kind)).toEqual([
      "basic",
      "complex",
      "negative",
    ]);

    for (const example of longestIncreasingSubsequence.examples!) {
      const steps = longestIncreasingSubsequence.generateSteps(
        example.input as LongestIncreasingSubsequenceInput,
      );
      expect(steps.length).toBeGreaterThan(0);
    }
  });
});
