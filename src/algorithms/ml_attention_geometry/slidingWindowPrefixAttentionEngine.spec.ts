import { describe, it, expect } from "vitest";
import {
  slidingWindowPrefixAttentionEngine,
  DEFAULT_SLIDINGWINDOWPREFIXATTENTIONENGINE_INPUT,
  generateSlidingWindowPrefixAttentionEngineSteps,
  SLIDINGWINDOWPREFIXATTENTIONENGINE_CODE,
} from "./slidingWindowPrefixAttentionEngine";

describe("sliding-window-prefix-attention-engine (Sliding Window Prefix Attention Engine)", () => {
  it("should have correct metadata", () => {
    expect(slidingWindowPrefixAttentionEngine.id).toBe("sliding-window-prefix-attention-engine");
    expect(
      slidingWindowPrefixAttentionEngine.topicIds.some((topicId) => topicId.startsWith("ml_")),
    ).toBe(true);
    expect(slidingWindowPrefixAttentionEngine.topicIds).toContain("ml_attention_geometry");
    expect(slidingWindowPrefixAttentionEngine.topicIds).toContain("ml_attention_geometry");
  });

  it("should generate at least 20 algorithm steps", () => {
    const steps = generateSlidingWindowPrefixAttentionEngineSteps(
      DEFAULT_SLIDINGWINDOWPREFIXATTENTIONENGINE_INPUT,
    );
    expect(steps.length).toBeGreaterThanOrEqual(20);
    expect(steps[0].stepIndex).toBe(0);
    expect(slidingWindowPrefixAttentionEngine.trivia?.lineExplanations).toBeDefined();
  });

  it("should map every code line in trivia.lineExplanations", () => {
    const codeLines = SLIDINGWINDOWPREFIXATTENTIONENGINE_CODE.trim().split("\n");
    const lineExplanations = slidingWindowPrefixAttentionEngine.trivia?.lineExplanations || {};

    for (let i = 1; i <= codeLines.length; i++) {
      expect(lineExplanations[i]).toBeDefined();
      expect(lineExplanations[i].length).toBeGreaterThan(0);
    }
  });
});
