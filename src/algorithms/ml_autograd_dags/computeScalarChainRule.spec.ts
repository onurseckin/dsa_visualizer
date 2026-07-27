import { describe, it, expect } from "vitest";
import { computeScalarChainRule, DEFAULT_COMPUTESCALARCHAINRULE_INPUT, generateComputeScalarChainRuleSteps } from "./computeScalarChainRule";

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
    expect(steps.length).toBeGreaterThan(0);
    expect(steps[0].explanation.what).toContain("Scalar Chain Rule Gradient Accumulator");
    expect(steps[steps.length - 1].explanation.what).toBe("Execution Complete");
  });
});
