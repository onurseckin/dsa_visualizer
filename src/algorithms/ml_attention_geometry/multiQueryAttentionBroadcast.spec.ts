import { describe, it, expect } from "vitest";
import { multiQueryAttentionBroadcast, DEFAULT_MULTIQUERYATTENTIONBROADCAST_INPUT, generateMultiQueryAttentionBroadcastSteps } from "./multiQueryAttentionBroadcast";

describe("multi-query-attention-broadcast (Multi-Query Attention (MQA) Broadcaster)", () => {
  it("should have correct metadata", () => {
    expect(multiQueryAttentionBroadcast.id).toBe("multi-query-attention-broadcast");
    expect(multiQueryAttentionBroadcast.isMlInfra).toBe(true);
    expect(multiQueryAttentionBroadcast.mlInfraLevel).toBe(7);
    expect(multiQueryAttentionBroadcast.mlInfraCategory).toBe("ml_attention_geometry");
    expect(multiQueryAttentionBroadcast.categories).toContain("ml_attention_geometry");
  });

  it("should generate valid algorithm steps", () => {
    const steps = generateMultiQueryAttentionBroadcastSteps(DEFAULT_MULTIQUERYATTENTIONBROADCAST_INPUT);
    expect(steps.length).toBeGreaterThan(0);
    expect(steps[0].explanation.what).toContain("Multi-Query Attention (MQA) Broadcaster");
    expect(steps[steps.length - 1].explanation.what).toBe("Execution Complete");
  });
});
