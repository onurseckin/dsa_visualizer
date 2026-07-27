import { describe, it, expect } from "vitest";
import {
  slidingWindowPrefixAttentionEngine,
  DEFAULT_SLIDINGWINDOWPREFIXATTENTIONENGINE_INPUT,
  generateSlidingWindowPrefixAttentionEngineSteps,
} from "./slidingWindowPrefixAttentionEngine";

describe("sliding-window-prefix-attention-engine (Sliding Window Prefix Attention Engine)", () => {
  it("should have correct metadata", () => {
    expect(slidingWindowPrefixAttentionEngine.id).toBe("sliding-window-prefix-attention-engine");
    expect(slidingWindowPrefixAttentionEngine.isMlInfra).toBe(true);
    expect(slidingWindowPrefixAttentionEngine.mlInfraLevel).toBe(7);
    expect(slidingWindowPrefixAttentionEngine.mlInfraCategory).toBe("ml_attention_geometry");
    expect(slidingWindowPrefixAttentionEngine.categories).toContain("ml_attention_geometry");
  });

  it("should generate valid algorithm steps", () => {
    const steps = generateSlidingWindowPrefixAttentionEngineSteps(
      DEFAULT_SLIDINGWINDOWPREFIXATTENTIONENGINE_INPUT,
    );
    expect(steps.length).toBeGreaterThan(0);
    expect(steps[0].explanation.what).toContain("Sliding Window Prefix Attention Engine");
    expect(steps[steps.length - 1].explanation.what).toBe("Execution Complete");
  });
});
