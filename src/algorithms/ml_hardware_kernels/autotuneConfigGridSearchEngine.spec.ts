import { describe, it, expect } from "vitest";
import { autotuneConfigGridSearchEngine } from "./autotuneConfigGridSearchEngine";

describe("autotuneConfigGridSearchEngine", () => {
  it("should have valid metadata", () => {
    expect(autotuneConfigGridSearchEngine.id).toBeDefined();
    expect(autotuneConfigGridSearchEngine.title).toBeDefined();
    expect(autotuneConfigGridSearchEngine.code).toBeDefined();
    expect(autotuneConfigGridSearchEngine.examples?.length).toBeGreaterThan(0);
  });

  it("should generate at least 20 steps for default input", () => {
    const steps = autotuneConfigGridSearchEngine.generateSteps(
      autotuneConfigGridSearchEngine.defaultInput,
    );
    expect(steps.length).toBeGreaterThanOrEqual(20);
    expect(steps[0].primarySnapshot.kind).toBeDefined();
    expect(steps[steps.length - 1].primarySnapshot.kind).toBeDefined();
  });

  it("should map every code line in trivia.lineExplanations", () => {
    const codeLines = autotuneConfigGridSearchEngine.code.trim().split("\n");
    const lineExplanations = autotuneConfigGridSearchEngine.trivia?.lineExplanations;
    expect(lineExplanations).toBeDefined();

    codeLines.forEach((_, index) => {
      const lineNum = index + 1;
      expect(lineExplanations?.[lineNum]).toBeDefined();
      expect(typeof lineExplanations?.[lineNum]).toBe("string");
      expect(lineExplanations?.[lineNum].length).toBeGreaterThan(0);
    });
  });
});
