import { describe, it, expect } from "vitest";
import {
  sequenceLengthPaddingWasteCalculator,
  DEFAULT_SEQUENCELENGTHPADDINGWASTECALCULATOR_INPUT,
  generateSequenceLengthPaddingWasteCalculatorSteps,
} from "./sequenceLengthPaddingWasteCalculator";

describe("sequence-length-padding-waste-calculator (Static Batching VRAM Padding Waste Calculator)", () => {
  it("should have correct metadata and full trivia lineExplanations", () => {
    expect(sequenceLengthPaddingWasteCalculator.id).toBe(
      "sequence-length-padding-waste-calculator",
    );
    expect(
      sequenceLengthPaddingWasteCalculator.topicIds.some((topicId) => topicId.startsWith("ml_")),
    ).toBe(true);
    expect(sequenceLengthPaddingWasteCalculator.topicIds).toContain("ml_llm_serving");
    expect(sequenceLengthPaddingWasteCalculator.topicIds).toContain("ml_llm_serving");
    expect(sequenceLengthPaddingWasteCalculator.defaultInput).toEqual(
      DEFAULT_SEQUENCELENGTHPADDINGWASTECALCULATOR_INPUT,
    );

    const codeLines = sequenceLengthPaddingWasteCalculator.code.trim().split("\n").length;
    const explanationKeys = Object.keys(
      sequenceLengthPaddingWasteCalculator.trivia?.lineExplanations || {},
    ).map(Number);
    expect(explanationKeys.length).toBe(codeLines);
    for (let i = 1; i <= codeLines; i++) {
      expect(sequenceLengthPaddingWasteCalculator.trivia?.lineExplanations?.[i]).toBeDefined();
    }
  });

  it("should generate valid algorithm steps and produce >= 20 steps", () => {
    const steps = generateSequenceLengthPaddingWasteCalculatorSteps(
      DEFAULT_SEQUENCELENGTHPADDINGWASTECALCULATOR_INPUT,
    );
    expect(steps.length).toBeGreaterThanOrEqual(20);
    expect(steps[0].codeLine).toBe(1);
    expect(steps[steps.length - 1].codeLine).toBe(18);
  });
});
