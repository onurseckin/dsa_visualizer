import { describe, it, expect } from "vitest";
import { bankConflictSwizzleCalculator, DEFAULT_BANKCONFLICTSWIZZLECALCULATOR_INPUT, generateBankConflictSwizzleCalculatorSteps } from "./bankConflictSwizzleCalculator";

describe("bank-conflict-swizzle-calculator (GPU Shared Memory Bank Conflict Swizzle Calculator)", () => {
  it("should have correct metadata", () => {
    expect(bankConflictSwizzleCalculator.id).toBe("bank-conflict-swizzle-calculator");
    expect(bankConflictSwizzleCalculator.isMlInfra).toBe(true);
    expect(bankConflictSwizzleCalculator.mlInfraLevel).toBe(10);
    expect(bankConflictSwizzleCalculator.mlInfraCategory).toBe("ml_hardware_kernels");
    expect(bankConflictSwizzleCalculator.categories).toContain("ml_hardware_kernels");
  });

  it("should generate valid algorithm steps", () => {
    const steps = generateBankConflictSwizzleCalculatorSteps(DEFAULT_BANKCONFLICTSWIZZLECALCULATOR_INPUT);
    expect(steps.length).toBeGreaterThan(0);
    expect(steps[0].explanation.what).toContain("GPU Shared Memory Bank Conflict Swizzle Calculator");
    expect(steps[steps.length - 1].explanation.what).toBe("Execution Complete");
  });
});
