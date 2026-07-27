import { describe, expect, it } from "vitest";
import {
  DEFAULT_GQA_INPUT,
  GQA_EXAMPLES,
  GROUPED_QUERY_ATTENTION_CODE,
  generateGqaSteps,
  groupedQueryAttention,
} from "../groupedQueryAttention";

describe("groupedQueryAttention (Level 7 ML Infra)", () => {
  it("exports correct algorithm metadata", () => {
    expect(groupedQueryAttention.id).toBe("grouped-query-attention");
    expect(groupedQueryAttention.isMlInfra).toBe(true);
    expect(groupedQueryAttention.mlInfraLevel).toBe(7);
    expect(groupedQueryAttention.category).toBe("ml_attention_geometry");
    expect(groupedQueryAttention.sources).toEqual([
      { type: "ml_infra", kind: "ml_infra", label: "ML Infra Level 7" },
    ]);
  });

  it("contains Python code string and default input", () => {
    expect(GROUPED_QUERY_ATTENTION_CODE).toContain("def grouped_query_attention");
    expect(groupedQueryAttention.code).toBe(GROUPED_QUERY_ATTENTION_CODE);
    expect(groupedQueryAttention.defaultInput).toEqual(DEFAULT_GQA_INPUT);
  });

  it("generates steps for default input", () => {
    const steps = generateGqaSteps(DEFAULT_GQA_INPUT);
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
    expect(GQA_EXAMPLES).toHaveLength(3);
    for (const example of GQA_EXAMPLES) {
      if (typeof example.input !== "string") {
        const steps = generateGqaSteps(example.input);
        expect(steps.length).toBeGreaterThan(0);
      }
    }
  });
});
