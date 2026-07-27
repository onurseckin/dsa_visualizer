import { describe, it, expect } from "vitest";
import {
  ropeFrequencyScalingYarn,
  DEFAULT_ROPEFREQUENCYSCALINGYARN_INPUT,
  generateRopeFrequencyScalingYarnSteps,
  ROPEFREQUENCYSCALINGYARN_CODE,
} from "./ropeFrequencyScalingYarn";

describe("rope-frequency-scaling-yarn (RoPE NTK-Aware & YaRN Frequency Scaling)", () => {
  it("should have correct metadata", () => {
    expect(ropeFrequencyScalingYarn.id).toBe("rope-frequency-scaling-yarn");
    expect(ropeFrequencyScalingYarn.isMlInfra).toBe(true);
    expect(ropeFrequencyScalingYarn.mlInfraLevel).toBe(7);
    expect(ropeFrequencyScalingYarn.mlInfraCategory).toBe("ml_attention_geometry");
    expect(ropeFrequencyScalingYarn.categories).toContain("ml_attention_geometry");
  });

  it("should generate at least 20 algorithm steps with matrix visual snapshots", () => {
    const steps = generateRopeFrequencyScalingYarnSteps(
      DEFAULT_ROPEFREQUENCYSCALINGYARN_INPUT,
    );
    expect(steps.length).toBeGreaterThanOrEqual(20);
    expect(steps[0].explanation.what).toContain(
      "Initialize RoPE NTK-Aware & YaRN Frequency Scaling",
    );
    expect(steps[steps.length - 1].explanation.what).toBe("Execution Complete");

    steps.forEach((step) => {
      expect(step.primarySnapshot.kind).toBe("matrix");
    });
  });

  it("should map every code line in trivia.lineExplanations", () => {
    const codeLines = ROPEFREQUENCYSCALINGYARN_CODE.trim().split("\n");
    const lineExplanations = ropeFrequencyScalingYarn.trivia?.lineExplanations || {};

    for (let i = 1; i <= codeLines.length; i++) {
      expect(lineExplanations[i]).toBeDefined();
      expect(lineExplanations[i].length).toBeGreaterThan(0);
    }
  });
});
