import { describe, it, expect } from "vitest";
import {
  multiChannelConv2dAccumulation,
  DEFAULT_MULTICHANNELCONV2DACCUMULATION_INPUT,
  generateMultiChannelConv2dAccumulationSteps,
} from "./multiChannelConv2dAccumulation";

describe("multi-channel-conv2d-accumulation (Multi-Channel Conv2D Accumulator)", () => {
  it("should have correct metadata", () => {
    expect(multiChannelConv2dAccumulation.id).toBe("multi-channel-conv2d-accumulation");
    expect(multiChannelConv2dAccumulation.isMlInfra).toBe(true);
    expect(multiChannelConv2dAccumulation.mlInfraLevel).toBe(8);
    expect(multiChannelConv2dAccumulation.mlInfraCategory).toBe("ml_convolutions");
    expect(multiChannelConv2dAccumulation.categories).toContain("ml_convolutions");
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
