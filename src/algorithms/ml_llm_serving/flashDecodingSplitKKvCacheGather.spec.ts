import { describe, it, expect } from "vitest";
import { flashDecodingSplitKKvCacheGather, DEFAULT_FLASHDECODINGSPLITKKVCACHEGATHER_INPUT, generateFlashDecodingSplitKKvCacheGatherSteps } from "./flashDecodingSplitKKvCacheGather";

describe("flash-decoding-split-k-kv-cache-gather (FlashDecoding Split-K KV Cache Gather Engine)", () => {
  it("should have correct metadata", () => {
    expect(flashDecodingSplitKKvCacheGather.id).toBe("flash-decoding-split-k-kv-cache-gather");
    expect(flashDecodingSplitKKvCacheGather.isMlInfra).toBe(true);
    expect(flashDecodingSplitKKvCacheGather.mlInfraLevel).toBe(12);
    expect(flashDecodingSplitKKvCacheGather.mlInfraCategory).toBe("ml_llm_serving");
    expect(flashDecodingSplitKKvCacheGather.categories).toContain("ml_llm_serving");
  });

  it("should generate valid algorithm steps", () => {
    const steps = generateFlashDecodingSplitKKvCacheGatherSteps(DEFAULT_FLASHDECODINGSPLITKKVCACHEGATHER_INPUT);
    expect(steps.length).toBeGreaterThan(0);
    expect(steps[0].explanation.what).toContain("FlashDecoding Split-K KV Cache Gather Engine");
    expect(steps[steps.length - 1].explanation.what).toBe("Execution Complete");
  });
});
