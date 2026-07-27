import { describe, it, expect } from "vitest";
import {
  asyncPipelinedVjpEvaluation,
  DEFAULT_ASYNCPIPELINEDVJPEVALUATION_INPUT,
  generateAsyncPipelinedVjpEvaluationSteps,
} from "./asyncPipelinedVjpEvaluation";

describe("async-pipelined-vjp-evaluation (Async Pipelined Multi-GPU VJP Evaluator)", () => {
  it("should have correct metadata", () => {
    expect(asyncPipelinedVjpEvaluation.id).toBe("async-pipelined-vjp-evaluation");
    expect(asyncPipelinedVjpEvaluation.isMlInfra).toBe(true);
    expect(asyncPipelinedVjpEvaluation.mlInfraLevel).toBe(3);
    expect(asyncPipelinedVjpEvaluation.mlInfraCategory).toBe("ml_autograd_dags");
    expect(asyncPipelinedVjpEvaluation.categories).toContain("ml_autograd_dags");
  });

  it("should generate valid algorithm steps", () => {
    const steps = generateAsyncPipelinedVjpEvaluationSteps(
      DEFAULT_ASYNCPIPELINEDVJPEVALUATION_INPUT,
    );
    expect(steps.length).toBeGreaterThanOrEqual(20);
    expect(steps[0].explanation.what).toContain("Async Pipelined Multi-GPU VJP");
    expect(steps[steps.length - 1].explanation.what).toBe("Execution Complete");
  });

  it("should have complete lineExplanations for every code line", () => {
    const totalLines = asyncPipelinedVjpEvaluation.code.trim().split("\n").length;
    expect(asyncPipelinedVjpEvaluation.trivia).toBeDefined();
    expect(asyncPipelinedVjpEvaluation.trivia?.lineExplanations).toBeDefined();
    const lineExplanations = asyncPipelinedVjpEvaluation.trivia!.lineExplanations!;
    for (let line = 1; line <= totalLines; line++) {
      expect(lineExplanations[line]).toBeDefined();
      expect(lineExplanations[line].length).toBeGreaterThan(0);
    }
  });

  it("should have step codeLines pointing to valid lines in Python code", () => {
    const totalLines = asyncPipelinedVjpEvaluation.code.trim().split("\n").length;
    const steps = generateAsyncPipelinedVjpEvaluationSteps(
      DEFAULT_ASYNCPIPELINEDVJPEVALUATION_INPUT,
    );
    steps.forEach((step) => {
      expect(step.codeLine).toBeGreaterThanOrEqual(1);
      expect(step.codeLine).toBeLessThanOrEqual(totalLines);
    });
  });
});
