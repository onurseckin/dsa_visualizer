import { describe, it, expect } from "vitest";
import {
  hashBasedPrefixCacheTrieAllocator,
  DEFAULT_HASHBASEDPREFIXCACHETRIEALLOCATOR_INPUT,
  generateHashBasedPrefixCacheTrieAllocatorSteps,
} from "./hashBasedPrefixCacheTrieAllocator";

describe("hash-based-prefix-cache-trie-allocator (Hash-Based Prefix Caching Radix Trie Allocator)", () => {
  it("should have correct metadata and full trivia lineExplanations", () => {
    expect(hashBasedPrefixCacheTrieAllocator.id).toBe("hash-based-prefix-cache-trie-allocator");
    expect(
      hashBasedPrefixCacheTrieAllocator.topicIds.some((topicId) => topicId.startsWith("ml_")),
    ).toBe(true);
    expect(hashBasedPrefixCacheTrieAllocator.topicIds).toContain("ml_llm_serving");
    expect(hashBasedPrefixCacheTrieAllocator.topicIds).toContain("ml_llm_serving");
    expect(hashBasedPrefixCacheTrieAllocator.defaultInput).toEqual(
      DEFAULT_HASHBASEDPREFIXCACHETRIEALLOCATOR_INPUT,
    );

    const codeLines = hashBasedPrefixCacheTrieAllocator.code.trim().split("\n").length;
    const explanationKeys = Object.keys(
      hashBasedPrefixCacheTrieAllocator.trivia?.lineExplanations || {},
    ).map(Number);
    expect(explanationKeys.length).toBe(codeLines);
    for (let i = 1; i <= codeLines; i++) {
      expect(hashBasedPrefixCacheTrieAllocator.trivia?.lineExplanations?.[i]).toBeDefined();
    }
  });

  it("should generate valid algorithm steps and produce >= 20 steps", () => {
    const steps = generateHashBasedPrefixCacheTrieAllocatorSteps(
      DEFAULT_HASHBASEDPREFIXCACHETRIEALLOCATOR_INPUT,
    );
    expect(steps.length).toBeGreaterThanOrEqual(20);
    expect(steps[0].codeLine).toBe(3);
    expect(steps[steps.length - 1].codeLine).toBe(27);
  });
});
