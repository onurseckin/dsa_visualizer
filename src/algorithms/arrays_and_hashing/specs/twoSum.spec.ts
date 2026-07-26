import { describe, expect, it } from "vitest";
import { DEFAULT_TWO_SUM_INPUT, generateTwoSumSteps, twoSum } from "../twoSum";
import type { ArrayVisualSnapshot } from "../../../types/dsa";

describe("twoSum algorithm spec", () => {
  it("should have correct metadata", () => {
    expect(twoSum.id).toBe("two-sum");
    expect(twoSum.title).toBe("Two Sum");
    expect(twoSum.category).toBe("arrays_and_hashing");
    expect(twoSum.defaultInput).toEqual(DEFAULT_TWO_SUM_INPUT);
  });

  it("should generate steps with hash map auxiliary state and find target pair", () => {
    const steps = generateTwoSumSteps(DEFAULT_TWO_SUM_INPUT);
    expect(steps.length).toBeGreaterThan(0);

    const hasHashMapState = steps.some(
      (step) =>
        step.auxiliaryState.hashMap !== undefined &&
        Object.keys(step.auxiliaryState.hashMap).length > 0,
    );
    expect(hasHashMapState).toBe(true);

    const lastStep = steps[steps.length - 1];
    expect(lastStep.codeLine).toBe(6);
    expect(lastStep.variables.resultIdx1).toBe(0);
    expect(lastStep.variables.resultIdx2).toBe(1);

    const snap = lastStep.primarySnapshot as ArrayVisualSnapshot;
    expect(snap.elements[0].state).toBe("sorted");
    expect(snap.elements[1].state).toBe("sorted");
  });

  it("should find matching pair when elements are non-adjacent", () => {
    const customInput = { nums: [3, 2, 4], target: 6 };
    const steps = generateTwoSumSteps(customInput);
    const lastStep = steps[steps.length - 1];
    expect(lastStep.codeLine).toBe(6);
    expect(lastStep.variables.resultIdx1).toBe(1);
    expect(lastStep.variables.resultIdx2).toBe(2);
  });

  it("should handle negative numbers correctly", () => {
    const customInput = { nums: [-1, -2, -3, -4, -5], target: -8 };
    const steps = generateTwoSumSteps(customInput);
    const lastStep = steps[steps.length - 1];
    expect(lastStep.codeLine).toBe(6);
    expect(lastStep.variables.resultIdx1).toBe(2);
    expect(lastStep.variables.resultIdx2).toBe(4);
  });

  it("should handle target with no solution", () => {
    const customInput = { nums: [1, 2, 3], target: 100 };
    const steps = generateTwoSumSteps(customInput);
    const lastStep = steps[steps.length - 1];
    expect(lastStep.codeLine).toBe(8);
    expect(lastStep.explanation.what).toContain("empty array");
  });
});

describe("twoSum trivia metadata", () => {
  const meta = twoSum.trivia;
  const lines = twoSum.code.replace(/\s+$/, "").split("\n");

  it("points skipLines and hints at real, non-empty lines", () => {
    expect(meta).toBeDefined();
    const skipped = meta?.skipLines ?? [];
    const hinted = (meta?.hints ?? []).map((entry) => entry.line);
    expect(hinted.length).toBeGreaterThanOrEqual(2);
    [...skipped, ...hinted].forEach((line) => {
      expect(line).toBeGreaterThanOrEqual(1);
      expect(line).toBeLessThanOrEqual(lines.length);
      expect(lines[line - 1].trim()).not.toBe("");
    });
    // A hint on a line the drill never hides would never be shown.
    hinted.forEach((line) => expect(skipped).not.toContain(line));
  });

  it("never offers a distractor that is actually a correct line", () => {
    const real = new Set(lines.map((line) => line.trim()));
    const distractors = meta?.distractors ?? [];
    expect(distractors.length).toBeGreaterThanOrEqual(3);
    expect(new Set(distractors).size).toBe(distractors.length);
    distractors.forEach((distractor) => {
      expect(real.has(distractor.trim())).toBe(false);
    });
  });
});
