import { describe, it, expect } from "vitest";
import {
  conv1dSlidingWindowDirect,
  DEFAULT_CONV1DSLIDINGWINDOWDIRECT_INPUT,
  generateConv1dSlidingWindowDirectSteps,
} from "./conv1dSlidingWindowDirect";

describe("conv1dSlidingWindowDirect (1D Cross-Correlation Basics)", () => {
  it("should have correct metadata", () => {
    expect(conv1dSlidingWindowDirect.id).toBe("conv1dSlidingWindowDirect");
    expect(conv1dSlidingWindowDirect.isMlInfra).toBe(true);
    expect(conv1dSlidingWindowDirect.mlInfraLevel).toBe(8);
    expect(conv1dSlidingWindowDirect.mlInfraCategory).toBe("ml_convolutions");
    expect(conv1dSlidingWindowDirect.categories).toContain("ml_convolutions");
  });

  it("should generate valid algorithm steps", () => {
    const steps = generateConv1dSlidingWindowDirectSteps(DEFAULT_CONV1DSLIDINGWINDOWDIRECT_INPUT);
    expect(steps.length).toBeGreaterThan(0);
    expect(steps[0].explanation.what).toContain("1D Cross-Correlation Basics");
    expect(steps[steps.length - 1].explanation.what).toBe("Execution Complete");
  });
});
