import { describe, it, expect } from "vitest";
import {
  receptiveFieldGrowthCalculator,
  DEFAULT_RECEPTIVEFIELDGROWTHCALCULATOR_INPUT,
  generateReceptiveFieldGrowthCalculatorSteps,
} from "./receptiveFieldGrowthCalculator";

describe("receptiveFieldGrowthCalculator", () => {
  it("should have correct metadata", () => {
    expect(receptiveFieldGrowthCalculator.id).toBe("receptiveFieldGrowthCalculator");
    expect(receptiveFieldGrowthCalculator.isMlInfra).toBe(true);
    expect(receptiveFieldGrowthCalculator.mlInfraLevel).toBe(8);
    expect(receptiveFieldGrowthCalculator.mlInfraCategory).toBe("ml_convolutions");
    expect(receptiveFieldGrowthCalculator.categories).toContain("ml_convolutions");
    expect(receptiveFieldGrowthCalculator.categories).toContain("ml_tensor_algebra");
  });

  it("should generate valid algorithm steps", () => {
    const steps = generateReceptiveFieldGrowthCalculatorSteps(
      DEFAULT_RECEPTIVEFIELDGROWTHCALCULATOR_INPUT,
    );
    expect(steps.length).toBeGreaterThan(0);
    expect(steps[0].explanation.what).toContain("Receptive Field Growth Calculator");
    expect(steps[steps.length - 1].explanation.what).toBe("Execution Complete");
  });
});
