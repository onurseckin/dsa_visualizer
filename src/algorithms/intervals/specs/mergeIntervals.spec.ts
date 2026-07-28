import { describe, it, expect } from "vitest";
import {
  mergeIntervals,
  generateMergeIntervalsSteps,
  DEFAULT_MERGE_INTERVALS_INPUT,
} from "../mergeIntervals";

describe("mergeIntervals logic spec", () => {
  it("generates valid steps for default input (>= 20 steps)", () => {
    const steps = generateMergeIntervalsSteps(DEFAULT_MERGE_INTERVALS_INPUT);
    expect(steps.length).toBeGreaterThanOrEqual(20);

    const firstStep = steps[0];
    expect(firstStep.primarySnapshot.kind).toBe("array");

    const lastStep = steps[steps.length - 1];
    expect(lastStep.auxiliaryState.customState?.mergedResult).toBe(
      "[1, 6], [8, 12], [15, 20], [22, 26]",
    );
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
    expect(steps.length).toBe(3);
    expect(steps[1].auxiliaryState.customState?.merged).toBe("[]");
  });

  it("ships a rich topic guide teaching sorting by start coordinate and sweep line invariants", () => {
    const guide = mergeIntervals.topicGuide;
    expect(guide.overview).toContain("Interval problems");
    expect(guide.sections.length).toBeGreaterThanOrEqual(4);
    guide.sections.forEach((section) => {
      expect(section.heading.length).toBeGreaterThan(0);
      expect(section.body.split(". ").length).toBeGreaterThanOrEqual(3);
    });
    expect(guide.keyTerms?.map((t) => t.term)).toContain("Sweep Line Strategy");
  });

  it("verifies algorithm definition metadata and complete lineExplanations", () => {
    expect(mergeIntervals.id).toBe("merge-intervals");
    expect(mergeIntervals.topicIds).toContain("two_pointers");
    expect(mergeIntervals.difficulty).toBe("Medium");
    expect(mergeIntervals.code).toContain("def merge(intervals):");

    const lines = mergeIntervals.code.split("\n");
    expect(mergeIntervals.trivia?.lineExplanations).toBeDefined();
    for (let i = 1; i <= lines.length; i++) {
      expect(mergeIntervals.trivia?.lineExplanations?.[i]).toBeDefined();
      expect(typeof mergeIntervals.trivia?.lineExplanations?.[i]).toBe("string");
    }
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
    expect(steps.length).toBe(5);
    const lastStep = steps[steps.length - 1];
    expect(lastStep.auxiliaryState.customState?.mergedResult).toBe("[5, 10]");
  });

  it("handles undefined intervals input property gracefully", () => {
    const steps = generateMergeIntervalsSteps({
      intervals: undefined as unknown as [],
    });
    expect(steps.length).toBe(3);
    expect(steps[1].auxiliaryState.customState?.merged).toBe("[]");
  });

  it("provides 3 typed examples (basic, complex, negative) that generate steps without errors", () => {
    expect(mergeIntervals.examples).toHaveLength(3);
    expect(mergeIntervals.examples?.map((ex) => ex.kind)).toEqual(["basic", "complex", "negative"]);
    expect(mergeIntervals.examples?.map((ex) => ex.title)).toEqual([
      "Basic Example",
      "Complex Edge Case",
      "Failing / Boundary Case",
    ]);

    for (const example of mergeIntervals.examples!) {
      const steps = mergeIntervals.generateSteps(
        example.input as { intervals: Array<{ start: number; end: number }> },
      );
      expect(steps.length).toBeGreaterThan(0);
    }
  });
});
