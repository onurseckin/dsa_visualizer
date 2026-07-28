import { describe, it, expect } from "vitest";
import {
  oneF1bPipelineParallelExecutionScheduler,
  ONEF1BPIPELINEPARALLELEXECUTIONSCHEDULER_CODE,
  DEFAULT_ONEF1BPIPELINEPARALLELEXECUTIONSCHEDULER_INPUT,
  generateOneF1bPipelineParallelExecutionSchedulerSteps,
} from "./oneF1bPipelineParallelExecutionScheduler";

describe("one-f1b-pipeline-parallel-execution-scheduler (1F1B Pipeline Parallel Scheduler)", () => {
  it("should have correct metadata", () => {
    expect(oneF1bPipelineParallelExecutionScheduler.id).toBe(
      "one-f1b-pipeline-parallel-execution-scheduler",
    );
    expect(
      oneF1bPipelineParallelExecutionScheduler.topicIds.some((topicId) =>
        topicId.startsWith("ml_"),
      ),
    ).toBe(true);
    expect(oneF1bPipelineParallelExecutionScheduler.topicIds).toContain("ml_distributed_systems");
    expect(oneF1bPipelineParallelExecutionScheduler.topicIds).toContain("ml_distributed_systems");
  });

  it("should generate >= 20 algorithm steps", () => {
    const steps = generateOneF1bPipelineParallelExecutionSchedulerSteps(
      DEFAULT_ONEF1BPIPELINEPARALLELEXECUTIONSCHEDULER_INPUT,
    );
    expect(steps.length).toBeGreaterThanOrEqual(20);
    expect(steps[0].explanation.what).toContain(
      "Enter one_f1b_pipeline_parallel_execution_scheduler",
    );
    expect(steps[steps.length - 1].explanation.what).toBe("Return Ordered 1F1B Execution Schedule");
  });

  it("should have lineExplanations mapping every code line", () => {
    const codeLines = ONEF1BPIPELINEPARALLELEXECUTIONSCHEDULER_CODE.trimEnd().split("\n").length;
    const explanations = oneF1bPipelineParallelExecutionScheduler.trivia?.lineExplanations || {};
    expect(Object.keys(explanations).length).toBe(codeLines);
    for (let i = 1; i <= codeLines; i++) {
      expect(explanations[i]).toBeDefined();
    }
  });
});
