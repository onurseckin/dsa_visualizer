import { describe, it, expect } from "vitest";
import {
  asStridedTensorViewEngine,
  DEFAULT_ASSTRIDEDTENSORVIEWENGINE_INPUT,
  generateAsStridedTensorViewEngineSteps,
} from "./asStridedTensorViewEngine";

describe("as-strided-tensor-view-engine (PyTorch ATen as_strided Zero-Copy View Engine)", () => {
  it("should have correct metadata", () => {
    expect(asStridedTensorViewEngine.id).toBe("as-strided-tensor-view-engine");
    expect(asStridedTensorViewEngine.topicIds.some((topicId) => topicId.startsWith("ml_"))).toBe(
      true,
    );
    expect(asStridedTensorViewEngine.topicIds).toContain("ml_tensor_algebra");
    expect(asStridedTensorViewEngine.topicIds).toContain("ml_tensor_algebra");
  });

  it("should generate at least 20 algorithm steps with matrix snapshots", () => {
    const steps = generateAsStridedTensorViewEngineSteps(DEFAULT_ASSTRIDEDTENSORVIEWENGINE_INPUT);
    expect(steps.length).toBeGreaterThanOrEqual(20);
    expect(steps[0].explanation.what).toContain("as_strided");
    expect(steps[0].primarySnapshot.kind).toBe("matrix");
    expect(steps[steps.length - 1].explanation.what).toContain("Return View Contiguity");
  });

  it("should map every line of code in trivia lineExplanations", () => {
    const trivia = asStridedTensorViewEngine.trivia;
    expect(trivia).toBeDefined();
    if (!trivia || !trivia.lineExplanations) return;

    const codeLines = asStridedTensorViewEngine.code.split("\n");
    const lineKeys = Object.keys(trivia.lineExplanations).map(Number);

    for (let i = 1; i <= codeLines.length; i++) {
      expect(lineKeys).toContain(i);
    }
  });
});
