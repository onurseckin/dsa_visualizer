import { describe, it, expect } from "vitest";
import {
  hardwareRooflineModelCalculator,
  DEFAULT_HARDWAREROOFLINEMODELCALCULATOR_INPUT,
  generateHardwareRooflineModelCalculatorSteps,
  HARDWAREROOFLINEMODELCALCULATOR_CODE,
} from "./hardwareRooflineModelCalculator";

describe("hardware-roofline-model-calculator (Berkeley Hardware Roofline Model Calculator)", () => {
  it("should have correct metadata", () => {
    expect(hardwareRooflineModelCalculator.id).toBe("hardware-roofline-model-calculator");
    expect(hardwareRooflineModelCalculator.isMlInfra).toBe(true);
    expect(hardwareRooflineModelCalculator.mlInfraLevel).toBe(2);
    expect(hardwareRooflineModelCalculator.mlInfraCategory).toBe("ml_gemm_roofline");
    expect(hardwareRooflineModelCalculator.categories).toContain("ml_gemm_roofline");
  });

  it("should generate at least 20 algorithm steps with matrix snapshots", () => {
    const steps = generateHardwareRooflineModelCalculatorSteps(
      DEFAULT_HARDWAREROOFLINEMODELCALCULATOR_INPUT,
    );
    expect(steps.length).toBeGreaterThanOrEqual(20);
    expect(steps[0].explanation.what).toContain("Berkeley Hardware Roofline Calculator");
    expect(steps[0].primarySnapshot.kind).toBe("matrix");
    expect(steps[steps.length - 1].explanation.what).toContain("Execution Complete");
  });

  it("should map every line of code in lineExplanations", () => {
    const codeLines = HARDWAREROOFLINEMODELCALCULATOR_CODE.split("\n");
    const trivia = hardwareRooflineModelCalculator.trivia;
    expect(trivia).toBeDefined();
    if (!trivia) return;

    for (let i = 1; i <= codeLines.length; i++) {
      expect(trivia.lineExplanations[i]).toBeDefined();
      expect(typeof trivia.lineExplanations[i]).toBe("string");
      expect(trivia.lineExplanations[i].length).toBeGreaterThan(0);
    }
  });
});
