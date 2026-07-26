import { describe, it, expect } from "vitest";
import {
  mergeIntervals,
  generateMergeIntervalsSteps,
  DEFAULT_MERGE_INTERVALS_INPUT,
} from "../mergeIntervals";

describe("mergeIntervals logic spec", () => {
  it("generates valid steps for default input", () => {
    const steps = generateMergeIntervalsSteps(DEFAULT_MERGE_INTERVALS_INPUT);
    expect(steps.length).toBeGreaterThan(0);

    const firstStep = steps[0];
    expect(firstStep.primarySnapshot.kind).toBe("array");

    const lastStep = steps[steps.length - 1];
    expect(lastStep.auxiliaryState.customState?.mergedResult).toBe("[1, 6], [8, 10], [15, 18]");
  });

  it("handles overlapping boundary case [[1,4],[4,5]]", () => {
    const steps = generateMergeIntervalsSteps({
      intervals: [
        { start: 1, end: 4 },
        { start: 4, end: 5 },
      ],
    });
    const lastStep = steps[steps.length - 1];
    expect(lastStep.auxiliaryState.customState?.mergedResult).toBe("[1, 5]");
  });

  it("handles empty intervals array gracefully", () => {
    const steps = generateMergeIntervalsSteps({ intervals: [] });
    expect(steps.length).toBe(1);
    expect(steps[0].auxiliaryState.customState?.merged).toBe("[]");
  });

  it("verifies algorithm definition metadata", () => {
    expect(mergeIntervals.id).toBe("merge-intervals");
    expect(mergeIntervals.category).toBe("intervals");
    expect(mergeIntervals.difficulty).toBe("Medium");
    expect(mergeIntervals.code).toContain("def merge(intervals):");
  });

  it("ensures step generator is pure and returns valid code lines and explanations", () => {
    const input = { ...DEFAULT_MERGE_INTERVALS_INPUT };
    const originalInputJSON = JSON.stringify(input);

    const steps = generateMergeIntervalsSteps(input);

    // Verify input immutability
    expect(JSON.stringify(input)).toBe(originalInputJSON);

    // Verify Python code line bounds (1 to 12)
    const pythonLineCount = mergeIntervals.code.split("\n").length;
    steps.forEach((step, idx) => {
      expect(step.stepIndex).toBe(idx);
      expect(step.codeLine).toBeGreaterThanOrEqual(1);
      expect(step.codeLine).toBeLessThanOrEqual(pythonLineCount);
      expect(step.explanation.what.length).toBeGreaterThan(0);
      expect(step.explanation.why.length).toBeGreaterThan(0);
    });
  });

  it("handles single interval gracefully", () => {
    const steps = generateMergeIntervalsSteps({
      intervals: [{ start: 5, end: 10 }],
    });
    expect(steps.length).toBe(3);
    const lastStep = steps[steps.length - 1];
    expect(lastStep.auxiliaryState.customState?.mergedResult).toBe("[5, 10]");
  });

  it("handles undefined intervals input property gracefully", () => {
    const steps = generateMergeIntervalsSteps({
      intervals: undefined as unknown as [],
    });
    expect(steps.length).toBe(1);
    expect(steps[0].auxiliaryState.customState?.merged).toBe("[]");
  });
});
