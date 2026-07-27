import { describe, expect, it } from "vitest";
import {
  scaledDotAttentionMask,
  DEFAULT_SCALED_DOT_ATTENTION_INPUT,
  generateScaledDotAttentionMaskSteps,
} from "../scaledDotAttentionMask";
import type { ArrayVisualSnapshot } from "../../../types/dsa";

describe("scaledDotAttentionMask algorithm spec", () => {
  it("should have correct ML Infra Level 7 metadata", () => {
    expect(scaledDotAttentionMask.id).toBe("scaled-dot-attention-mask");
    expect(scaledDotAttentionMask.isMlInfra).toBe(true);
    expect(scaledDotAttentionMask.mlInfraLevel).toBe(7);
    expect(scaledDotAttentionMask.category).toBe("ml_attention_geometry");
    expect(scaledDotAttentionMask.defaultInput).toEqual(DEFAULT_SCALED_DOT_ATTENTION_INPUT);
    expect(scaledDotAttentionMask.sources).toEqual([
      { type: "ml_infra", kind: "ml_infra", label: "ML Infra Level 7" },
    ]);
  });

  it("should compute scaled dot-product attention with causal mask", () => {
    const steps = generateScaledDotAttentionMaskSteps(DEFAULT_SCALED_DOT_ATTENTION_INPUT);
    expect(steps.length).toBeGreaterThan(0);

    const lastStep = steps[steps.length - 1];
    expect(lastStep.codeLine).toBe(31);

    const distTable = lastStep.auxiliaryState.distanceTable;
    expect(distTable).toBeDefined();
    expect(distTable?.["O_q0_d0"]).toBe(10.0);
    expect(distTable?.["O_q0_d1"]).toBe(0.0);

    const snap = lastStep.primarySnapshot as ArrayVisualSnapshot;
    expect(snap.kind).toBe("array");
    expect(snap.elements.length).toBe(6);
  });

  it("should support unmasked bidirectional attention when maskType is 'none'", () => {
    const inputUnmasked = {
      ...DEFAULT_SCALED_DOT_ATTENTION_INPUT,
      maskType: "none" as const,
    };
    const steps = generateScaledDotAttentionMaskSteps(inputUnmasked);
    const maskStep = steps[1];
    const distTable = maskStep.auxiliaryState.distanceTable;
    expect(distTable?.["Masked_S_q0_k1"]).not.toBe(-999);
  });
});

describe("scaledDotAttentionMask trivia metadata", () => {
  const meta = scaledDotAttentionMask.trivia;
  const lines = scaledDotAttentionMask.code.replace(/\s+$/, "").split("\n");

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
