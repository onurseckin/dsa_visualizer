import { describe, it, expect } from "vitest";
import {
  ropeFrequencyScalingYarn,
  DEFAULT_ROPEFREQUENCYSCALINGYARN_INPUT,
  generateRopeFrequencyScalingYarnSteps,
} from "./ropeFrequencyScalingYarn";

describe("rope-frequency-scaling-yarn (RoPE NTK-Aware & YaRN Frequency Scaling)", () => {
  it("should have correct metadata", () => {
    expect(ropeFrequencyScalingYarn.id).toBe("rope-frequency-scaling-yarn");
    expect(ropeFrequencyScalingYarn.isMlInfra).toBe(true);
    expect(ropeFrequencyScalingYarn.mlInfraLevel).toBe(7);
    expect(ropeFrequencyScalingYarn.mlInfraCategory).toBe("ml_attention_geometry");
    expect(ropeFrequencyScalingYarn.categories).toContain("ml_attention_geometry");
  });

  it("should generate valid algorithm steps", () => {
    const steps = generateRopeFrequencyScalingYarnSteps(DEFAULT_ROPEFREQUENCYSCALINGYARN_INPUT);
    expect(steps.length).toBeGreaterThan(0);
    expect(steps[0].explanation.what).toContain("RoPE NTK-Aware & YaRN Frequency Scaling");
    expect(steps[steps.length - 1].explanation.what).toBe("Execution Complete");
  });
});
