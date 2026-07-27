import { describe, it, expect } from "vitest";
import {
  oneF1bPipelineParallelExecutionScheduler,
  DEFAULT_ONEF1BPIPELINEPARALLELEXECUTIONSCHEDULER_INPUT,
  generateOneF1bPipelineParallelExecutionSchedulerSteps,
} from "./oneF1bPipelineParallelExecutionScheduler";

describe("one-f1b-pipeline-parallel-execution-scheduler (1F1B (One Forward One Backward) Pipeline Parallel Scheduler)", () => {
  it("should have correct metadata", () => {
    expect(oneF1bPipelineParallelExecutionScheduler.id).toBe(
      "one-f1b-pipeline-parallel-execution-scheduler",
    );
    expect(oneF1bPipelineParallelExecutionScheduler.isMlInfra).toBe(true);
    expect(oneF1bPipelineParallelExecutionScheduler.mlInfraLevel).toBe(11);
    expect(oneF1bPipelineParallelExecutionScheduler.mlInfraCategory).toBe("ml_distributed_systems");
    expect(oneF1bPipelineParallelExecutionScheduler.categories).toContain("ml_distributed_systems");
  });

  it("should generate valid algorithm steps", () => {
    const steps = generateOneF1bPipelineParallelExecutionSchedulerSteps(
      DEFAULT_ONEF1BPIPELINEPARALLELEXECUTIONSCHEDULER_INPUT,
    );
    expect(steps.length).toBeGreaterThan(0);
    expect(steps[0].explanation.what).toContain(
      "1F1B (One Forward One Backward) Pipeline Parallel Scheduler",
    );
    expect(steps[steps.length - 1].explanation.what).toBe("Execution Complete");
  });
});
