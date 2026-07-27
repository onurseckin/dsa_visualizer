import { describe, it, expect } from "vitest";
import { multiTreeAdditiveEnsemblePredictor, DEFAULT_MULTITREEADDITIVEENSEMBLEPREDICTOR_INPUT, generateMultiTreeAdditiveEnsemblePredictorSteps } from "./multiTreeAdditiveEnsemblePredictor";

describe("multi-tree-additive-ensemble-predictor (Gradient Boosted Multi-Tree Additive Ensemble Predictor)", () => {
  it("should have correct metadata", () => {
    expect(multiTreeAdditiveEnsemblePredictor.id).toBe("multi-tree-additive-ensemble-predictor");
    expect(multiTreeAdditiveEnsemblePredictor.isMlInfra).toBe(true);
    expect(multiTreeAdditiveEnsemblePredictor.mlInfraLevel).toBe(9);
    expect(multiTreeAdditiveEnsemblePredictor.mlInfraCategory).toBe("ml_tree_ensembles");
    expect(multiTreeAdditiveEnsemblePredictor.categories).toContain("ml_tree_ensembles");
  });

  it("should generate valid algorithm steps", () => {
    const steps = generateMultiTreeAdditiveEnsemblePredictorSteps(DEFAULT_MULTITREEADDITIVEENSEMBLEPREDICTOR_INPUT);
    expect(steps.length).toBeGreaterThan(0);
    expect(steps[0].explanation.what).toContain("Gradient Boosted Multi-Tree Additive Ensemble Predictor");
    expect(steps[steps.length - 1].explanation.what).toBe("Execution Complete");
  });
});
