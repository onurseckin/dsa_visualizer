import { describe, it, expect } from "vitest";
import {
  conv2dPaddingStrideOutputShape,
  DEFAULT_CONV2DPADDINGSTRIDEOUTPUTSHAPE_INPUT,
  generateConv2dPaddingStrideOutputShapeSteps,
} from "./conv2dPaddingStrideOutputShape";

describe("conv2dPaddingStrideOutputShape (2D Conv Output Shape Calculator)", () => {
  it("should have correct metadata", () => {
    expect(conv2dPaddingStrideOutputShape.id).toBe("conv2dPaddingStrideOutputShape");
    expect(conv2dPaddingStrideOutputShape.isMlInfra).toBe(true);
    expect(conv2dPaddingStrideOutputShape.mlInfraLevel).toBe(8);
    expect(conv2dPaddingStrideOutputShape.mlInfraCategory).toBe("ml_convolutions");
    expect(conv2dPaddingStrideOutputShape.categories).toContain("ml_convolutions");
  });

  it("should generate valid algorithm steps", () => {
    const steps = generateConv2dPaddingStrideOutputShapeSteps(
      DEFAULT_CONV2DPADDINGSTRIDEOUTPUTSHAPE_INPUT,
    );
    expect(steps.length).toBeGreaterThan(0);
    expect(steps[0].explanation.what).toContain("2D Conv Output Shape Calculator");
    expect(steps[steps.length - 1].explanation.what).toBe("Execution Complete");
  });
});
