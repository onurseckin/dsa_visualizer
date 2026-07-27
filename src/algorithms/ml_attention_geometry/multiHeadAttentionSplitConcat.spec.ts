import { describe, it, expect } from "vitest";
import {
  multiHeadAttentionSplitConcat,
  DEFAULT_MULTIHEADATTENTIONSPLITCONCAT_INPUT,
  generateMultiHeadAttentionSplitConcatSteps,
} from "./multiHeadAttentionSplitConcat";

describe("multi-head-attention-split-concat (Multi-Head Attention Head Split & Concat)", () => {
  it("should have correct metadata", () => {
    expect(multiHeadAttentionSplitConcat.id).toBe("multi-head-attention-split-concat");
    expect(multiHeadAttentionSplitConcat.isMlInfra).toBe(true);
    expect(multiHeadAttentionSplitConcat.mlInfraLevel).toBe(7);
    expect(multiHeadAttentionSplitConcat.mlInfraCategory).toBe("ml_attention_geometry");
    expect(multiHeadAttentionSplitConcat.categories).toContain("ml_attention_geometry");
  });

  it("should generate valid algorithm steps", () => {
    const steps = generateMultiHeadAttentionSplitConcatSteps(
      DEFAULT_MULTIHEADATTENTIONSPLITCONCAT_INPUT,
    );
    expect(steps.length).toBeGreaterThan(0);
    expect(steps[0].explanation.what).toContain("Multi-Head Attention Head Split & Concat");
    expect(steps[steps.length - 1].explanation.what).toBe("Execution Complete");
  });
});
