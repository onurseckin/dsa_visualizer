import { describe, it, expect } from "vitest";
import {
  multiHeadAttentionSplitConcat,
  DEFAULT_MULTIHEADATTENTIONSPLITCONCAT_INPUT,
  generateMultiHeadAttentionSplitConcatSteps,
  MULTIHEADATTENTIONSPLITCONCAT_CODE,
} from "./multiHeadAttentionSplitConcat";

describe("multi-head-attention-split-concat (Multi-Head Attention Head Split & Concat)", () => {
  it("should have correct metadata", () => {
    expect(multiHeadAttentionSplitConcat.id).toBe("multi-head-attention-split-concat");
    expect(multiHeadAttentionSplitConcat.isMlInfra).toBe(true);
    expect(multiHeadAttentionSplitConcat.mlInfraLevel).toBe(7);
    expect(multiHeadAttentionSplitConcat.mlInfraCategory).toBe("ml_attention_geometry");
    expect(multiHeadAttentionSplitConcat.categories).toContain("ml_attention_geometry");
  });

  it("should generate at least 20 algorithm steps with matrix visual snapshots", () => {
    const steps = generateMultiHeadAttentionSplitConcatSteps(
      DEFAULT_MULTIHEADATTENTIONSPLITCONCAT_INPUT,
    );
    expect(steps.length).toBeGreaterThanOrEqual(20);
    expect(steps[0].explanation.what).toContain(
      "Initialize Multi-Head Attention Head Split & Concat",
    );
    expect(steps[steps.length - 1].explanation.what).toBe("Execution Complete");

    steps.forEach((step) => {
      expect(step.primarySnapshot.kind).toBe("matrix");
    });
  });

  it("should map every code line in trivia.lineExplanations", () => {
    const codeLines = MULTIHEADATTENTIONSPLITCONCAT_CODE.trim().split("\n");
    const lineExplanations = multiHeadAttentionSplitConcat.trivia?.lineExplanations || {};

    for (let i = 1; i <= codeLines.length; i++) {
      expect(lineExplanations[i]).toBeDefined();
      expect(lineExplanations[i].length).toBeGreaterThan(0);
    }
  });
});
