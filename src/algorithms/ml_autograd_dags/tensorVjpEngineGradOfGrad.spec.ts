import { describe, it, expect } from "vitest";
import {
  tensorVjpEngineGradOfGrad,
  DEFAULT_TENSORVJPENGINEGRADOFGRAD_INPUT,
  generateTensorVjpEngineGradOfGradSteps,
} from "./tensorVjpEngineGradOfGrad";

describe("tensor-vjp-engine-grad-of-grad (Vector-Jacobian Product (VJP) Engine with Higher-Order Gradients)", () => {
  it("should have correct metadata", () => {
    expect(tensorVjpEngineGradOfGrad.id).toBe("tensor-vjp-engine-grad-of-grad");
    expect(tensorVjpEngineGradOfGrad.isMlInfra).toBe(true);
    expect(tensorVjpEngineGradOfGrad.mlInfraLevel).toBe(3);
    expect(tensorVjpEngineGradOfGrad.mlInfraCategory).toBe("ml_autograd_dags");
    expect(tensorVjpEngineGradOfGrad.categories).toContain("ml_autograd_dags");
  });

  it("should generate valid algorithm steps", () => {
    const steps = generateTensorVjpEngineGradOfGradSteps(DEFAULT_TENSORVJPENGINEGRADOFGRAD_INPUT);
    expect(steps.length).toBeGreaterThan(0);
    expect(steps[0].explanation.what).toContain(
      "Vector-Jacobian Product (VJP) Engine with Higher-Order Gradients",
    );
    expect(steps[steps.length - 1].explanation.what).toBe("Execution Complete");
  });
});
