import { describe, it, expect } from "vitest";
import { groupedQueryAttentionGqaEngine, DEFAULT_GROUPEDQUERYATTENTIONGQAENGINE_INPUT, generateGroupedQueryAttentionGqaEngineSteps } from "./groupedQueryAttentionGqaEngine";

describe("grouped-query-attention-gqa-engine (Grouped-Query Attention (GQA) Engine)", () => {
  it("should have correct metadata", () => {
    expect(groupedQueryAttentionGqaEngine.id).toBe("grouped-query-attention-gqa-engine");
    expect(groupedQueryAttentionGqaEngine.isMlInfra).toBe(true);
    expect(groupedQueryAttentionGqaEngine.mlInfraLevel).toBe(7);
    expect(groupedQueryAttentionGqaEngine.mlInfraCategory).toBe("ml_attention_geometry");
    expect(groupedQueryAttentionGqaEngine.categories).toContain("ml_attention_geometry");
  });

  it("should generate valid algorithm steps", () => {
    const steps = generateGroupedQueryAttentionGqaEngineSteps(DEFAULT_GROUPEDQUERYATTENTIONGQAENGINE_INPUT);
    expect(steps.length).toBeGreaterThan(0);
    expect(steps[0].explanation.what).toContain("Grouped-Query Attention (GQA) Engine");
    expect(steps[steps.length - 1].explanation.what).toBe("Execution Complete");
  });
});
