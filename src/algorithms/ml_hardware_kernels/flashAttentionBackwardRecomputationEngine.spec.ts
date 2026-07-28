import { describe, it, expect } from "vitest";
import { flashAttentionBackwardRecomputationEngine } from "./flashAttentionBackwardRecomputationEngine";

describe("flash-attention-backward-recomputation-engine", () => {
  it("should have valid metadata", () => {
    expect(flashAttentionBackwardRecomputationEngine.id).toBeDefined();
    expect(flashAttentionBackwardRecomputationEngine.title).toBeDefined();
    expect(flashAttentionBackwardRecomputationEngine.code).toBeDefined();
    expect(flashAttentionBackwardRecomputationEngine.examples?.length).toBeGreaterThan(0);
  });

  it("should generate at least 20 steps with matrix snapshot for default input", () => {
    const steps = flashAttentionBackwardRecomputationEngine.generateSteps(
      flashAttentionBackwardRecomputationEngine.defaultInput,
    );
    expect(steps.length).toBeGreaterThanOrEqual(20);
    expect(steps[0].primarySnapshot.kind).toBe("matrix");
    expect(steps[steps.length - 1].primarySnapshot.kind).toBe("matrix");
  });

  it("should map every code line in trivia.lineExplanations", () => {
    const codeLines = flashAttentionBackwardRecomputationEngine.code.trim().split("\n");
    const lineExplanations = flashAttentionBackwardRecomputationEngine.trivia?.lineExplanations;
    expect(lineExplanations).toBeDefined();

    codeLines.forEach((_, index) => {
      const lineNum = index + 1;
      expect(lineExplanations?.[lineNum]).toBeDefined();
      expect(typeof lineExplanations?.[lineNum]).toBe("string");
      expect(lineExplanations?.[lineNum].length).toBeGreaterThan(0);
    });
  });
});
