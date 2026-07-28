import { describe, expect, it } from "vitest";
import {
  DEFAULT_ZERO_SHARDING_INPUT,
  DEEPSPEED_ZERO_SHARDING_CODE,
  ZERO_SHARDING_EXAMPLES,
  deepspeedZeroSharding,
  generateZeroShardingSteps,
} from "../deepspeedZeroSharding";

describe("deepspeedZeroSharding (Level 9 ML Infra)", () => {
  it("exports correct algorithm metadata", () => {
    expect(deepspeedZeroSharding.id).toBe("deepspeed-zero-sharding");
    expect(deepspeedZeroSharding.topicIds.some((topicId) => topicId.startsWith("ml_"))).toBe(true);
    expect(deepspeedZeroSharding.topicIds).toContain("ml_distributed_systems");
    expect(deepspeedZeroSharding.sources).toEqual([
      { type: "ml_infra", kind: "ml_infra", label: "ML Infra Level 9" },
    ]);
  });

  it("contains Python code string and default input", () => {
    expect(DEEPSPEED_ZERO_SHARDING_CODE).toContain("def deepspeed_zero_sharding");
    expect(deepspeedZeroSharding.code).toBe(DEEPSPEED_ZERO_SHARDING_CODE);
    expect(deepspeedZeroSharding.defaultInput).toEqual(DEFAULT_ZERO_SHARDING_INPUT);
  });

  it("generates steps for default input", () => {
    const steps = generateZeroShardingSteps(DEFAULT_ZERO_SHARDING_INPUT);
    expect(steps.length).toBeGreaterThan(0);
    for (let i = 0; i < steps.length; i++) {
      expect(steps[i].stepIndex).toBe(i);
      expect(typeof steps[i].codeLine).toBe("number");
      expect(steps[i].explanation.what).toBeTruthy();
      expect(steps[i].explanation.why).toBeTruthy();
      expect(steps[i].primarySnapshot.kind).toBe("matrix");
    }
  });

  it("handles basic, complex, and negative examples cleanly", () => {
    expect(ZERO_SHARDING_EXAMPLES).toHaveLength(3);
    for (const example of ZERO_SHARDING_EXAMPLES) {
      if (typeof example.input !== "string") {
        const steps = generateZeroShardingSteps(example.input);
        expect(steps.length).toBeGreaterThan(0);
      }
    }
  });
});
