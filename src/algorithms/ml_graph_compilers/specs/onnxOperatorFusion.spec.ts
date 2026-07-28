import { describe, expect, it } from "vitest";
import {
  DEFAULT_ONNX_OPERATOR_FUSION_INPUT,
  generateOnnxOperatorFusionSteps,
  onnxOperatorFusion,
} from "../onnxOperatorFusion";
import type { GraphVisualSnapshot } from "../../../types/dsa";

describe("onnxOperatorFusion algorithm spec", () => {
  it("should have correct metadata and full trivia lineExplanations", () => {
    expect(onnxOperatorFusion.id).toBe("onnx-operator-fusion");
    expect(onnxOperatorFusion.topicIds.some((topicId) => topicId.startsWith("ml_"))).toBe(true);
    expect(onnxOperatorFusion.topicIds).toContain("ml_graph_compilers");
    expect(onnxOperatorFusion.defaultInput).toEqual(DEFAULT_ONNX_OPERATOR_FUSION_INPUT);

    const codeLines = onnxOperatorFusion.code.trim().split("\n").length;
    const explanationKeys = Object.keys(onnxOperatorFusion.trivia?.lineExplanations || {}).map(
      Number,
    );
    expect(explanationKeys.length).toBe(codeLines);
    for (let i = 1; i <= codeLines; i++) {
      expect(onnxOperatorFusion.trivia?.lineExplanations?.[i]).toBeDefined();
    }
  });

  it("should generate >= 20 algorithm steps with graph snapshots and fuse ONNX nodes", () => {
    const steps = generateOnnxOperatorFusionSteps(DEFAULT_ONNX_OPERATOR_FUSION_INPUT);
    expect(steps.length).toBeGreaterThanOrEqual(20);

    const lastStep = steps[steps.length - 1];
    expect(lastStep.explanation.what).toContain("Complete");

    const snap = lastStep.primarySnapshot as GraphVisualSnapshot;
    expect(snap.kind).toBe("graph");
    expect(snap.nodes.length).toBe(DEFAULT_ONNX_OPERATOR_FUSION_INPUT.nodes.length);
  });
});
