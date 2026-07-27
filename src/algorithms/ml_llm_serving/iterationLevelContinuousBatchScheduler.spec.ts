import { describe, it, expect } from "vitest";
import {
  iterationLevelContinuousBatchScheduler,
  DEFAULT_ITERATIONLEVELCONTINUOUSBATCHSCHEDULER_INPUT,
  generateIterationLevelContinuousBatchSchedulerSteps,
} from "./iterationLevelContinuousBatchScheduler";

describe("iteration-level-continuous-batch-scheduler", () => {
  it("should have correct metadata", () => {
    expect(iterationLevelContinuousBatchScheduler.id).toBe(
      "iteration-level-continuous-batch-scheduler",
    );
    expect(iterationLevelContinuousBatchScheduler.isMlInfra).toBe(true);
    expect(iterationLevelContinuousBatchScheduler.mlInfraLevel).toBe(12);
    expect(iterationLevelContinuousBatchScheduler.mlInfraCategory).toBe("ml_llm_serving");
    expect(iterationLevelContinuousBatchScheduler.categories).toContain("ml_llm_serving");
  });

  it("should generate valid algorithm steps", () => {
    const steps = generateIterationLevelContinuousBatchSchedulerSteps(
      DEFAULT_ITERATIONLEVELCONTINUOUSBATCHSCHEDULER_INPUT,
    );
    expect(steps.length).toBeGreaterThan(0);
    expect(steps[0].explanation.what).toContain("Initialize Continuous Batching");
    expect(steps[steps.length - 1].explanation.what).toBe("Batching Complete");
  });
});
