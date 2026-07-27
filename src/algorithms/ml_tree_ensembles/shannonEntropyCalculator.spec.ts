import { describe, it, expect } from "vitest";
import { shannonEntropyCalculator, DEFAULT_SHANNONENTROPYCALCULATOR_INPUT, generateShannonEntropyCalculatorSteps } from "./shannonEntropyCalculator";

describe("shannon-entropy-calculator (Shannon Entropy Calculator)", () => {
  it("should have correct metadata", () => {
    expect(shannonEntropyCalculator.id).toBe("shannon-entropy-calculator");
    expect(shannonEntropyCalculator.isMlInfra).toBe(true);
    expect(shannonEntropyCalculator.mlInfraLevel).toBe(9);
    expect(shannonEntropyCalculator.mlInfraCategory).toBe("ml_tree_ensembles");
    expect(shannonEntropyCalculator.categories).toContain("ml_tree_ensembles");
  });

  it("should generate valid algorithm steps", () => {
    const steps = generateShannonEntropyCalculatorSteps(DEFAULT_SHANNONENTROPYCALCULATOR_INPUT);
    expect(steps.length).toBeGreaterThan(0);
    expect(steps[0].explanation.what).toContain("Shannon Entropy Calculator");
    expect(steps[steps.length - 1].explanation.what).toBe("Execution Complete");
  });
});
