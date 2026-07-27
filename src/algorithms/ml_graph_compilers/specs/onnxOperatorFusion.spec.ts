import { describe, expect, it } from "vitest";
import {
  DEFAULT_ONNX_OPERATOR_FUSION_INPUT,
  generateOnnxOperatorFusionSteps,
  onnxOperatorFusion,
} from "../onnxOperatorFusion";
import type { ArrayVisualSnapshot } from "../../../types/dsa";

describe("onnxOperatorFusion algorithm spec", () => {
  it("should have correct metadata", () => {
    expect(onnxOperatorFusion.id).toBe("onnx-operator-fusion");
    expect(onnxOperatorFusion.isMlInfra).toBe(true);
    expect(onnxOperatorFusion.mlInfraLevel).toBe(7);
    expect(onnxOperatorFusion.categories).toContain("ml_graph_compilers");
    expect(onnxOperatorFusion.defaultInput).toEqual(DEFAULT_ONNX_OPERATOR_FUSION_INPUT);
  });

  it("should generate valid algorithm steps and fuse ONNX nodes", () => {
    const steps = generateOnnxOperatorFusionSteps(DEFAULT_ONNX_OPERATOR_FUSION_INPUT);
    expect(steps.length).toBeGreaterThan(0);

    const lastStep = steps[steps.length - 1];
    expect(lastStep.variables.completed).toBe(true);

    const snap = lastStep.primarySnapshot as ArrayVisualSnapshot;
    expect(snap.kind).toBe("array");
    expect(snap.elements.length).toBe(2);
    expect(snap.elements[0].value).toBe("FusedConvBNRelu");
    expect(snap.elements[1].value).toBe("GemmRelu");
  });
});
