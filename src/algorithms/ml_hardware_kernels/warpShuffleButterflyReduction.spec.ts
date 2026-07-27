import { describe, it, expect } from "vitest";
import { warpShuffleButterflyReduction } from "./warpShuffleButterflyReduction";

describe("warpShuffleButterflyReduction", () => {
  it("should have valid metadata", () => {
    expect(warpShuffleButterflyReduction.id).toBeDefined();
    expect(warpShuffleButterflyReduction.title).toBeDefined();
    expect(warpShuffleButterflyReduction.code).toBeDefined();
    expect(warpShuffleButterflyReduction.examples?.length).toBeGreaterThan(0);
  });

  it("should generate at least 20 steps with matrix snapshot for default input", () => {
    const steps = warpShuffleButterflyReduction.generateSteps(
      warpShuffleButterflyReduction.defaultInput,
    );
    expect(steps.length).toBeGreaterThanOrEqual(20);
    expect(steps[0].primarySnapshot.kind).toBe("matrix");
    expect(steps[steps.length - 1].primarySnapshot.kind).toBe("matrix");
  });

  it("should map every code line in trivia.lineExplanations", () => {
    const codeLines = warpShuffleButterflyReduction.code.trim().split("\n");
    const lineExplanations = warpShuffleButterflyReduction.trivia?.lineExplanations;
    expect(lineExplanations).toBeDefined();

    codeLines.forEach((_, index) => {
      const lineNum = index + 1;
      expect(lineExplanations?.[lineNum]).toBeDefined();
      expect(typeof lineExplanations?.[lineNum]).toBe("string");
      expect(lineExplanations?.[lineNum].length).toBeGreaterThan(0);
    });
  });
});
