import { describe, it, expect } from "vitest";
import {
  computeScalarChainRule,
  DEFAULT_COMPUTESCALARCHAINRULE_INPUT,
  generateComputeScalarChainRuleSteps,
} from "./computeScalarChainRule";

describe("compute-scalar-chain-rule (Scalar Chain Rule Gradient Accumulator)", () => {
  it("should have correct metadata", () => {
    expect(computeScalarChainRule.id).toBe("compute-scalar-chain-rule");
    expect(computeScalarChainRule.isMlInfra).toBe(true);
    expect(computeScalarChainRule.mlInfraLevel).toBe(3);
    expect(computeScalarChainRule.mlInfraCategory).toBe("ml_autograd_dags");
    expect(computeScalarChainRule.categories).toContain("ml_autograd_dags");
  });

  it("should generate valid algorithm steps", () => {
    const steps = generateComputeScalarChainRuleSteps(DEFAULT_COMPUTESCALARCHAINRULE_INPUT);
    expect(steps.length).toBeGreaterThanOrEqual(20);
    expect(steps[0].explanation.what).toContain("Scalar Chain Rule Gradient Accumulator Engine");
    expect(steps[steps.length - 1].explanation.what).toBe("Execution Complete");
  });

  it("should have complete lineExplanations for every code line", () => {
    const totalLines = computeScalarChainRule.code.trim().split("\n").length;
    expect(computeScalarChainRule.trivia).toBeDefined();
    expect(computeScalarChainRule.trivia?.lineExplanations).toBeDefined();
    const lineExplanations = computeScalarChainRule.trivia!.lineExplanations!;
    for (let line = 1; line <= totalLines; line++) {
      expect(lineExplanations[line]).toBeDefined();
      expect(lineExplanations[line].length).toBeGreaterThan(0);
    }
  });

  it("should have step codeLines pointing to valid lines in Python code", () => {
    const totalLines = computeScalarChainRule.code.trim().split("\n").length;
    const steps = generateComputeScalarChainRuleSteps(DEFAULT_COMPUTESCALARCHAINRULE_INPUT);
    steps.forEach((step) => {
      expect(step.codeLine).toBeGreaterThanOrEqual(1);
      expect(step.codeLine).toBeLessThanOrEqual(totalLines);
    });
  });
});
