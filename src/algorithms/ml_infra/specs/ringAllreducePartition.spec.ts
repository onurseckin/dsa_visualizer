import { describe, expect, it } from "vitest";
import {
  DEFAULT_RING_ALLREDUCE_INPUT,
  RING_ALLREDUCE_EXAMPLES,
  RING_ALLREDUCE_PARTITION_CODE,
  generateRingAllreduceSteps,
  ringAllreducePartition,
} from "../ringAllreducePartition";

describe("ringAllreducePartition (Level 9 ML Infra)", () => {
  it("exports correct algorithm metadata", () => {
    expect(ringAllreducePartition.id).toBe("ring-allreduce-partition");
    expect(ringAllreducePartition.isMlInfra).toBe(true);
    expect(ringAllreducePartition.mlInfraLevel).toBe(9);
    expect(ringAllreducePartition.category).toBe("ml_distributed_systems");
    expect(ringAllreducePartition.sources).toEqual([
      { type: "ml_infra", kind: "ml_infra", label: "ML Infra Level 9" },
    ]);
  });

  it("contains Python code string and default input", () => {
    expect(RING_ALLREDUCE_PARTITION_CODE).toContain("def ring_allreduce");
    expect(ringAllreducePartition.code).toBe(RING_ALLREDUCE_PARTITION_CODE);
    expect(ringAllreducePartition.defaultInput).toEqual(DEFAULT_RING_ALLREDUCE_INPUT);
  });

  it("generates steps for default input", () => {
    const steps = generateRingAllreduceSteps(DEFAULT_RING_ALLREDUCE_INPUT);
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
    expect(RING_ALLREDUCE_EXAMPLES).toHaveLength(3);
    for (const example of RING_ALLREDUCE_EXAMPLES) {
      if (typeof example.input !== "string") {
        const steps = generateRingAllreduceSteps(example.input);
        expect(steps.length).toBeGreaterThan(0);
      }
    }
  });
});
