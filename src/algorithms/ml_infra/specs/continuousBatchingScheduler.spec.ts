import { describe, expect, it } from "vitest";
import {
  CONTINUOUS_BATCHING_EXAMPLES,
  CONTINUOUS_BATCHING_SCHEDULER_CODE,
  DEFAULT_CONTINUOUS_BATCHING_INPUT,
  continuousBatchingScheduler,
  generateContinuousBatchingSteps,
} from "../continuousBatchingScheduler";

describe("continuousBatchingScheduler (Level 10 ML Infra)", () => {
  it("exports correct algorithm metadata", () => {
    expect(continuousBatchingScheduler.id).toBe("continuous-batching-scheduler");
    expect(continuousBatchingScheduler.isMlInfra).toBe(true);
    expect(continuousBatchingScheduler.mlInfraLevel).toBe(10);
    expect(continuousBatchingScheduler.category).toBe("ml_llm_serving");
    expect(continuousBatchingScheduler.sources).toEqual([
      { type: "ml_infra", kind: "ml_infra", label: "ML Infra Level 10" },
    ]);
  });

  it("contains Python code string and default input", () => {
    expect(CONTINUOUS_BATCHING_SCHEDULER_CODE).toContain("def continuous_batching_scheduler");
    expect(continuousBatchingScheduler.code).toBe(CONTINUOUS_BATCHING_SCHEDULER_CODE);
    expect(continuousBatchingScheduler.defaultInput).toEqual(DEFAULT_CONTINUOUS_BATCHING_INPUT);
  });

  it("generates steps for default input", () => {
    const steps = generateContinuousBatchingSteps(DEFAULT_CONTINUOUS_BATCHING_INPUT);
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
    expect(CONTINUOUS_BATCHING_EXAMPLES).toHaveLength(3);
    for (const example of CONTINUOUS_BATCHING_EXAMPLES) {
      if (typeof example.input !== "string") {
        const steps = generateContinuousBatchingSteps(example.input);
        expect(steps.length).toBeGreaterThan(0);
      }
    }
  });
});
