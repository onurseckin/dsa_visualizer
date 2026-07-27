import { describe, expect, it } from "vitest";
import {
  DEFAULT_TENSORRT_ENGINE_OPTIMIZER_INPUT,
  generateTensorrtEngineOptimizerSteps,
  tensorrtEngineOptimizer,
} from "../tensorrtEngineOptimizer";
import type { ArrayVisualSnapshot } from "../../../types/dsa";

describe("tensorrtEngineOptimizer algorithm spec", () => {
  it("should have correct metadata", () => {
    expect(tensorrtEngineOptimizer.id).toBe("tensorrt-engine-optimizer");
    expect(tensorrtEngineOptimizer.isMlInfra).toBe(true);
    expect(tensorrtEngineOptimizer.mlInfraLevel).toBe(7);
    expect(tensorrtEngineOptimizer.categories).toContain("ml_graph_compilers");
    expect(tensorrtEngineOptimizer.defaultInput).toEqual(DEFAULT_TENSORRT_ENGINE_OPTIMIZER_INPUT);
  });

  it("should generate valid algorithm steps and calculate engine speedup", () => {
    const steps = generateTensorrtEngineOptimizerSteps(DEFAULT_TENSORRT_ENGINE_OPTIMIZER_INPUT);
    expect(steps.length).toBeGreaterThan(0);

    const lastStep = steps[steps.length - 1];
    expect(lastStep.variables.complete).toBe(true);

    const snap = lastStep.primarySnapshot as ArrayVisualSnapshot;
    expect(snap.kind).toBe("array");
    expect(snap.elements.length).toBeGreaterThan(0);
    expect(Number(lastStep.variables.speedup)).toBeGreaterThan(1.0);
  });
});
