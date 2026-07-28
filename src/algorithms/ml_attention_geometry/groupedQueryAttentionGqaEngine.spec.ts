import { describe, it, expect } from "vitest";
import {
  groupedQueryAttentionGqaEngine,
  DEFAULT_GROUPEDQUERYATTENTIONGQAENGINE_INPUT,
  generateGroupedQueryAttentionGqaEngineSteps,
  GROUPEDQUERYATTENTIONGQAENGINE_CODE,
} from "./groupedQueryAttentionGqaEngine";

describe("grouped-query-attention-gqa-engine (Grouped-Query Attention (GQA) Engine)", () => {
  it("should have correct metadata", () => {
    expect(groupedQueryAttentionGqaEngine.id).toBe("grouped-query-attention-gqa-engine");
    expect(
      groupedQueryAttentionGqaEngine.topicIds.some((topicId) => topicId.startsWith("ml_")),
    ).toBe(true);
    expect(groupedQueryAttentionGqaEngine.topicIds).toContain("ml_attention_geometry");
    expect(groupedQueryAttentionGqaEngine.topicIds).toContain("ml_attention_geometry");
  });

  it("should generate at least 20 algorithm steps with matrix visual snapshots", () => {
    const steps = generateGroupedQueryAttentionGqaEngineSteps(
      DEFAULT_GROUPEDQUERYATTENTIONGQAENGINE_INPUT,
    );
    expect(steps.length).toBeGreaterThanOrEqual(20);
    expect(steps[0].explanation.what).toContain("Initialize Grouped-Query Attention (GQA) Engine");
    expect(steps[steps.length - 1].explanation.what).toBe("Execution Complete");

    steps.forEach((step) => {
      expect(step.primarySnapshot.kind).toBe("matrix");
    });
  });

  it("should map every code line in trivia.lineExplanations", () => {
    const codeLines = GROUPEDQUERYATTENTIONGQAENGINE_CODE.trim().split("\n");
    const lineExplanations = groupedQueryAttentionGqaEngine.trivia?.lineExplanations || {};

    for (let i = 1; i <= codeLines.length; i++) {
      expect(lineExplanations[i]).toBeDefined();
      expect(lineExplanations[i].length).toBeGreaterThan(0);
    }
  });
});
