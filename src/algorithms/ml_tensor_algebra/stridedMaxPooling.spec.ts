import { describe, it, expect } from "vitest";
import { stridedMaxPooling, DEFAULT_STRIDEDMAXPOOLING_INPUT, generateStridedMaxPoolingSteps } from "./stridedMaxPooling";

describe("strided-max-pooling (2D Strided Max Pooling Operator)", () => {
  it("should have correct metadata", () => {
    expect(stridedMaxPooling.id).toBe("strided-max-pooling");
    expect(stridedMaxPooling.isMlInfra).toBe(true);
    expect(stridedMaxPooling.mlInfraLevel).toBe(1);
    expect(stridedMaxPooling.mlInfraCategory).toBe("ml_tensor_algebra");
    expect(stridedMaxPooling.categories).toContain("ml_tensor_algebra");
  });

  it("should generate valid algorithm steps", () => {
    const steps = generateStridedMaxPoolingSteps(DEFAULT_STRIDEDMAXPOOLING_INPUT);
    expect(steps.length).toBeGreaterThan(0);
    expect(steps[0].explanation.what).toContain("2D Strided Max Pooling Operator");
    expect(steps[steps.length - 1].explanation.what).toBe("Execution Complete");
  });
});
