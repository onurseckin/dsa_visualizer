import { describe, it, expect } from "vitest";
import { hashBasedPrefixCacheTrieAllocator, DEFAULT_HASHBASEDPREFIXCACHETRIEALLOCATOR_INPUT, generateHashBasedPrefixCacheTrieAllocatorSteps } from "./hashBasedPrefixCacheTrieAllocator";

describe("hash-based-prefix-cache-trie-allocator (Hash-Based Prefix Caching Radix Trie Allocator)", () => {
  it("should have correct metadata", () => {
    expect(hashBasedPrefixCacheTrieAllocator.id).toBe("hash-based-prefix-cache-trie-allocator");
    expect(hashBasedPrefixCacheTrieAllocator.isMlInfra).toBe(true);
    expect(hashBasedPrefixCacheTrieAllocator.mlInfraLevel).toBe(12);
    expect(hashBasedPrefixCacheTrieAllocator.mlInfraCategory).toBe("ml_llm_serving");
    expect(hashBasedPrefixCacheTrieAllocator.categories).toContain("ml_llm_serving");
  });

  it("should generate valid algorithm steps", () => {
    const steps = generateHashBasedPrefixCacheTrieAllocatorSteps(DEFAULT_HASHBASEDPREFIXCACHETRIEALLOCATOR_INPUT);
    expect(steps.length).toBeGreaterThan(0);
    expect(steps[0].explanation.what).toContain("Hash-Based Prefix Caching Radix Trie Allocator");
    expect(steps[steps.length - 1].explanation.what).toBe("Execution Complete");
  });
});
