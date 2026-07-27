import { describe, it, expect } from "vitest";
import { flashAttention2SequenceParallelForward } from "./flashAttention2SequenceParallelForward";

describe("flashAttention2SequenceParallelForward", () => {
  it("should have valid metadata", () => {
    expect(flashAttention2SequenceParallelForward.id).toBeDefined();
    expect(flashAttention2SequenceParallelForward.title).toBeDefined();
    expect(flashAttention2SequenceParallelForward.code).toBeDefined();
    expect(flashAttention2SequenceParallelForward.examples?.length).toBeGreaterThan(0);
  });

  it("should generate at least 20 steps with matrix snapshot for default input", () => {
    const steps = flashAttention2SequenceParallelForward.generateSteps(
      flashAttention2SequenceParallelForward.defaultInput,
    );
    expect(steps.length).toBeGreaterThanOrEqual(20);
    expect(steps[0].primarySnapshot.kind).toBe("matrix");
    expect(steps[steps.length - 1].primarySnapshot.kind).toBe("matrix");
  });

  it("should map every code line in trivia.lineExplanations", () => {
    const codeLines = flashAttention2SequenceParallelForward.code.trim().split("\n");
    const lineExplanations = flashAttention2SequenceParallelForward.trivia?.lineExplanations;
    expect(lineExplanations).toBeDefined();

    codeLines.forEach((_, index) => {
      const lineNum = index + 1;
      expect(lineExplanations?.[lineNum]).toBeDefined();
      expect(typeof lineExplanations?.[lineNum]).toBe("string");
      expect(lineExplanations?.[lineNum].length).toBeGreaterThan(0);
    });
  });
});
