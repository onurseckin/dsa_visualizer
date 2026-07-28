import { describe, expect, it } from "vitest";
import {
  DEFAULT_SUCCESSOR_INPUT,
  generateSuccessorPathsSteps,
  successorPaths,
} from "../successorPaths";

describe("Successor Paths Logic Spec", () => {
  it("has valid metadata and default input", () => {
    expect(successorPaths.id).toBe("successor-paths");
    expect(successorPaths.topicIds).toContain("graph_directed_and_scc");
    expect(successorPaths.defaultInput).toEqual(DEFAULT_SUCCESSOR_INPUT);
  });

  it("generates steps using 'graph' snapshot kind", () => {
    const steps = generateSuccessorPathsSteps(DEFAULT_SUCCESSOR_INPUT);
    expect(steps.length).toBeGreaterThan(0);

    for (const step of steps) {
      expect(step.primarySnapshot.kind).toBe("graph");
      expect(step.explanation.what).toBeTruthy();
      expect(step.explanation.why).toBeTruthy();
      expect(step.codeLine).toBeGreaterThan(0);
    }
  });

  it("correctly identifies cycle start and cycle length for default input", () => {
    const steps = generateSuccessorPathsSteps(DEFAULT_SUCCESSOR_INPUT);
    const lastStep = steps[steps.length - 1];

    expect(lastStep.variables.cycleStart).toBe(2);
    expect(lastStep.variables.cycleLength).toBe(3);
    expect(lastStep.variables.kSucc).toBe(2);
  });

  it("handles pure cycle input correctly", () => {
    const input = {
      succ: [1, 2, 3, 0],
      startNode: 0,
      stepsQuery: 10,
    };
    const steps = generateSuccessorPathsSteps(input);
    const lastStep = steps[steps.length - 1];

    expect(lastStep.variables.cycleStart).toBe(0);
    expect(lastStep.variables.cycleLength).toBe(4);
    expect(lastStep.variables.kSucc).toBe(2);
  });

  it("handles self-loop input correctly", () => {
    const input = {
      succ: [0, 0, 1],
      startNode: 2,
      stepsQuery: 3,
    };
    const steps = generateSuccessorPathsSteps(input);
    const lastStep = steps[steps.length - 1];

    expect(lastStep.variables.cycleStart).toBe(0);
    expect(lastStep.variables.cycleLength).toBe(1);
    expect(lastStep.variables.kSucc).toBe(0);
  });
});
