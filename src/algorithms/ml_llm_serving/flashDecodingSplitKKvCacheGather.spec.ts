import { describe, it, expect } from "vitest";
import {
  flashDecodingSplitKKvCacheGather,
  DEFAULT_FLASHDECODINGSPLITKKVCACHEGATHER_INPUT,
  generateFlashDecodingSplitKKvCacheGatherSteps,
} from "./flashDecodingSplitKKvCacheGather";

describe("flash-decoding-split-k-kv-cache-gather (FlashDecoding Split-K KV Cache Gather Engine)", () => {
  it("should have correct metadata and full trivia lineExplanations", () => {
    expect(flashDecodingSplitKKvCacheGather.id).toBe("flash-decoding-split-k-kv-cache-gather");
    expect(flashDecodingSplitKKvCacheGather.isMlInfra).toBe(true);
    expect(flashDecodingSplitKKvCacheGather.mlInfraLevel).toBe(12);
    expect(flashDecodingSplitKKvCacheGather.mlInfraCategory).toBe("ml_llm_serving");
    expect(flashDecodingSplitKKvCacheGather.categories).toContain("ml_llm_serving");
    expect(flashDecodingSplitKKvCacheGather.defaultInput).toEqual(
      DEFAULT_FLASHDECODINGSPLITKKVCACHEGATHER_INPUT,
    );

    const codeLines = flashDecodingSplitKKvCacheGather.code.trim().split("\n").length;
    const explanationKeys = Object.keys(
      flashDecodingSplitKKvCacheGather.trivia?.lineExplanations || {},
    ).map(Number);
    expect(explanationKeys.length).toBe(codeLines);
    for (let i = 1; i <= codeLines; i++) {
      expect(flashDecodingSplitKKvCacheGather.trivia?.lineExplanations?.[i]).toBeDefined();
    }
  });

  it("should generate valid algorithm steps and produce >= 20 steps", () => {
    const steps = generateFlashDecodingSplitKKvCacheGatherSteps(
      DEFAULT_FLASHDECODINGSPLITKKVCACHEGATHER_INPUT,
    );
    expect(steps.length).toBeGreaterThanOrEqual(20);
    expect(steps[0].codeLine).toBe(1);
    expect(steps[steps.length - 1].codeLine).toBe(32);
  });
});
