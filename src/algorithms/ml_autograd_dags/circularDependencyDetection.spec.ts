import { describe, it, expect } from "vitest";
import {
  circularDependencyDetection,
  DEFAULT_CIRCULARDEPENDENCYDETECTION_INPUT,
  generateCircularDependencyDetectionSteps,
} from "./circularDependencyDetection";

describe("circular-dependency-detection (Circular Dependency Detection in Graph)", () => {
  it("should have correct metadata", () => {
    expect(circularDependencyDetection.id).toBe("circular-dependency-detection");
    expect(circularDependencyDetection.topicIds.some((topicId) => topicId.startsWith("ml_"))).toBe(
      true,
    );
    expect(circularDependencyDetection.topicIds).toContain("ml_autograd_dags");
    expect(circularDependencyDetection.topicIds).toContain("ml_autograd_dags");
  });

  it("should generate valid algorithm steps with graph snapshot kind", () => {
    const steps = generateCircularDependencyDetectionSteps(
      DEFAULT_CIRCULARDEPENDENCYDETECTION_INPUT,
    );
    expect(steps.length).toBeGreaterThanOrEqual(15);
    expect(steps[0].explanation.what).toContain("3-Color DFS");
    expect(steps[0].primarySnapshot.kind).toBe("graph");
    expect(steps[steps.length - 1].explanation.what).toContain("Execution Complete");
  });

  it("should detect cycles correctly in a graph with a cycle", () => {
    const steps = generateCircularDependencyDetectionSteps({
      numNodes: 3,
      edges: [
        [0, 1],
        [1, 2],
        [2, 0],
      ],
    });
    const lastStep = steps[steps.length - 1];
    expect(lastStep.variables.hasCycle).toBe(true);
    const hasBackEdgeStep = steps.some((step) =>
      step.explanation.what.includes("BACK EDGE DETECTED"),
    );
    expect(hasBackEdgeStep).toBe(true);
  });

  it("should have complete lineExplanations for every code line", () => {
    const totalLines = circularDependencyDetection.code.trim().split("\n").length;
    expect(circularDependencyDetection.trivia).toBeDefined();
    expect(circularDependencyDetection.trivia?.lineExplanations).toBeDefined();
    const lineExplanations = circularDependencyDetection.trivia!.lineExplanations!;
    for (let line = 1; line <= totalLines; line++) {
      expect(lineExplanations[line]).toBeDefined();
      expect(lineExplanations[line].length).toBeGreaterThan(0);
    }
  });

  it("should have step codeLines pointing to valid lines in Python code", () => {
    const totalLines = circularDependencyDetection.code.trim().split("\n").length;
    const steps = generateCircularDependencyDetectionSteps(
      DEFAULT_CIRCULARDEPENDENCYDETECTION_INPUT,
    );
    steps.forEach((step) => {
      expect(step.codeLine).toBeGreaterThanOrEqual(1);
      expect(step.codeLine).toBeLessThanOrEqual(totalLines);
    });
  });
});
