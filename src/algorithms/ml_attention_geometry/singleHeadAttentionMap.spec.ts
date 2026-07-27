import { describe, it, expect } from "vitest";
import { singleHeadAttentionMap, DEFAULT_SINGLEHEADATTENTIONMAP_INPUT, generateSingleHeadAttentionMapSteps } from "./singleHeadAttentionMap";

describe("single-head-attention-map (Single-Head Attention Map Generator)", () => {
  it("should have correct metadata", () => {
    expect(singleHeadAttentionMap.id).toBe("single-head-attention-map");
    expect(singleHeadAttentionMap.isMlInfra).toBe(true);
    expect(singleHeadAttentionMap.mlInfraLevel).toBe(7);
    expect(singleHeadAttentionMap.mlInfraCategory).toBe("ml_attention_geometry");
    expect(singleHeadAttentionMap.categories).toContain("ml_attention_geometry");
  });

  it("should generate valid algorithm steps", () => {
    const steps = generateSingleHeadAttentionMapSteps(DEFAULT_SINGLEHEADATTENTIONMAP_INPUT);
    expect(steps.length).toBeGreaterThan(0);
    expect(steps[0].explanation.what).toContain("Single-Head Attention Map Generator");
    expect(steps[steps.length - 1].explanation.what).toBe("Execution Complete");
  });
});
