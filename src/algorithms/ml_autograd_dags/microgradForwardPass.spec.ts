import { describe, it, expect } from "vitest";
import {
  microgradForwardPass,
  DEFAULT_MICROGRADFORWARDPASS_INPUT,
  generateMicrogradForwardPassSteps,
} from "./microgradForwardPass";

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
    expect(steps.length).toBeGreaterThanOrEqual(20);
    expect(steps[0].explanation.what).toContain("Micrograd Computational Graph Forward Engine");
    expect(steps[steps.length - 1].explanation.what).toBe("Execution Complete");
  });

  it("should have complete lineExplanations for every code line", () => {
    const totalLines = microgradForwardPass.code.trim().split("\n").length;
    expect(microgradForwardPass.trivia).toBeDefined();
    expect(microgradForwardPass.trivia?.lineExplanations).toBeDefined();
    const lineExplanations = microgradForwardPass.trivia!.lineExplanations!;
    for (let line = 1; line <= totalLines; line++) {
      expect(lineExplanations[line]).toBeDefined();
      expect(lineExplanations[line].length).toBeGreaterThan(0);
    }
  });

  it("should have step codeLines pointing to valid lines in Python code", () => {
    const totalLines = microgradForwardPass.code.trim().split("\n").length;
    const steps = generateMicrogradForwardPassSteps(DEFAULT_MICROGRADFORWARDPASS_INPUT);
    steps.forEach((step) => {
      expect(step.codeLine).toBeGreaterThanOrEqual(1);
      expect(step.codeLine).toBeLessThanOrEqual(totalLines);
    });
  });
});
