import { describe, expect, it } from "vitest";
import {
  xgboostGradientSplit,
  DEFAULT_XGBOOST_GRADIENT_SPLIT_INPUT,
  generateXgboostGradientSplitSteps,
} from "../xgboostGradientSplit";
import type { ArrayVisualSnapshot } from "../../../types/dsa";

describe("xgboostGradientSplit algorithm spec", () => {
  it("should have correct ML Infra Level 5 metadata", () => {
    expect(xgboostGradientSplit.id).toBe("xgboost-gradient-split");
    expect(xgboostGradientSplit.topicIds.some((topicId) => topicId.startsWith("ml_"))).toBe(true);
    expect(xgboostGradientSplit.topicIds).toContain("ml_tree_ensembles");
    expect(xgboostGradientSplit.defaultInput).toEqual(DEFAULT_XGBOOST_GRADIENT_SPLIT_INPUT);
    expect(xgboostGradientSplit.sources).toEqual([
      { type: "ml_infra", kind: "ml_infra", label: "ML Infra Level 5" },
    ]);
  });

  it("should find the optimal gradient split threshold and max gain", () => {
    const steps = generateXgboostGradientSplitSteps(DEFAULT_XGBOOST_GRADIENT_SPLIT_INPUT);
    expect(steps.length).toBeGreaterThan(0);

    const lastStep = steps[steps.length - 1];
    expect(lastStep.codeLine).toBe(26);

    const distTable = lastStep.auxiliaryState.distanceTable;
    expect(distTable).toBeDefined();
    expect(distTable?.BestSplitThreshold).toBe(2.75);
    expect(distTable?.MaxGain).toBeGreaterThan(0);

    const snap = lastStep.primarySnapshot as ArrayVisualSnapshot;
    expect(snap.kind).toBe("array");
    expect(snap.elements.length).toBe(5);
  });

  it("should calculate split for 2-sample minimal input", () => {
    const minInput = {
      samples: [
        { featureVal: 1.0, g: -2.0, h: 1.0 },
        { featureVal: 5.0, g: 2.0, h: 1.0 },
      ],
      lambda: 1.0,
      gamma: 0.0,
    };
    const steps = generateXgboostGradientSplitSteps(minInput);
    const lastStep = steps[steps.length - 1];
    const distTable = lastStep.auxiliaryState.distanceTable;
    expect(distTable?.BestSplitThreshold).toBe(3.0);
  });
});

describe("xgboostGradientSplit trivia metadata", () => {
  const meta = xgboostGradientSplit.trivia;
  const lines = xgboostGradientSplit.code.replace(/\s+$/, "").split("\n");

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
