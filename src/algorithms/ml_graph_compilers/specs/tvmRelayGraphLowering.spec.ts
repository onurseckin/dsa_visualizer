import { describe, expect, it } from "vitest";
import {
  DEFAULT_TVM_RELAY_GRAPH_LOWERING_INPUT,
  generateTvmRelayGraphLoweringSteps,
  tvmRelayGraphLowering,
} from "../tvmRelayGraphLowering";
import type { ArrayVisualSnapshot } from "../../../types/dsa";

describe("tvmRelayGraphLowering algorithm spec", () => {
  it("should have correct metadata", () => {
    expect(tvmRelayGraphLowering.id).toBe("tvm-relay-graph-lowering");
    expect(tvmRelayGraphLowering.isMlInfra).toBe(true);
    expect(tvmRelayGraphLowering.mlInfraLevel).toBe(7);
    expect(tvmRelayGraphLowering.categories).toContain("ml_graph_compilers");
    expect(tvmRelayGraphLowering.defaultInput).toEqual(DEFAULT_TVM_RELAY_GRAPH_LOWERING_INPUT);
  });

  it("should generate valid algorithm steps and lower Relay IR to TIR", () => {
    const steps = generateTvmRelayGraphLoweringSteps(DEFAULT_TVM_RELAY_GRAPH_LOWERING_INPUT);
    expect(steps.length).toBeGreaterThan(0);

    const lastStep = steps[steps.length - 1];
    expect(lastStep.variables.complete).toBe(true);

    const snap = lastStep.primarySnapshot as ArrayVisualSnapshot;
    expect(snap.kind).toBe("array");
    expect(snap.elements.length).toBe(1);
    expect(snap.elements[0].value).toBe("fused_conv2d_bias_relu");
  });
});
