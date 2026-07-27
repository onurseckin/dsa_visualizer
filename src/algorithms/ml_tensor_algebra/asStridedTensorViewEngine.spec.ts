import { describe, it, expect } from "vitest";
import {
  asStridedTensorViewEngine,
  DEFAULT_ASSTRIDEDTENSORVIEWENGINE_INPUT,
  generateAsStridedTensorViewEngineSteps,
} from "./asStridedTensorViewEngine";

describe("as-strided-tensor-view-engine (PyTorch ATen `as_strided` Zero-Copy View Engine)", () => {
  it("should have correct metadata", () => {
    expect(asStridedTensorViewEngine.id).toBe("as-strided-tensor-view-engine");
    expect(asStridedTensorViewEngine.isMlInfra).toBe(true);
    expect(asStridedTensorViewEngine.mlInfraLevel).toBe(1);
    expect(asStridedTensorViewEngine.mlInfraCategory).toBe("ml_tensor_algebra");
    expect(asStridedTensorViewEngine.categories).toContain("ml_tensor_algebra");
  });

  it("should generate valid algorithm steps", () => {
    const steps = generateAsStridedTensorViewEngineSteps(DEFAULT_ASSTRIDEDTENSORVIEWENGINE_INPUT);
    expect(steps.length).toBeGreaterThan(0);
    expect(steps[0].explanation.what).toContain("PyTorch ATen `as_strided` Zero-Copy View Engine");
    expect(steps[steps.length - 1].explanation.what).toBe("Execution Complete");
  });
});
