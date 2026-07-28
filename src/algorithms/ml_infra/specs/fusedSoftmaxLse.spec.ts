import { describe, expect, it } from "vitest";
import {
  DEFAULT_FUSED_SOFTMAX_LSE_INPUT,
  fusedSoftmaxLse,
  generateFusedSoftmaxLseSteps,
} from "../fusedSoftmaxLse";
import type { ArrayVisualSnapshot } from "../../../types/dsa";

describe("fusedSoftmaxLse algorithm spec", () => {
  it("should have correct ML Infra Level 3 metadata", () => {
    expect(fusedSoftmaxLse.id).toBe("fused-softmax-lse");
    expect(fusedSoftmaxLse.topicIds.some((topicId) => topicId.startsWith("ml_"))).toBe(true);
    expect(fusedSoftmaxLse.topicIds).toContain("ml_precision_quantization");
    expect(fusedSoftmaxLse.defaultInput).toEqual(DEFAULT_FUSED_SOFTMAX_LSE_INPUT);
    expect(fusedSoftmaxLse.sources).toEqual([
      { type: "ml_infra", kind: "ml_infra", label: "ML Infra Level 3" },
    ]);
  });

  it("should generate steps and compute stable probabilities for default logits", () => {
    const steps = generateFusedSoftmaxLseSteps(DEFAULT_FUSED_SOFTMAX_LSE_INPUT);
    expect(steps.length).toBeGreaterThan(0);

    const lastStep = steps[steps.length - 1];
    expect(lastStep.codeLine).toBe(12);

    const snap = lastStep.primarySnapshot as ArrayVisualSnapshot;
    expect(snap.kind).toBe("array");
    expect(snap.elements.length).toBe(4);

    expect(Number(lastStep.variables.lse)).toBeCloseTo(3.4436, 3);
  });

  it("should compute exact probabilities without overflow for extreme logits > 1000", () => {
    const extremeInput = { logits: [1000.0, 1002.0, 999.0] };
    const steps = generateFusedSoftmaxLseSteps(extremeInput);
    const lastStep = steps[steps.length - 1];

    expect(lastStep.codeLine).toBe(12);
    expect(lastStep.explanation.what).toContain("probabilities");
  });

  it("should handle empty logits gracefully", () => {
    const emptyInput = { logits: [] };
    const steps = generateFusedSoftmaxLseSteps(emptyInput);
    const lastStep = steps[steps.length - 1];
    expect(lastStep.codeLine).toBe(5);
    expect(lastStep.variables.lse).toBe(0.0);
  });
});

describe("fusedSoftmaxLse trivia metadata", () => {
  const meta = fusedSoftmaxLse.trivia;
  const lines = fusedSoftmaxLse.code.replace(/\s+$/, "").split("\n");

  it("points skipLines and hints at valid lines", () => {
    expect(meta).toBeDefined();
    const skipped = meta?.skipLines ?? [];
    const hinted = (meta?.hints ?? []).map((entry) => entry.line);
    expect(hinted.length).toBeGreaterThanOrEqual(2);
    [...skipped, ...hinted].forEach((line) => {
      expect(line).toBeGreaterThanOrEqual(1);
      expect(line).toBeLessThanOrEqual(lines.length);
    });
  });

  it("never offers a distractor that is actually a correct line", () => {
    const real = new Set(lines.map((line) => line.trim()));
    const distractors = meta?.distractors ?? [];
    expect(distractors.length).toBeGreaterThanOrEqual(3);
    distractors.forEach((distractor) => {
      expect(real.has(distractor.trim())).toBe(false);
    });
  });
});
