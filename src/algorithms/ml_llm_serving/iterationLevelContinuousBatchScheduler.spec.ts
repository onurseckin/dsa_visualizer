import { describe, it, expect } from "vitest";
import {
  iterationLevelContinuousBatchScheduler,
  DEFAULT_ITERATIONLEVELCONTINUOUSBATCHSCHEDULER_INPUT,
  generateIterationLevelContinuousBatchSchedulerSteps,
} from "./iterationLevelContinuousBatchScheduler";

describe("iteration-level-continuous-batch-scheduler", () => {
  it("should have correct metadata and full trivia lineExplanations", () => {
    expect(iterationLevelContinuousBatchScheduler.id).toBe(
      "iteration-level-continuous-batch-scheduler",
    );
    expect(iterationLevelContinuousBatchScheduler.isMlInfra).toBe(true);
    expect(iterationLevelContinuousBatchScheduler.mlInfraLevel).toBe(12);
    expect(iterationLevelContinuousBatchScheduler.mlInfraCategory).toBe("ml_llm_serving");
    expect(iterationLevelContinuousBatchScheduler.categories).toContain("ml_llm_serving");
    expect(iterationLevelContinuousBatchScheduler.defaultInput).toEqual(
      DEFAULT_ITERATIONLEVELCONTINUOUSBATCHSCHEDULER_INPUT,
    );

    const codeLines = iterationLevelContinuousBatchScheduler.code.trim().split("\n").length;
    const explanationKeys = Object.keys(
      iterationLevelContinuousBatchScheduler.trivia?.lineExplanations || {},
    ).map(Number);
    expect(explanationKeys.length).toBe(codeLines);
    for (let i = 1; i <= codeLines; i++) {
      expect(iterationLevelContinuousBatchScheduler.trivia?.lineExplanations?.[i]).toBeDefined();
    }
  });

  it("should generate valid algorithm steps and produce >= 20 steps", () => {
    const steps = generateIterationLevelContinuousBatchSchedulerSteps(
      DEFAULT_ITERATIONLEVELCONTINUOUSBATCHSCHEDULER_INPUT,
    );
    expect(steps.length).toBeGreaterThanOrEqual(20);
    expect(steps[0].codeLine).toBe(1);
    expect(steps[steps.length - 1].codeLine).toBe(27);
  });
});
