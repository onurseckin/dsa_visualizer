import { describe, it, expect } from "vitest";
import {
  multiQueryAttentionBroadcast,
  DEFAULT_MULTIQUERYATTENTIONBROADCAST_INPUT,
  generateMultiQueryAttentionBroadcastSteps,
  MULTIQUERYATTENTIONBROADCAST_CODE,
} from "./multiQueryAttentionBroadcast";

describe("multi-query-attention-broadcast (Multi-Query Attention (MQA) Broadcaster)", () => {
  it("should have correct metadata", () => {
    expect(multiQueryAttentionBroadcast.id).toBe("multi-query-attention-broadcast");
    expect(multiQueryAttentionBroadcast.isMlInfra).toBe(true);
    expect(multiQueryAttentionBroadcast.mlInfraLevel).toBe(7);
    expect(multiQueryAttentionBroadcast.mlInfraCategory).toBe("ml_attention_geometry");
    expect(multiQueryAttentionBroadcast.categories).toContain("ml_attention_geometry");
  });

  it("should generate at least 20 algorithm steps with matrix visual snapshots", () => {
    const steps = generateMultiQueryAttentionBroadcastSteps(
      DEFAULT_MULTIQUERYATTENTIONBROADCAST_INPUT,
    );
    expect(steps.length).toBeGreaterThanOrEqual(20);
    expect(steps[0].explanation.what).toContain(
      "Initialize Multi-Query Attention (MQA) Broadcaster",
    );
    expect(steps[steps.length - 1].explanation.what).toBe("Execution Complete");

    steps.forEach((step) => {
      expect(step.primarySnapshot.kind).toBe("matrix");
    });
  });

  it("should map every code line in trivia.lineExplanations", () => {
    const codeLines = MULTIQUERYATTENTIONBROADCAST_CODE.trim().split("\n");
    const lineExplanations = multiQueryAttentionBroadcast.trivia?.lineExplanations || {};

    for (let i = 1; i <= codeLines.length; i++) {
      expect(lineExplanations[i]).toBeDefined();
      expect(lineExplanations[i].length).toBeGreaterThan(0);
    }
  });
});
