import { describe, it, expect } from "vitest";
import { greedyDecisionTreeBuilder, DEFAULT_GREEDYDECISIONTREEBUILDER_INPUT, generateGreedyDecisionTreeBuilderSteps } from "./greedyDecisionTreeBuilder";

describe("greedy-decision-tree-builder (Recursive Greedy Decision Tree Builder)", () => {
  it("should have correct metadata", () => {
    expect(greedyDecisionTreeBuilder.id).toBe("greedy-decision-tree-builder");
    expect(greedyDecisionTreeBuilder.isMlInfra).toBe(true);
    expect(greedyDecisionTreeBuilder.mlInfraLevel).toBe(9);
    expect(greedyDecisionTreeBuilder.mlInfraCategory).toBe("ml_tree_ensembles");
    expect(greedyDecisionTreeBuilder.categories).toContain("ml_tree_ensembles");
  });

  it("should generate valid algorithm steps", () => {
    const steps = generateGreedyDecisionTreeBuilderSteps(DEFAULT_GREEDYDECISIONTREEBUILDER_INPUT);
    expect(steps.length).toBeGreaterThan(0);
    expect(steps[0].explanation.what).toContain("Recursive Greedy Decision Tree Builder");
    expect(steps[steps.length - 1].explanation.what).toBe("Execution Complete");
  });
});
