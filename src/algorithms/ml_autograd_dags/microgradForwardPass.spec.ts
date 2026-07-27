import { describe, it, expect } from "vitest";
import { microgradForwardPass, DEFAULT_MICROGRADFORWARDPASS_INPUT, generateMicrogradForwardPassSteps } from "./microgradForwardPass";

describe("micrograd-forward-pass (Micrograd Computational Graph Forward Pass)", () => {
  it("should have correct metadata", () => {
    expect(microgradForwardPass.id).toBe("micrograd-forward-pass");
    expect(microgradForwardPass.isMlInfra).toBe(true);
    expect(microgradForwardPass.mlInfraLevel).toBe(3);
    expect(microgradForwardPass.mlInfraCategory).toBe("ml_autograd_dags");
    expect(microgradForwardPass.categories).toContain("ml_autograd_dags");
  });

  it("should generate valid algorithm steps", () => {
    const steps = generateMicrogradForwardPassSteps(DEFAULT_MICROGRADFORWARDPASS_INPUT);
    expect(steps.length).toBeGreaterThan(0);
    expect(steps[0].explanation.what).toContain("Micrograd Computational Graph Forward Pass");
    expect(steps[steps.length - 1].explanation.what).toBe("Execution Complete");
  });
});
