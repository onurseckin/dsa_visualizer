import { describe, it, expect } from "vitest";
import { flashDecodingSplitKSequenceParallel, DEFAULT_FLASHDECODINGSPLITKSEQUENCEPARALLEL_INPUT, generateFlashDecodingSplitKSequenceParallelSteps } from "./flashDecodingSplitKSequenceParallel";

describe("flash-decoding-split-k-sequence-parallel (Flash-Decoding Split-K Sequence Parallel Attention)", () => {
  it("should have correct metadata", () => {
    expect(flashDecodingSplitKSequenceParallel.id).toBe("flash-decoding-split-k-sequence-parallel");
    expect(flashDecodingSplitKSequenceParallel.isMlInfra).toBe(true);
    expect(flashDecodingSplitKSequenceParallel.mlInfraLevel).toBe(7);
    expect(flashDecodingSplitKSequenceParallel.mlInfraCategory).toBe("ml_attention_geometry");
    expect(flashDecodingSplitKSequenceParallel.categories).toContain("ml_attention_geometry");
  });

  it("should generate valid algorithm steps", () => {
    const steps = generateFlashDecodingSplitKSequenceParallelSteps(DEFAULT_FLASHDECODINGSPLITKSEQUENCEPARALLEL_INPUT);
    expect(steps.length).toBeGreaterThan(0);
    expect(steps[0].explanation.what).toContain("Flash-Decoding Split-K Sequence Parallel Attention");
    expect(steps[steps.length - 1].explanation.what).toBe("Execution Complete");
  });
});
