import { describe, expect, it } from "vitest";
import {
  DEFAULT_RECURRENT_UNROLLING_BPTT_INPUT,
  generateRecurrentUnrollingBpttSteps,
  recurrentUnrollingBptt,
} from "../recurrentUnrollingBptt";
import type { ArrayVisualSnapshot } from "../../../types/dsa";

describe("recurrentUnrollingBptt algorithm spec", () => {
  it("should have correct ML Infra Level 6 metadata", () => {
    expect(recurrentUnrollingBptt.id).toBe("recurrent-unrolling-bptt");
    expect(recurrentUnrollingBptt.isMlInfra).toBe(true);
    expect(recurrentUnrollingBptt.mlInfraLevel).toBe(6);
    expect(recurrentUnrollingBptt.categories).toContain("ml_recurrent_gates");
    expect(recurrentUnrollingBptt.defaultInput).toEqual(DEFAULT_RECURRENT_UNROLLING_BPTT_INPUT);
  });

  it("should compute hidden states over 3 time steps for default input", () => {
    const steps = generateRecurrentUnrollingBpttSteps(DEFAULT_RECURRENT_UNROLLING_BPTT_INPUT);
    expect(steps.length).toBeGreaterThan(0);
    const lastStep = steps[steps.length - 1];
    expect(lastStep.variables.complete).toBe(true);
    expect(lastStep.variables.T).toBe(3);

    const snap = lastStep.primarySnapshot as ArrayVisualSnapshot;
    expect(snap.kind).toBe("array");
    expect(snap.elements.length).toBe(3);
    expect(snap.elements.every((el) => el.state === "sorted")).toBe(true);
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
