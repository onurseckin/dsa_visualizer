import { describe, it, expect } from "vitest";
import {
  singleHeadAttentionMap,
  DEFAULT_SINGLEHEADATTENTIONMAP_INPUT,
  generateSingleHeadAttentionMapSteps,
  SINGLEHEADATTENTIONMAP_CODE,
} from "./singleHeadAttentionMap";

describe("single-head-attention-map (Single-Head Attention Map Generator)", () => {
  it("should have correct metadata", () => {
    expect(singleHeadAttentionMap.id).toBe("single-head-attention-map");
    expect(singleHeadAttentionMap.isMlInfra).toBe(true);
    expect(singleHeadAttentionMap.mlInfraLevel).toBe(7);
    expect(singleHeadAttentionMap.mlInfraCategory).toBe("ml_attention_geometry");
    expect(singleHeadAttentionMap.categories).toContain("ml_attention_geometry");
  });

  it("should generate at least 20 algorithm steps with matrix visual snapshots", () => {
    const steps = generateSingleHeadAttentionMapSteps(DEFAULT_SINGLEHEADATTENTIONMAP_INPUT);
    expect(steps.length).toBeGreaterThanOrEqual(20);
    expect(steps[0].explanation.what).toContain(
      "Initialize Single-Head Attention Map Generator",
    );
    expect(steps[steps.length - 1].explanation.what).toBe("Execution Complete");

    steps.forEach((step) => {
      expect(step.primarySnapshot.kind).toBe("matrix");
    });
  });

  it("should map every code line in trivia.lineExplanations", () => {
    const codeLines = SINGLEHEADATTENTIONMAP_CODE.trim().split("\n");
    const lineExplanations = singleHeadAttentionMap.trivia?.lineExplanations || {};

    for (let i = 1; i <= codeLines.length; i++) {
      expect(lineExplanations[i]).toBeDefined();
      expect(lineExplanations[i].length).toBeGreaterThan(0);
    }
  });
});
