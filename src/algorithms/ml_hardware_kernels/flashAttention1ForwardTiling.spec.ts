import { describe, it, expect } from "vitest";
import { flashAttention1ForwardTiling } from "./flashAttention1ForwardTiling";

describe("flashAttention1ForwardTiling", () => {
  it("should have valid metadata", () => {
    expect(flashAttention1ForwardTiling.id).toBeDefined();
    expect(flashAttention1ForwardTiling.title).toBeDefined();
    expect(flashAttention1ForwardTiling.code).toBeDefined();
    expect(flashAttention1ForwardTiling.examples?.length).toBeGreaterThan(0);
  });

  it("should generate at least 20 steps with matrix snapshot for default input", () => {
    const steps = flashAttention1ForwardTiling.generateSteps(
      flashAttention1ForwardTiling.defaultInput,
    );
    expect(steps.length).toBeGreaterThanOrEqual(20);
    expect(steps[0].primarySnapshot.kind).toBe("matrix");
    expect(steps[steps.length - 1].primarySnapshot.kind).toBe("matrix");
  });

  it("should map every code line in trivia.lineExplanations", () => {
    const codeLines = flashAttention1ForwardTiling.code.trim().split("\n");
    const lineExplanations = flashAttention1ForwardTiling.trivia?.lineExplanations;
    expect(lineExplanations).toBeDefined();

    codeLines.forEach((_, index) => {
      const lineNum = index + 1;
      expect(lineExplanations?.[lineNum]).toBeDefined();
      expect(typeof lineExplanations?.[lineNum]).toBe("string");
      expect(lineExplanations?.[lineNum].length).toBeGreaterThan(0);
    });
  });
});
