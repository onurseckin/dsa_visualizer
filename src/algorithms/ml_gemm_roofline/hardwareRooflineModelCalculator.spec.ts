import { describe, it, expect } from "vitest";
import {
  hardwareRooflineModelCalculator,
  DEFAULT_HARDWAREROOFLINEMODELCALCULATOR_INPUT,
  generateHardwareRooflineModelCalculatorSteps,
} from "./hardwareRooflineModelCalculator";

describe("hardware-roofline-model-calculator (Berkeley Hardware Roofline Model Calculator)", () => {
  it("should have correct metadata", () => {
    expect(hardwareRooflineModelCalculator.id).toBe("hardware-roofline-model-calculator");
    expect(hardwareRooflineModelCalculator.isMlInfra).toBe(true);
    expect(hardwareRooflineModelCalculator.mlInfraLevel).toBe(2);
    expect(hardwareRooflineModelCalculator.mlInfraCategory).toBe("ml_gemm_roofline");
    expect(hardwareRooflineModelCalculator.categories).toContain("ml_gemm_roofline");
  });

  it("should generate valid algorithm steps", () => {
    const steps = generateHardwareRooflineModelCalculatorSteps(
      DEFAULT_HARDWAREROOFLINEMODELCALCULATOR_INPUT,
    );
    expect(steps.length).toBeGreaterThan(0);
    expect(steps[0].explanation.what).toContain("Initialize Roofline Calculation");
    expect(steps[steps.length - 1].explanation.what).toBe("Compare AI and Machine Balance");
  });
});
