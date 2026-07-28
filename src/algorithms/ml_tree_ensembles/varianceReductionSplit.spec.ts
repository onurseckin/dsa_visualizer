import { describe, it, expect } from "vitest";
import { varianceReductionSplit } from "./varianceReductionSplit";

describe("variance-reduction-split", () => {
  it("should have valid metadata and comment-free code", () => {
    expect(varianceReductionSplit.id).toBeDefined();
    expect(varianceReductionSplit.title).toBeDefined();
    expect(varianceReductionSplit.code).toBeDefined();
    expect(varianceReductionSplit.examples?.length).toBeGreaterThan(0);

    // Verify code has no Python comments
    expect(varianceReductionSplit.code).not.toMatch(/#(?![^"']*["']).*/);
    expect(varianceReductionSplit.code).not.toContain('"""');
    expect(varianceReductionSplit.code).not.toContain("'''");
  });

  it("should generate valid steps", () => {
    const steps = varianceReductionSplit.generateSteps(varianceReductionSplit.defaultInput);
    expect(steps.length).toBeGreaterThan(0);
    expect(steps[0].primarySnapshot.kind).toBeDefined();
    expect(steps[steps.length - 1].primarySnapshot.kind).toBeDefined();

    const codeLinesCount = varianceReductionSplit.code.split("\n").length;
    steps.forEach((step) => {
      expect(step.codeLine).toBeGreaterThanOrEqual(1);
      expect(step.codeLine).toBeLessThanOrEqual(codeLinesCount);
    });
  });

  it("should map every line of code in trivia.lineExplanations", () => {
    const codeLines = varianceReductionSplit.code.split("\n");
    const lineExplanations = varianceReductionSplit.trivia?.lineExplanations || {};

    codeLines.forEach((_, idx) => {
      const lineNum = idx + 1;
      expect(lineExplanations[lineNum]).toBeDefined();
    });
  });
});
