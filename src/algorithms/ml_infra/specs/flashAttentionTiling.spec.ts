import { describe, expect, it } from "vitest";
import {
  DEFAULT_FLASH_ATTENTION_INPUT,
  FLASH_ATTENTION_EXAMPLES,
  FLASH_ATTENTION_TILING_CODE,
  flashAttentionTiling,
  generateFlashAttentionSteps,
} from "../flashAttentionTiling";

describe("flashAttentionTiling (Level 7 ML Infra)", () => {
  it("exports correct algorithm metadata", () => {
    expect(flashAttentionTiling.id).toBe("flash-attention-tiling");
    expect(flashAttentionTiling.isMlInfra).toBe(true);
    expect(flashAttentionTiling.mlInfraLevel).toBe(7);
    expect(flashAttentionTiling.category).toBe("ml_attention_geometry");
    expect(flashAttentionTiling.sources).toEqual([
      { type: "ml_infra", kind: "ml_infra", label: "ML Infra Level 7" },
    ]);
  });

  it("contains Python code string and default input", () => {
    expect(FLASH_ATTENTION_TILING_CODE).toContain("def flash_attention_tiling");
    expect(flashAttentionTiling.code).toBe(FLASH_ATTENTION_TILING_CODE);
    expect(flashAttentionTiling.defaultInput).toEqual(DEFAULT_FLASH_ATTENTION_INPUT);
  });

  it("generates steps for default input", () => {
    const steps = generateFlashAttentionSteps(DEFAULT_FLASH_ATTENTION_INPUT);
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
    expect(FLASH_ATTENTION_EXAMPLES).toHaveLength(3);
    for (const example of FLASH_ATTENTION_EXAMPLES) {
      if (typeof example.input !== "string") {
        const steps = generateFlashAttentionSteps(example.input);
        expect(steps.length).toBeGreaterThan(0);
      }
    }
  });
});
