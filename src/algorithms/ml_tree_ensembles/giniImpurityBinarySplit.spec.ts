import { describe, it, expect } from "vitest";
import { giniImpurityBinarySplit, DEFAULT_GINIIMPURITYBINARYSPLIT_INPUT, generateGiniImpurityBinarySplitSteps } from "./giniImpurityBinarySplit";

describe("gini-impurity-binary-split (Gini Impurity Binary Split Evaluator)", () => {
  it("should have correct metadata", () => {
    expect(giniImpurityBinarySplit.id).toBe("gini-impurity-binary-split");
    expect(giniImpurityBinarySplit.isMlInfra).toBe(true);
    expect(giniImpurityBinarySplit.mlInfraLevel).toBe(9);
    expect(giniImpurityBinarySplit.mlInfraCategory).toBe("ml_tree_ensembles");
    expect(giniImpurityBinarySplit.categories).toContain("ml_tree_ensembles");
  });

  it("should generate valid algorithm steps", () => {
    const steps = generateGiniImpurityBinarySplitSteps(DEFAULT_GINIIMPURITYBINARYSPLIT_INPUT);
    expect(steps.length).toBeGreaterThan(0);
    expect(steps[0].explanation.what).toContain("Gini Impurity Binary Split Evaluator");
    expect(steps[steps.length - 1].explanation.what).toBe("Execution Complete");
  });
});
