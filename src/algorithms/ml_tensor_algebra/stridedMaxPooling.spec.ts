import { describe, it, expect } from "vitest";
import {
  stridedMaxPooling,
  DEFAULT_STRIDEDMAXPOOLING_INPUT,
  generateStridedMaxPoolingSteps,
  STRIDEDMAXPOOLING_CODE,
} from "./stridedMaxPooling";

describe("strided-max-pooling (2D Strided Max Pooling Operator)", () => {
  it("should have correct metadata and structure", () => {
    expect(stridedMaxPooling.id).toBe("strided-max-pooling");
    expect(stridedMaxPooling.isMlInfra).toBe(true);
    expect(stridedMaxPooling.mlInfraLevel).toBe(1);
    expect(stridedMaxPooling.mlInfraCategory).toBe("ml_tensor_algebra");
    expect(stridedMaxPooling.categories).toContain("ml_tensor_algebra");
    expect(stridedMaxPooling.topicGuide?.sections.length).toBe(5);
  });

  it("should map every line of CODE in trivia.lineExplanations", () => {
    const totalLines = STRIDEDMAXPOOLING_CODE.split("\n").length;
    const explanations = stridedMaxPooling.trivia?.lineExplanations ?? {};
    for (let line = 1; line <= totalLines; line++) {
      expect(explanations[line], `Line ${line} missing in lineExplanations`).toBeDefined();
      expect(explanations[line].length).toBeGreaterThan(0);
    }
  });

  it("should generate >= 20 steps for default input and use matrix snapshot", () => {
    const steps = generateStridedMaxPoolingSteps(DEFAULT_STRIDEDMAXPOOLING_INPUT);
    expect(steps.length).toBeGreaterThanOrEqual(20);
    expect(steps[0].explanation.what).toContain("2D Strided Max Pooling");
    expect(steps[steps.length - 1].explanation.what).toContain("Return Downsampled Pooled");
    expect(steps[0].primarySnapshot.kind).toBe("matrix");
  });

  it("should correctly compute 2D strided max pooling output matrix", () => {
    const matrix = [
      [1, 3, 2, 4],
      [5, 6, 1, 8],
      [9, 2, 7, 3],
      [4, 8, 5, 6],
    ];
    const steps = generateStridedMaxPoolingSteps({
      matrix,
      poolSize: 2,
      stride: 2,
    });
    const lastStep = steps[steps.length - 1];
    const parsedPooled = JSON.parse(String(lastStep.variables.pooled));
    expect(parsedPooled).toEqual([
      [6, 8],
      [9, 7],
    ]);
  });
});
