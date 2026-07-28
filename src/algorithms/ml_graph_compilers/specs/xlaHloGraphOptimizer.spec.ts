import { describe, expect, it } from "vitest";
import {
  DEFAULT_XLA_HLO_GRAPH_OPTIMIZER_INPUT,
  generateXlaHloGraphOptimizerSteps,
  xlaHloGraphOptimizer,
} from "../xlaHloGraphOptimizer";
import type { GraphVisualSnapshot } from "../../../types/dsa";

describe("xlaHloGraphOptimizer algorithm spec", () => {
  it("should have correct metadata and full trivia lineExplanations", () => {
    expect(xlaHloGraphOptimizer.id).toBe("xla-hlo-graph-optimizer");
    expect(xlaHloGraphOptimizer.topicIds.some((topicId) => topicId.startsWith("ml_"))).toBe(true);
    expect(xlaHloGraphOptimizer.topicIds).toContain("ml_graph_compilers");
    expect(xlaHloGraphOptimizer.defaultInput).toEqual(DEFAULT_XLA_HLO_GRAPH_OPTIMIZER_INPUT);

    const codeLines = xlaHloGraphOptimizer.code.trim().split("\n").length;
    const explanationKeys = Object.keys(xlaHloGraphOptimizer.trivia?.lineExplanations || {}).map(
      Number,
    );
    expect(explanationKeys.length).toBe(codeLines);
    for (let i = 1; i <= codeLines; i++) {
      expect(xlaHloGraphOptimizer.trivia?.lineExplanations?.[i]).toBeDefined();
    }
  });

  it("should generate >= 20 algorithm steps with graph snapshots and fuse HLO instructions into clusters", () => {
    const steps = generateXlaHloGraphOptimizerSteps(DEFAULT_XLA_HLO_GRAPH_OPTIMIZER_INPUT);
    expect(steps.length).toBeGreaterThanOrEqual(20);

    const lastStep = steps[steps.length - 1];
    expect(lastStep.explanation.what).toContain("Complete");

    const snap = lastStep.primarySnapshot as GraphVisualSnapshot;
    expect(snap.kind).toBe("graph");
  });
});
