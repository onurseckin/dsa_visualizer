import { describe, expect, it } from "vitest";
import {
  DECISION_TREE_GINI_SPLIT_CODE,
  DEFAULT_DECISION_TREE_GINI_SPLIT_INPUT,
  decisionTreeGiniSplit,
  generateDecisionTreeGiniSplitSteps,
} from "../decisionTreeGiniSplit";
import type { ArrayVisualSnapshot } from "../../../types/dsa";

describe("decisionTreeGiniSplit algorithm spec", () => {
  it("should have correct ML Infra Level 5 metadata", () => {
    expect(decisionTreeGiniSplit.id).toBe("decision-tree-gini-split");
    expect(decisionTreeGiniSplit.isMlInfra).toBe(true);
    expect(decisionTreeGiniSplit.mlInfraLevel).toBe(5);
    expect(decisionTreeGiniSplit.category).toBe("ml_tree_ensembles");
    expect(decisionTreeGiniSplit.defaultInput).toEqual(DEFAULT_DECISION_TREE_GINI_SPLIT_INPUT);
    expect(decisionTreeGiniSplit.sources).toEqual([
      { type: "ml_infra", kind: "ml_infra", label: "Foundational Math & DSA" },
    ]);
  });

  it("should find optimal Gini split threshold 3.0 with 0.0 impurity", () => {
    const steps = generateDecisionTreeGiniSplitSteps(DEFAULT_DECISION_TREE_GINI_SPLIT_INPUT);
    expect(steps.length).toBeGreaterThan(0);
    const lastStep = steps[steps.length - 1];
    expect(lastStep.variables.complete).toBe(true);
    expect(lastStep.variables.bestThresh).toBe(3.0);
    expect(lastStep.variables.bestGini).toBe(0.0);

    const snap = lastStep.primarySnapshot as ArrayVisualSnapshot;
    expect(snap.kind).toBe("array");
    expect(snap.elements.length).toBe(5);
  });

  it("should handle single element or invalid input", () => {
    const steps = generateDecisionTreeGiniSplitSteps({
      featureValues: [1.0],
      labels: [0],
    });
    const lastStep = steps[steps.length - 1];
    expect(lastStep.variables.valid).toBe(false);
  });
});

describe("decisionTreeGiniSplit trivia metadata", () => {
  const meta = decisionTreeGiniSplit.trivia;
  const lines = DECISION_TREE_GINI_SPLIT_CODE.replace(/\s+$/, "").split("\n");

  it("points skipLines and hints at valid lines", () => {
    expect(meta).toBeDefined();
    const skipped = meta?.skipLines ?? [];
    const hinted = (meta?.hints ?? []).map((entry) => entry.line);
    expect(hinted.length).toBeGreaterThanOrEqual(2);
    [...skipped, ...hinted].forEach((line) => {
      expect(line).toBeGreaterThanOrEqual(1);
      expect(line).toBeLessThanOrEqual(lines.length);
    });
  });

  it("never offers a distractor that is actually a correct line", () => {
    const real = new Set(lines.map((line) => line.trim()));
    const distractors = meta?.distractors ?? [];
    expect(distractors.length).toBeGreaterThanOrEqual(3);
    distractors.forEach((distractor) => {
      expect(real.has(distractor.trim())).toBe(false);
    });
  });
});
