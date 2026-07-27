import { describe, it, expect } from "vitest";
import { treeNodePredictionTraverser, DEFAULT_TREENODEPREDICTIONTRAVERSER_INPUT, generateTreeNodePredictionTraverserSteps } from "./treeNodePredictionTraverser";

describe("tree-node-prediction-traverser (Decision Tree Prediction Traverser)", () => {
  it("should have correct metadata", () => {
    expect(treeNodePredictionTraverser.id).toBe("tree-node-prediction-traverser");
    expect(treeNodePredictionTraverser.isMlInfra).toBe(true);
    expect(treeNodePredictionTraverser.mlInfraLevel).toBe(9);
    expect(treeNodePredictionTraverser.mlInfraCategory).toBe("ml_tree_ensembles");
    expect(treeNodePredictionTraverser.categories).toContain("ml_tree_ensembles");
  });

  it("should generate valid algorithm steps", () => {
    const steps = generateTreeNodePredictionTraverserSteps(DEFAULT_TREENODEPREDICTIONTRAVERSER_INPUT);
    expect(steps.length).toBeGreaterThan(0);
    expect(steps[0].explanation.what).toContain("Decision Tree Prediction Traverser");
    expect(steps[steps.length - 1].explanation.what).toBe("Execution Complete");
  });
});
