import { describe, it, expect } from "vitest";
import {
  fp16ModelMemoryFootprintCalculator,
  FP16MODELMEMORYFOOTPRINTCALCULATOR_CODE,
  DEFAULT_FP16MODELMEMORYFOOTPRINTCALCULATOR_INPUT,
  generateFp16ModelMemoryFootprintCalculatorSteps,
} from "./fp16ModelMemoryFootprintCalculator";

describe("fp16-model-memory-footprint-calculator (Mixed-Precision FP16 Model Memory Calculator)", () => {
  it("should have correct metadata", () => {
    expect(fp16ModelMemoryFootprintCalculator.id).toBe("fp16-model-memory-footprint-calculator");
    expect(fp16ModelMemoryFootprintCalculator.isMlInfra).toBe(true);
    expect(fp16ModelMemoryFootprintCalculator.mlInfraLevel).toBe(11);
    expect(fp16ModelMemoryFootprintCalculator.mlInfraCategory).toBe("ml_distributed_systems");
    expect(fp16ModelMemoryFootprintCalculator.categories).toContain("ml_distributed_systems");
  });

  it("should generate >= 20 algorithm steps", () => {
    const steps = generateFp16ModelMemoryFootprintCalculatorSteps(
      DEFAULT_FP16MODELMEMORYFOOTPRINTCALCULATOR_INPUT,
    );
    expect(steps.length).toBeGreaterThanOrEqual(20);
    expect(steps[0].explanation.what).toContain("Enter fp16_model_memory_footprint_calculator");
    expect(steps[steps.length - 1].explanation.what).toBe("Return Static Memory Footprint Dictionary");
  });

  it("should have lineExplanations mapping every code line", () => {
    const codeLines = FP16MODELMEMORYFOOTPRINTCALCULATOR_CODE.trimEnd().split("\n").length;
    const explanations = fp16ModelMemoryFootprintCalculator.trivia?.lineExplanations || {};
    expect(Object.keys(explanations).length).toBe(codeLines);
    for (let i = 1; i <= codeLines; i++) {
      expect(explanations[i]).toBeDefined();
    }
  });
});
