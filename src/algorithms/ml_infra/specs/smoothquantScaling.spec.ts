import { describe, expect, it } from "vitest";
import {
  DEFAULT_SMOOTHQUANT_INPUT,
  SMOOTHQUANT_EXAMPLES,
  SMOOTHQUANT_SCALING_CODE,
  generateSmoothquantSteps,
  smoothquantScaling,
} from "../smoothquantScaling";

describe("smoothquantScaling (Level 3 ML Infra)", () => {
  it("exports correct algorithm metadata", () => {
    expect(smoothquantScaling.id).toBe("smoothquant-scaling");
    expect(smoothquantScaling.topicIds.some((topicId) => topicId.startsWith("ml_"))).toBe(true);
    expect(smoothquantScaling.topicIds).toContain("ml_precision_quantization");
    expect(smoothquantScaling.sources).toEqual([
      { type: "ml_infra", kind: "ml_infra", label: "ML Infra Level 3" },
    ]);
  });

  it("contains Python code string and default input", () => {
    expect(SMOOTHQUANT_SCALING_CODE).toContain("def smoothquant_scaling");
    expect(smoothquantScaling.code).toBe(SMOOTHQUANT_SCALING_CODE);
    expect(smoothquantScaling.defaultInput).toEqual(DEFAULT_SMOOTHQUANT_INPUT);
  });

  it("generates steps for default input", () => {
    const steps = generateSmoothquantSteps(DEFAULT_SMOOTHQUANT_INPUT);
    expect(steps.length).toBeGreaterThan(0);
    for (let i = 0; i < steps.length; i++) {
      expect(steps[i].stepIndex).toBe(i);
      expect(typeof steps[i].codeLine).toBe("number");
      expect(steps[i].explanation.what).toBeTruthy();
      expect(steps[i].explanation.why).toBeTruthy();
      expect(steps[i].primarySnapshot.kind).toBe("matrix");
    }
  });

  it("handles basic, complex, and negative examples cleanly", () => {
    expect(SMOOTHQUANT_EXAMPLES).toHaveLength(3);
    for (const example of SMOOTHQUANT_EXAMPLES) {
      if (typeof example.input !== "string") {
        const steps = generateSmoothquantSteps(example.input);
        expect(steps.length).toBeGreaterThan(0);
      }
    }
  });
});
