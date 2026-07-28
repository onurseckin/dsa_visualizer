import { describe, expect, it } from "vitest";
import {
  DEFAULT_PAGED_ATTENTION_INPUT,
  PAGED_ATTENTION_BLOCK_TABLE_CODE,
  PAGED_ATTENTION_EXAMPLES,
  generatePagedAttentionSteps,
  pagedAttentionBlockTable,
} from "../pagedAttentionBlockTable";

describe("pagedAttentionBlockTable (Level 10 ML Infra)", () => {
  it("exports correct algorithm metadata", () => {
    expect(pagedAttentionBlockTable.id).toBe("paged-attention-block-table");
    expect(pagedAttentionBlockTable.topicIds.some((topicId) => topicId.startsWith("ml_"))).toBe(
      true,
    );
    expect(pagedAttentionBlockTable.topicIds).toContain("ml_llm_serving");
    expect(pagedAttentionBlockTable.sources).toEqual([
      { type: "ml_infra", kind: "ml_infra", label: "ML Infra Level 10" },
    ]);
  });

  it("contains Python code string and default input", () => {
    expect(PAGED_ATTENTION_BLOCK_TABLE_CODE).toContain("def paged_attention_block_table");
    expect(pagedAttentionBlockTable.code).toBe(PAGED_ATTENTION_BLOCK_TABLE_CODE);
    expect(pagedAttentionBlockTable.defaultInput).toEqual(DEFAULT_PAGED_ATTENTION_INPUT);
  });

  it("generates steps for default input", () => {
    const steps = generatePagedAttentionSteps(DEFAULT_PAGED_ATTENTION_INPUT);
    expect(steps.length).toBeGreaterThan(0);
    for (let i = 0; i < steps.length; i++) {
      expect(steps[i].stepIndex).toBe(i);
      expect(typeof steps[i].codeLine).toBe("number");
      expect(steps[i].explanation.what).toBeTruthy();
      expect(steps[i].explanation.why).toBeTruthy();
      expect(steps[i].primarySnapshot.kind).toBe("array");
    }
  });

  it("handles basic, complex, and negative examples cleanly", () => {
    expect(PAGED_ATTENTION_EXAMPLES).toHaveLength(3);
    for (const example of PAGED_ATTENTION_EXAMPLES) {
      if (typeof example.input !== "string") {
        const steps = generatePagedAttentionSteps(example.input);
        expect(steps.length).toBeGreaterThan(0);
      }
    }
  });
});
