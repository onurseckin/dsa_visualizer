import { describe, it, expect } from "vitest";
import {
  conv2dToGemmReceptiveFieldUnroll,
  DEFAULT_CONV2DTOGEMMRECEPTIVEFIELDUNROLL_INPUT,
  generateConv2dToGemmReceptiveFieldUnrollSteps,
} from "./conv2dToGemmReceptiveFieldUnroll";

describe("conv2dToGemmReceptiveFieldUnroll (Conv2D Receptive Field Patch Unroller)", () => {
  it("should have correct metadata", () => {
    expect(conv2dToGemmReceptiveFieldUnroll.id).toBe("conv2dToGemmReceptiveFieldUnroll");
    expect(conv2dToGemmReceptiveFieldUnroll.isMlInfra).toBe(true);
    expect(conv2dToGemmReceptiveFieldUnroll.mlInfraLevel).toBe(8);
    expect(conv2dToGemmReceptiveFieldUnroll.mlInfraCategory).toBe("ml_convolutions");
    expect(conv2dToGemmReceptiveFieldUnroll.categories).toContain("ml_convolutions");
  });

  it("should generate valid algorithm steps", () => {
    const steps = generateConv2dToGemmReceptiveFieldUnrollSteps(
      DEFAULT_CONV2DTOGEMMRECEPTIVEFIELDUNROLL_INPUT,
    );
    expect(steps.length).toBeGreaterThan(0);
    expect(steps[0].explanation.what).toContain("Conv2D Receptive Field Patch Unroller");
    expect(steps[steps.length - 1].explanation.what).toBe("Execution Complete");
  });
});
