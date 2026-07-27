import { describe, it, expect } from "vitest";
import {
  sequenceLengthPaddingWasteCalculator,
  DEFAULT_SEQUENCELENGTHPADDINGWASTECALCULATOR_INPUT,
  generateSequenceLengthPaddingWasteCalculatorSteps,
} from "./sequenceLengthPaddingWasteCalculator";

describe("sequence-length-padding-waste-calculator (Static Batching VRAM Padding Waste Calculator)", () => {
  it("should have correct metadata", () => {
    expect(sequenceLengthPaddingWasteCalculator.id).toBe(
      "sequence-length-padding-waste-calculator",
    );
    expect(sequenceLengthPaddingWasteCalculator.isMlInfra).toBe(true);
    expect(sequenceLengthPaddingWasteCalculator.mlInfraLevel).toBe(12);
    expect(sequenceLengthPaddingWasteCalculator.mlInfraCategory).toBe("ml_llm_serving");
    expect(sequenceLengthPaddingWasteCalculator.categories).toContain("ml_llm_serving");
  });

  it("should generate valid algorithm steps", () => {
    const steps = generateSequenceLengthPaddingWasteCalculatorSteps(
      DEFAULT_SEQUENCELENGTHPADDINGWASTECALCULATOR_INPUT,
    );
    expect(steps.length).toBeGreaterThan(0);
    expect(steps[0].explanation.what).toContain("Static Batching VRAM Padding Waste Calculator");
    expect(steps[steps.length - 1].explanation.what).toBe("Execution Complete");
  });
});
