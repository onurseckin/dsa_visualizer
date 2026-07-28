import { describe, expect, it } from "vitest";
import {
  DEFAULT_TENSOR_STRIDE_OFFSET_INPUT,
  generateTensorStrideOffsetSteps,
  tensorStrideOffset,
} from "../tensorStrideOffset";
import type { ArrayVisualSnapshot } from "../../../types/dsa";

describe("tensorStrideOffset algorithm spec", () => {
  it("should have correct ML Infra Level 1 metadata", () => {
    expect(tensorStrideOffset.id).toBe("tensor-stride-offset");
    expect(tensorStrideOffset.topicIds.some((topicId) => topicId.startsWith("ml_"))).toBe(true);
    expect(tensorStrideOffset.topicIds).toContain("ml_tensor_algebra");
    expect(tensorStrideOffset.defaultInput).toEqual(DEFAULT_TENSOR_STRIDE_OFFSET_INPUT);
    expect(tensorStrideOffset.sources).toEqual([
      { type: "ml_infra", kind: "ml_infra", label: "ML Infra Level 1" },
    ]);
  });

  it("should generate steps and compute correct memory offset for default NCHW tensor", () => {
    const steps = generateTensorStrideOffsetSteps(DEFAULT_TENSOR_STRIDE_OFFSET_INPUT);
    expect(steps.length).toBeGreaterThan(0);

    const lastStep = steps[steps.length - 1];
    expect(lastStep.codeLine).toBe(9);
    expect(lastStep.variables.offset).toBe(93);
    expect(lastStep.variables.valid).toBe(true);

    const snap = lastStep.primarySnapshot as ArrayVisualSnapshot;
    expect(snap.kind).toBe("array");
    expect(snap.elements.every((el) => el.state === "sorted")).toBe(true);
  });

  it("should compute correct offset for custom non-contiguous strides", () => {
    const customInput = {
      shape: [4, 16, 32, 32] as [number, number, number, number],
      strides: [1, 4, 64, 2048] as [number, number, number, number],
      indices: [2, 8, 15, 10] as [number, number, number, number],
    };
    const steps = generateTensorStrideOffsetSteps(customInput);
    const lastStep = steps[steps.length - 1];
    expect(lastStep.variables.offset).toBe(21474);
  });

  it("should detect out-of-bounds index and return error step", () => {
    const oobInput = {
      shape: [2, 3, 4, 4] as [number, number, number, number],
      strides: [48, 16, 4, 1] as [number, number, number, number],
      indices: [2, 0, 0, 0] as [number, number, number, number],
    };
    const steps = generateTensorStrideOffsetSteps(oobInput);
    const lastStep = steps[steps.length - 1];
    expect(lastStep.codeLine).toBe(7);
    expect(lastStep.variables.offset).toBe(-1);
  });
});

describe("tensorStrideOffset trivia metadata", () => {
  const meta = tensorStrideOffset.trivia;
  const lines = tensorStrideOffset.code.replace(/\s+$/, "").split("\n");

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
