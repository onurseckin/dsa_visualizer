import { describe, it, expect } from "vitest";
import {
  fp16ModelMemoryFootprintCalculator,
  DEFAULT_FP16MODELMEMORYFOOTPRINTCALCULATOR_INPUT,
  generateFp16ModelMemoryFootprintCalculatorSteps,
} from "./fp16ModelMemoryFootprintCalculator";

describe("fp16-model-memory-footprint-calculator (Mixed-Precision 16-Psi Model Memory Calculator)", () => {
  it("should have correct metadata", () => {
    expect(fp16ModelMemoryFootprintCalculator.id).toBe("fp16-model-memory-footprint-calculator");
    expect(fp16ModelMemoryFootprintCalculator.isMlInfra).toBe(true);
    expect(fp16ModelMemoryFootprintCalculator.mlInfraLevel).toBe(11);
    expect(fp16ModelMemoryFootprintCalculator.mlInfraCategory).toBe("ml_distributed_systems");
    expect(fp16ModelMemoryFootprintCalculator.categories).toContain("ml_distributed_systems");
  });

  it("should generate valid algorithm steps", () => {
    const steps = generateFp16ModelMemoryFootprintCalculatorSteps(
      DEFAULT_FP16MODELMEMORYFOOTPRINTCALCULATOR_INPUT,
    );
    expect(steps.length).toBeGreaterThan(0);
    expect(steps[0].explanation.what).toContain("Mixed-Precision 16-Psi Model Memory Calculator");
    expect(steps[steps.length - 1].explanation.what).toBe("Execution Complete");
  });
});
