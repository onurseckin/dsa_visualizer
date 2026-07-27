import { describe, it, expect } from "vitest";
import {
  flashDecodingSplitKSequenceParallel,
  DEFAULT_FLASHDECODINGSPLITKSEQUENCEPARALLEL_INPUT,
  generateFlashDecodingSplitKSequenceParallelSteps,
  FLASHDECODINGSPLITKSEQUENCEPARALLEL_CODE,
} from "./flashDecodingSplitKSequenceParallel";

describe("flash-decoding-split-k-sequence-parallel (Flash-Decoding Split-K Sequence Parallel Attention)", () => {
  it("should have correct metadata", () => {
    expect(flashDecodingSplitKSequenceParallel.id).toBe("flash-decoding-split-k-sequence-parallel");
    expect(flashDecodingSplitKSequenceParallel.isMlInfra).toBe(true);
    expect(flashDecodingSplitKSequenceParallel.mlInfraLevel).toBe(7);
    expect(flashDecodingSplitKSequenceParallel.mlInfraCategory).toBe("ml_attention_geometry");
    expect(flashDecodingSplitKSequenceParallel.categories).toContain("ml_attention_geometry");
  });

  it("should generate at least 20 algorithm steps with matrix visual snapshots", () => {
    const steps = generateFlashDecodingSplitKSequenceParallelSteps(
      DEFAULT_FLASHDECODINGSPLITKSEQUENCEPARALLEL_INPUT,
    );
    expect(steps.length).toBeGreaterThanOrEqual(20);
    expect(steps[0].explanation.what).toContain(
      "Initialize Flash-Decoding Split-K Parallel Engine",
    );
    expect(steps[steps.length - 1].explanation.what).toBe("Execution Complete");

    steps.forEach((step) => {
      expect(step.primarySnapshot.kind).toBe("matrix");
    });
  });

  it("should map every code line in trivia.lineExplanations", () => {
    const codeLines = FLASHDECODINGSPLITKSEQUENCEPARALLEL_CODE.trim().split("\n");
    const lineExplanations = flashDecodingSplitKSequenceParallel.trivia?.lineExplanations || {};

    for (let i = 1; i <= codeLines.length; i++) {
      expect(lineExplanations[i]).toBeDefined();
      expect(lineExplanations[i].length).toBeGreaterThan(0);
    }
  });
});
