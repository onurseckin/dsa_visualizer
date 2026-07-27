import { describe, it, expect } from "vitest";
import { pagedAttentionBlockTableAllocator, DEFAULT_PAGEDATTENTIONBLOCKTABLEALLOCATOR_INPUT, generatePagedAttentionBlockTableAllocatorSteps } from "./pagedAttentionBlockTableAllocator";

describe("paged-attention-block-table-allocator (vLLM-Style PagedAttention Block Table Allocator)", () => {
  it("should have correct metadata", () => {
    expect(pagedAttentionBlockTableAllocator.id).toBe("paged-attention-block-table-allocator");
    expect(pagedAttentionBlockTableAllocator.isMlInfra).toBe(true);
    expect(pagedAttentionBlockTableAllocator.mlInfraLevel).toBe(12);
    expect(pagedAttentionBlockTableAllocator.mlInfraCategory).toBe("ml_llm_serving");
    expect(pagedAttentionBlockTableAllocator.categories).toContain("ml_llm_serving");
  });

  it("should generate valid algorithm steps", () => {
    const steps = generatePagedAttentionBlockTableAllocatorSteps(DEFAULT_PAGEDATTENTIONBLOCKTABLEALLOCATOR_INPUT);
    expect(steps.length).toBeGreaterThan(0);
    expect(steps[0].explanation.what).toContain("vLLM-Style PagedAttention Block Table Allocator");
    expect(steps[steps.length - 1].explanation.what).toBe("Execution Complete");
  });
});
