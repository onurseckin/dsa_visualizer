import { describe, expect, it } from "vitest";
import {
  DEFAULT_XLA_HLO_GRAPH_OPTIMIZER_INPUT,
  generateXlaHloGraphOptimizerSteps,
  xlaHloGraphOptimizer,
} from "../xlaHloGraphOptimizer";
import type { ArrayVisualSnapshot } from "../../../types/dsa";

describe("xlaHloGraphOptimizer algorithm spec", () => {
  it("should have correct metadata", () => {
    expect(xlaHloGraphOptimizer.id).toBe("xla-hlo-graph-optimizer");
    expect(xlaHloGraphOptimizer.isMlInfra).toBe(true);
    expect(xlaHloGraphOptimizer.mlInfraLevel).toBe(7);
    expect(xlaHloGraphOptimizer.categories).toContain("ml_graph_compilers");
    expect(xlaHloGraphOptimizer.defaultInput).toEqual(DEFAULT_XLA_HLO_GRAPH_OPTIMIZER_INPUT);
  });

  it("should generate valid algorithm steps and fuse HLO instructions into clusters", () => {
    const steps = generateXlaHloGraphOptimizerSteps(DEFAULT_XLA_HLO_GRAPH_OPTIMIZER_INPUT);
    expect(steps.length).toBeGreaterThan(0);

    const lastStep = steps[steps.length - 1];
    expect(lastStep.variables.complete).toBe(true);

    const snap = lastStep.primarySnapshot as ArrayVisualSnapshot;
    expect(snap.kind).toBe("array");
    expect(snap.elements.length).toBeGreaterThan(0);
  });
});
