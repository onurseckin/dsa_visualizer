import { describe, it, expect } from "vitest";
import {
  multiChannelConv2dAccumulation,
  DEFAULT_MULTICHANNELCONV2DACCUMULATION_INPUT,
  generateMultiChannelConv2dAccumulationSteps,
} from "./multiChannelConv2dAccumulation";

describe("multiChannelConv2dAccumulation", () => {
  it("should have correct metadata", () => {
    expect(multiChannelConv2dAccumulation.id).toBe("multiChannelConv2dAccumulation");
    expect(multiChannelConv2dAccumulation.isMlInfra).toBe(true);
    expect(multiChannelConv2dAccumulation.mlInfraLevel).toBe(8);
    expect(multiChannelConv2dAccumulation.mlInfraCategory).toBe("ml_convolutions");
    expect(multiChannelConv2dAccumulation.categories).toContain("ml_convolutions");
    expect(multiChannelConv2dAccumulation.categories).toContain("ml_hardware_kernels");
  });

  it("should generate valid algorithm steps", () => {
    const steps = generateMultiChannelConv2dAccumulationSteps(
      DEFAULT_MULTICHANNELCONV2DACCUMULATION_INPUT,
    );
    expect(steps.length).toBeGreaterThan(0);
    expect(steps[0].explanation.what).toContain("Multi-Channel Conv2D Accumulator");
    expect(steps[steps.length - 1].explanation.what).toBe("Execution Complete");
  });
});
