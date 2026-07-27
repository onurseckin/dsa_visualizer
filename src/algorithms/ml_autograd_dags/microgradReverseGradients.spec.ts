import { describe, it, expect } from "vitest";
import { microgradReverseGradients, DEFAULT_MICROGRADREVERSEGRADIENTS_INPUT, generateMicrogradReverseGradientsSteps } from "./microgradReverseGradients";

describe("micrograd-reverse-gradients (Micrograd Reverse-Mode Automatic Differentiation)", () => {
  it("should have correct metadata", () => {
    expect(microgradReverseGradients.id).toBe("micrograd-reverse-gradients");
    expect(microgradReverseGradients.isMlInfra).toBe(true);
    expect(microgradReverseGradients.mlInfraLevel).toBe(3);
    expect(microgradReverseGradients.mlInfraCategory).toBe("ml_autograd_dags");
    expect(microgradReverseGradients.categories).toContain("ml_autograd_dags");
  });

  it("should generate valid algorithm steps", () => {
    const steps = generateMicrogradReverseGradientsSteps(DEFAULT_MICROGRADREVERSEGRADIENTS_INPUT);
    expect(steps.length).toBeGreaterThan(0);
    expect(steps[0].explanation.what).toContain("Micrograd Reverse-Mode Automatic Differentiation");
    expect(steps[steps.length - 1].explanation.what).toBe("Execution Complete");
  });
});
