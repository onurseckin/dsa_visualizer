import { describe, expect, it } from "vitest";
import {
  DEFAULT_RECURRENT_UNROLLING_BPTT_INPUT,
  generateRecurrentUnrollingBpttSteps,
  recurrentUnrollingBptt,
} from "../recurrentUnrollingBptt";
import type { MatrixVisualSnapshot } from "../../../types/dsa";

describe("recurrentUnrollingBptt algorithm spec", () => {
  it("should have correct ML Infra Level 6 metadata", () => {
    expect(recurrentUnrollingBptt.id).toBe("recurrent-unrolling-bptt");
    expect(recurrentUnrollingBptt.topicIds.some((topicId) => topicId.startsWith("ml_"))).toBe(true);
    expect(recurrentUnrollingBptt.topicIds).toContain("ml_recurrent_gates");
    expect(recurrentUnrollingBptt.defaultInput).toEqual(DEFAULT_RECURRENT_UNROLLING_BPTT_INPUT);
  });

  it("should compute hidden states over 3 time steps for default input (>= 20 steps, matrix snapshot)", () => {
    const steps = generateRecurrentUnrollingBpttSteps(DEFAULT_RECURRENT_UNROLLING_BPTT_INPUT);
    expect(steps.length).toBeGreaterThanOrEqual(20);
    const lastStep = steps[steps.length - 1];
    expect(lastStep.variables.complete).toBe(true);
    expect(lastStep.variables.T).toBe(3);

    const snap = lastStep.primarySnapshot as MatrixVisualSnapshot;
    expect(snap.kind).toBe("matrix");
    expect(snap.rows).toBe(3);
    expect(snap.cols).toBe(3);

    const codeLines = recurrentUnrollingBptt.code.split("\n");
    steps.forEach((step) => {
      expect(step.codeLine).toBeGreaterThanOrEqual(1);
      expect(step.codeLine).toBeLessThanOrEqual(codeLines.length);
    });
  });

  it("should have complete trivia lineExplanations for every code line", () => {
    const codeLines = recurrentUnrollingBptt.code.split("\n");
    const lineExplanations = recurrentUnrollingBptt.trivia?.lineExplanations;
    expect(lineExplanations).toBeDefined();

    for (let lineNum = 1; lineNum <= codeLines.length; lineNum++) {
      expect(lineExplanations?.[lineNum]).toBeDefined();
      expect(typeof lineExplanations?.[lineNum]).toBe("string");
      expect(lineExplanations?.[lineNum].length).toBeGreaterThan(0);
    }
  });

  it("should handle empty inputs gracefully", () => {
    const steps = generateRecurrentUnrollingBpttSteps({
      inputs: [],
      wX: 1.0,
      wH: 0.5,
      bias: 0.0,
      initH: 0.0,
    });
    const lastStep = steps[steps.length - 1];
    expect(lastStep.variables.valid).toBe(false);
  });
});
