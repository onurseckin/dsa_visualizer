import { describe, it, expect } from "vitest";
import { bankConflictSwizzleCalculator } from "./bankConflictSwizzleCalculator";

describe("bankConflictSwizzleCalculator", () => {
  it("should have valid metadata", () => {
    expect(bankConflictSwizzleCalculator.id).toBeDefined();
    expect(bankConflictSwizzleCalculator.title).toBeDefined();
    expect(bankConflictSwizzleCalculator.code).toBeDefined();
    expect(bankConflictSwizzleCalculator.examples?.length).toBeGreaterThan(0);
  });

  it("should generate valid steps", () => {
    const steps = bankConflictSwizzleCalculator.generateSteps(
      bankConflictSwizzleCalculator.defaultInput,
    );
    expect(steps.length).toBeGreaterThan(0);
    expect(steps[0].primarySnapshot.kind).toBeDefined();
    expect(steps[steps.length - 1].primarySnapshot.kind).toBeDefined();
  });
});
