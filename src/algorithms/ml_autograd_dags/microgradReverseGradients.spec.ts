import { describe, it, expect } from "vitest";
import {
  microgradReverseGradients,
  DEFAULT_MICROGRADREVERSEGRADIENTS_INPUT,
  generateMicrogradReverseGradientsSteps,
} from "./microgradReverseGradients";

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
    expect(steps.length).toBeGreaterThanOrEqual(20);
    expect(steps[0].explanation.what).toContain("Micrograd Reverse-Mode Autograd Engine");
    expect(steps[steps.length - 1].explanation.what).toBe("Execution Complete");
  });

  it("should have complete lineExplanations for every code line", () => {
    const totalLines = microgradReverseGradients.code.trim().split("\n").length;
    expect(microgradReverseGradients.trivia).toBeDefined();
    expect(microgradReverseGradients.trivia?.lineExplanations).toBeDefined();
    const lineExplanations = microgradReverseGradients.trivia!.lineExplanations!;
    for (let line = 1; line <= totalLines; line++) {
      expect(lineExplanations[line]).toBeDefined();
      expect(lineExplanations[line].length).toBeGreaterThan(0);
    }
  });

  it("should have step codeLines pointing to valid lines in Python code", () => {
    const totalLines = microgradReverseGradients.code.trim().split("\n").length;
    const steps = generateMicrogradReverseGradientsSteps(DEFAULT_MICROGRADREVERSEGRADIENTS_INPUT);
    steps.forEach((step) => {
      expect(step.codeLine).toBeGreaterThanOrEqual(1);
      expect(step.codeLine).toBeLessThanOrEqual(totalLines);
    });
  });
});
