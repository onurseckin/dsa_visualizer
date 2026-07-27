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
    expect(steps.length).toBeGreaterThanOrEqual(20);
    expect(steps[0].explanation.what).toContain(
      "Vector-Jacobian Product (VJP) Engine",
    );
    expect(steps[steps.length - 1].explanation.what).toBe("Execution Complete");
  });

  it("should have complete lineExplanations for every code line", () => {
    const totalLines = tensorVjpEngineGradOfGrad.code.trim().split("\n").length;
    expect(tensorVjpEngineGradOfGrad.trivia).toBeDefined();
    expect(tensorVjpEngineGradOfGrad.trivia?.lineExplanations).toBeDefined();
    const lineExplanations = tensorVjpEngineGradOfGrad.trivia!.lineExplanations!;
    for (let line = 1; line <= totalLines; line++) {
      expect(lineExplanations[line]).toBeDefined();
      expect(lineExplanations[line].length).toBeGreaterThan(0);
    }
  });

  it("should have step codeLines pointing to valid lines in Python code", () => {
    const totalLines = tensorVjpEngineGradOfGrad.code.trim().split("\n").length;
    const steps = generateTensorVjpEngineGradOfGradSteps(DEFAULT_TENSORVJPENGINEGRADOFGRAD_INPUT);
    steps.forEach((step) => {
      expect(step.codeLine).toBeGreaterThanOrEqual(1);
      expect(step.codeLine).toBeLessThanOrEqual(totalLines);
    });
  });
});
