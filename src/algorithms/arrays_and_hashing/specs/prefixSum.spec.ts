import { describe, expect, it } from "vitest";
import { DEFAULT_PREFIX_SUM_INPUT, generatePrefixSumSteps, prefixSum } from "../prefixSum";
import type { ArrayVisualSnapshot } from "../../../types/dsa";

describe("prefixSum algorithm spec", () => {
  it("should have valid metadata", () => {
    expect(prefixSum.id).toBe("prefix-sum");
    expect(prefixSum.title).toBe("Prefix Sum");
    expect(prefixSum.category).toBe("arrays_and_hashing");
    expect(prefixSum.difficulty).toBe("Easy");
    expect(prefixSum.defaultInput).toEqual(DEFAULT_PREFIX_SUM_INPUT);
  });

  it("should generate steps for default input correctly (>= 20 steps)", () => {
    const steps = generatePrefixSumSteps(DEFAULT_PREFIX_SUM_INPUT);
    expect(steps.length).toBeGreaterThanOrEqual(20);

    const firstStep = steps[0];
    expect(firstStep.codeLine).toBe(1);
    expect(firstStep.explanation.what).toContain("Start building prefix sums");

    const completeStep = steps.find((s) => s.explanation.what.includes("Complete prefix array build"));
    expect(completeStep).toBeDefined();
    expect(completeStep?.variables.result).toBe("0, 2, 6, 7, 10, 15, 17, 23, 27");
  });

  it("should handle single element input array", () => {
    const input = { nums: [7] };
    const steps = generatePrefixSumSteps(input);
    expect(steps.length).toBeGreaterThanOrEqual(20);
    const completeStep = steps.find((s) => s.explanation.what.includes("Complete prefix array build"));
    expect(completeStep?.variables.result).toBe("0, 7");
  });

  it("should handle negative numbers correctly", () => {
    const input = { nums: [3, -2, 5, -1] };
    const steps = generatePrefixSumSteps(input);
    expect(steps.length).toBeGreaterThanOrEqual(20);
    const completeStep = steps.find((s) => s.explanation.what.includes("Complete prefix array build"));
    expect(completeStep?.variables.result).toBe("0, 3, 1, 6, 5");

    const lastStep = steps[steps.length - 1];
    const snapshot = lastStep.primarySnapshot as ArrayVisualSnapshot;
    expect(snapshot.elements).toHaveLength(4);
  });

  it("ensures codeLine is 1-indexed (1..6) for defaultInput and all examples", () => {
    const totalLines = prefixSum.code.split("\n").length;
    expect(totalLines).toBe(6);
    const inputs = [prefixSum.defaultInput, ...prefixSum.examples.map((e) => e.input)];
    for (const input of inputs) {
      const steps = generatePrefixSumSteps(input);
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
    const meta = prefixSum.trivia;
    const lines = prefixSum.code.split("\n");
    expect(meta?.lineExplanations).toBeDefined();
    for (let lineNum = 1; lineNum <= lines.length; lineNum++) {
      expect(meta?.lineExplanations?.[lineNum]).toBeDefined();
      expect(typeof meta?.lineExplanations?.[lineNum]).toBe("string");
      expect(meta?.lineExplanations?.[lineNum].length).toBeGreaterThan(0);
    }
  });
});

