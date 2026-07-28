import { describe, expect, it } from "vitest";
import { generateKadaneMaxSubarraySteps, kadaneMaxSubarray } from "../kadaneMaxSubarray";
import type { ArrayVisualSnapshot } from "../../../types/dsa";
import { requireExampleInputs } from "../../specs/assertions";

describe("kadaneMaxSubarray algorithm spec", () => {
  it("should have correct algorithm metadata", () => {
    expect(kadaneMaxSubarray.id).toBe("kadane-max-subarray");
    expect(kadaneMaxSubarray.title).toContain("Kadane's Algorithm");
    expect(kadaneMaxSubarray.topicIds).toContain("arrays_and_hashing");
    expect(kadaneMaxSubarray.timeComplexity.average).toBe("O(n)");
    expect(kadaneMaxSubarray.spaceComplexity).toBe("O(1)");
  });

  it("should generate valid steps for default input (>= 20 steps)", () => {
    const steps = generateKadaneMaxSubarraySteps(kadaneMaxSubarray.defaultInput);
    expect(steps.length).toBeGreaterThanOrEqual(20);

    const firstStep = steps[0];
    expect(firstStep.stepIndex).toBe(0);
    const snap = firstStep.primarySnapshot as ArrayVisualSnapshot;
    expect(snap.kind).toBe("array");

    const lastStep = steps[steps.length - 1];
    expect(lastStep.variables.globalMax).toBe(6);
    expect(lastStep.variables.start).toBe(3);
    expect(lastStep.variables.end).toBe(6);
  });

  it("should handle empty input array", () => {
    const steps = generateKadaneMaxSubarraySteps([]);
    expect(steps.length).toBeGreaterThanOrEqual(20);
    expect(steps[0].variables.globalMax).toBe(0);
  });

  it("should handle single element input array", () => {
    const steps = generateKadaneMaxSubarraySteps([5]);
    expect(steps.length).toBeGreaterThanOrEqual(20);
    const lastStep = steps[steps.length - 1];
    expect(lastStep.variables.globalMax).toBe(5);
    expect(lastStep.variables.start).toBe(0);
    expect(lastStep.variables.end).toBe(0);
  });

  it("should handle all negative numbers correctly", () => {
    const steps = generateKadaneMaxSubarraySteps([-5, -2, -8, -1]);
    expect(steps.length).toBeGreaterThanOrEqual(20);
    const lastStep = steps[steps.length - 1];
    expect(lastStep.variables.globalMax).toBe(-1);
    expect(lastStep.variables.start).toBe(3);
    expect(lastStep.variables.end).toBe(3);
  });

  it("ensures codeLine is 1-indexed (1..15) for defaultInput and all examples", () => {
    const totalLines = kadaneMaxSubarray.code.split("\n").length;
    expect(totalLines).toBe(15);
    const inputs = [
      kadaneMaxSubarray.defaultInput,
      ...requireExampleInputs(
        kadaneMaxSubarray,
        (input): input is typeof kadaneMaxSubarray.defaultInput => Array.isArray(input),
      ),
    ];
    for (const input of inputs) {
      const steps = generateKadaneMaxSubarraySteps(input);
      expect(steps.length).toBeGreaterThan(0);
      for (const step of steps) {
        expect(step.codeLine).toBeGreaterThanOrEqual(1);
        expect(step.codeLine).toBeLessThanOrEqual(totalLines);
      }
      const codeLines = new Set(steps.map((s) => s.codeLine));
      expect(codeLines.size).toBeGreaterThan(1);
    }
  });

  it("maps every code line in lineExplanations", () => {
    const meta = kadaneMaxSubarray.trivia;
    const lines = kadaneMaxSubarray.code.split("\n");
    expect(meta?.lineExplanations).toBeDefined();
    for (let lineNum = 1; lineNum <= lines.length; lineNum++) {
      expect(meta?.lineExplanations?.[lineNum]).toBeDefined();
      expect(typeof meta?.lineExplanations?.[lineNum]).toBe("string");
      expect(meta?.lineExplanations?.[lineNum].length).toBeGreaterThan(0);
    }
  });
});
