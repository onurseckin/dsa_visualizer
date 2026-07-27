import { describe, it, expect } from "vitest";
import {
  conv2dSlidingWindowDirect,
  DEFAULT_CONV2DSLIDINGWINDOWDIRECT_INPUT,
  generateConv2dSlidingWindowDirectSteps,
} from "./conv2dSlidingWindowDirect";

describe("conv2dSlidingWindowDirect (2D Direct Sliding Window Convolution)", () => {
  it("should have correct metadata", () => {
    expect(conv2dSlidingWindowDirect.id).toBe("conv2dSlidingWindowDirect");
    expect(conv2dSlidingWindowDirect.isMlInfra).toBe(true);
    expect(conv2dSlidingWindowDirect.mlInfraLevel).toBe(8);
    expect(conv2dSlidingWindowDirect.mlInfraCategory).toBe("ml_convolutions");
    expect(conv2dSlidingWindowDirect.categories).toContain("ml_convolutions");
  });

  it("should generate valid algorithm steps", () => {
    const steps = generateConv2dSlidingWindowDirectSteps(DEFAULT_CONV2DSLIDINGWINDOWDIRECT_INPUT);
    expect(steps.length).toBeGreaterThan(0);
    expect(steps[0].explanation.what).toContain("Initialize dimensions");
    expect(steps[steps.length - 1].explanation.what).toBe("Convolution Complete");
  });
});
