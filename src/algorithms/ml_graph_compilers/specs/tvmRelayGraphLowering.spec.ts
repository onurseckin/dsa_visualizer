import { describe, expect, it } from "vitest";
import {
  DEFAULT_TVM_RELAY_GRAPH_LOWERING_INPUT,
  generateTvmRelayGraphLoweringSteps,
  tvmRelayGraphLowering,
} from "../tvmRelayGraphLowering";
import type { GraphVisualSnapshot } from "../../../types/dsa";

describe("tvmRelayGraphLowering algorithm spec", () => {
  it("should have correct metadata and full trivia lineExplanations", () => {
    expect(tvmRelayGraphLowering.id).toBe("tvm-relay-graph-lowering");
    expect(tvmRelayGraphLowering.topicIds.some((topicId) => topicId.startsWith("ml_"))).toBe(true);
    expect(tvmRelayGraphLowering.topicIds).toContain("ml_graph_compilers");
    expect(tvmRelayGraphLowering.defaultInput).toEqual(DEFAULT_TVM_RELAY_GRAPH_LOWERING_INPUT);

    const codeLines = tvmRelayGraphLowering.code.trim().split("\n").length;
    const explanationKeys = Object.keys(tvmRelayGraphLowering.trivia?.lineExplanations || {}).map(
      Number,
    );
    expect(explanationKeys.length).toBe(codeLines);
    for (let i = 1; i <= codeLines; i++) {
      expect(tvmRelayGraphLowering.trivia?.lineExplanations?.[i]).toBeDefined();
    }
  });

  it("should generate >= 20 algorithm steps with graph snapshots and lower Relay IR to TIR", () => {
    const steps = generateTvmRelayGraphLoweringSteps(DEFAULT_TVM_RELAY_GRAPH_LOWERING_INPUT);
    expect(steps.length).toBeGreaterThanOrEqual(20);

    const lastStep = steps[steps.length - 1];
    expect(lastStep.explanation.what).toContain("Complete");

    const snap = lastStep.primarySnapshot as GraphVisualSnapshot;
    expect(snap.kind).toBe("graph");
    expect(snap.nodes.length).toBeGreaterThan(0);
  });
});
