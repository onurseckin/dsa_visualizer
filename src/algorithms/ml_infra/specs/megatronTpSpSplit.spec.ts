import { describe, expect, it } from "vitest";
import {
  DEFAULT_MEGATRON_TP_SP_INPUT,
  MEGATRON_TP_SP_EXAMPLES,
  MEGATRON_TP_SP_SPLIT_CODE,
  generateMegatronTpSpSteps,
  megatronTpSpSplit,
} from "../megatronTpSpSplit";

describe("megatronTpSpSplit (Level 9 ML Infra)", () => {
  it("exports correct algorithm metadata", () => {
    expect(megatronTpSpSplit.id).toBe("megatron-tp-sp-split");
    expect(megatronTpSpSplit.topicIds.some((topicId) => topicId.startsWith("ml_"))).toBe(true);
    expect(megatronTpSpSplit.topicIds).toContain("ml_distributed_systems");
    expect(megatronTpSpSplit.sources).toEqual([
      { type: "ml_infra", kind: "ml_infra", label: "ML Infra Level 9" },
    ]);
  });

  it("contains Python code string and default input", () => {
    expect(MEGATRON_TP_SP_SPLIT_CODE).toContain("def megatron_tp_sp_split");
    expect(megatronTpSpSplit.code).toBe(MEGATRON_TP_SP_SPLIT_CODE);
    expect(megatronTpSpSplit.defaultInput).toEqual(DEFAULT_MEGATRON_TP_SP_INPUT);
  });

  it("generates steps for default input", () => {
    const steps = generateMegatronTpSpSteps(DEFAULT_MEGATRON_TP_SP_INPUT);
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
    expect(MEGATRON_TP_SP_EXAMPLES).toHaveLength(3);
    for (const example of MEGATRON_TP_SP_EXAMPLES) {
      if (typeof example.input !== "string") {
        const steps = generateMegatronTpSpSteps(example.input);
        expect(steps.length).toBeGreaterThan(0);
      }
    }
  });
});
