import { describe, it, expect } from "vitest";
import { hbmVsSramBandwidthCalculator } from "./hbmVsSramBandwidthCalculator";

describe("hbmVsSramBandwidthCalculator", () => {
  it("should have valid metadata", () => {
    expect(hbmVsSramBandwidthCalculator.id).toBeDefined();
    expect(hbmVsSramBandwidthCalculator.title).toBeDefined();
    expect(hbmVsSramBandwidthCalculator.code).toBeDefined();
    expect(hbmVsSramBandwidthCalculator.examples?.length).toBeGreaterThan(0);
  });

  it("should generate valid steps", () => {
    const steps = hbmVsSramBandwidthCalculator.generateSteps(
      hbmVsSramBandwidthCalculator.defaultInput,
    );
    expect(steps.length).toBeGreaterThan(0);
    expect(steps[0].primarySnapshot.kind).toBeDefined();
    expect(steps[steps.length - 1].primarySnapshot.kind).toBeDefined();
  });
});
