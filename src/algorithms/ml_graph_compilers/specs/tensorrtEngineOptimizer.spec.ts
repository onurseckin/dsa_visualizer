import { describe, expect, it } from "vitest";
import {
  DEFAULT_TENSORRT_ENGINE_OPTIMIZER_INPUT,
  generateTensorrtEngineOptimizerSteps,
  tensorrtEngineOptimizer,
} from "../tensorrtEngineOptimizer";
import type { MatrixVisualSnapshot } from "../../../types/dsa";

describe("tensorrtEngineOptimizer algorithm spec", () => {
  it("should have correct metadata and full trivia lineExplanations", () => {
    expect(tensorrtEngineOptimizer.id).toBe("tensorrt-engine-optimizer");
    expect(tensorrtEngineOptimizer.topicIds.some((topicId) => topicId.startsWith("ml_"))).toBe(
      true,
    );
    expect(tensorrtEngineOptimizer.topicIds).toContain("ml_graph_compilers");
    expect(tensorrtEngineOptimizer.defaultInput).toEqual(DEFAULT_TENSORRT_ENGINE_OPTIMIZER_INPUT);

    const codeLines = tensorrtEngineOptimizer.code.trim().split("\n").length;
    const explanationKeys = Object.keys(tensorrtEngineOptimizer.trivia?.lineExplanations || {}).map(
      Number,
    );
    expect(explanationKeys.length).toBe(codeLines);
    for (let i = 1; i <= codeLines; i++) {
      expect(tensorrtEngineOptimizer.trivia?.lineExplanations?.[i]).toBeDefined();
    }
  });

  it("should generate >= 20 algorithm steps with matrix snapshots and calculate engine speedup", () => {
    const steps = generateTensorrtEngineOptimizerSteps(DEFAULT_TENSORRT_ENGINE_OPTIMIZER_INPUT);
    expect(steps.length).toBeGreaterThanOrEqual(20);

    const lastStep = steps[steps.length - 1];
    expect(lastStep.explanation.what).toContain("Complete");

    const snap = lastStep.primarySnapshot as MatrixVisualSnapshot;
    expect(snap.kind).toBe("matrix");
    expect(Number(lastStep.variables.speedup)).toBeGreaterThan(1.0);
  });
});
