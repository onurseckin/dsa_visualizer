import { describe, it, expect } from "vitest";
import { bankConflictSwizzleCalculator } from "./bankConflictSwizzleCalculator";

describe("bankConflictSwizzleCalculator", () => {
  it("should have valid metadata", () => {
    expect(bankConflictSwizzleCalculator.id).toBeDefined();
    expect(bankConflictSwizzleCalculator.title).toBeDefined();
    expect(bankConflictSwizzleCalculator.code).toBeDefined();
    expect(bankConflictSwizzleCalculator.examples?.length).toBeGreaterThan(0);
  });

  it("should generate at least 20 steps with matrix snapshot for default input", () => {
    const steps = bankConflictSwizzleCalculator.generateSteps(
      bankConflictSwizzleCalculator.defaultInput,
    );
    expect(steps.length).toBeGreaterThanOrEqual(20);
    expect(steps[0].primarySnapshot.kind).toBe("matrix");
    expect(steps[steps.length - 1].primarySnapshot.kind).toBe("matrix");
  });

  it("should map every code line in trivia.lineExplanations", () => {
    const codeLines = bankConflictSwizzleCalculator.code.trim().split("\n");
    const lineExplanations = bankConflictSwizzleCalculator.trivia?.lineExplanations;
    expect(lineExplanations).toBeDefined();

    codeLines.forEach((_, index) => {
      const lineNum = index + 1;
      expect(lineExplanations?.[lineNum]).toBeDefined();
      expect(typeof lineExplanations?.[lineNum]).toBe("string");
      expect(lineExplanations?.[lineNum].length).toBeGreaterThan(0);
    });
  });
});
