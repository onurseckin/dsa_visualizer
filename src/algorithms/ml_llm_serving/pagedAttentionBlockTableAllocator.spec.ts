import { describe, it, expect } from "vitest";
import {
  pagedAttentionBlockTableAllocator,
  DEFAULT_PAGEDATTENTIONBLOCKTABLEALLOCATOR_INPUT,
  generatePagedAttentionBlockTableAllocatorSteps,
} from "./pagedAttentionBlockTableAllocator";

describe("paged-attention-block-table-allocator", () => {
  it("should have correct metadata and full trivia lineExplanations", () => {
    expect(pagedAttentionBlockTableAllocator.id).toBe("paged-attention-block-table-allocator");
    expect(
      pagedAttentionBlockTableAllocator.topicIds.some((topicId) => topicId.startsWith("ml_")),
    ).toBe(true);
    expect(pagedAttentionBlockTableAllocator.topicIds).toContain("ml_llm_serving");
    expect(pagedAttentionBlockTableAllocator.topicIds).toContain("ml_llm_serving");
    expect(pagedAttentionBlockTableAllocator.defaultInput).toEqual(
      DEFAULT_PAGEDATTENTIONBLOCKTABLEALLOCATOR_INPUT,
    );

    const codeLines = pagedAttentionBlockTableAllocator.code.trim().split("\n").length;
    const explanationKeys = Object.keys(
      pagedAttentionBlockTableAllocator.trivia?.lineExplanations || {},
    ).map(Number);
    expect(explanationKeys.length).toBe(codeLines);
    for (let i = 1; i <= codeLines; i++) {
      expect(pagedAttentionBlockTableAllocator.trivia?.lineExplanations?.[i]).toBeDefined();
    }
  });

  it("should generate >= 20 algorithm steps with matrix snapshots", () => {
    const steps = generatePagedAttentionBlockTableAllocatorSteps(
      DEFAULT_PAGEDATTENTIONBLOCKTABLEALLOCATOR_INPUT,
    );
    expect(steps.length).toBeGreaterThanOrEqual(20);
    expect(steps[0].explanation.what).toContain("Initialize PagedAttention Allocator");
    expect(steps[steps.length - 1].explanation.what).toContain("Complete");
  });
});
