import { describe, it, expect } from "vitest";
import { treeNodePredictionTraverser } from "./treeNodePredictionTraverser";

describe("tree-node-prediction-traverser", () => {
  it("should have valid metadata", () => {
    expect(treeNodePredictionTraverser.id).toBeDefined();
    expect(treeNodePredictionTraverser.title).toBeDefined();
    expect(treeNodePredictionTraverser.code).toBeDefined();
    expect(treeNodePredictionTraverser.examples?.length).toBeGreaterThan(0);
  });

  it("should have clean comment-free Python code", () => {
    const code = treeNodePredictionTraverser.code;
    expect(code).not.toContain("#");
    expect(code).not.toContain('"""');
    expect(code).not.toContain("'''");
  });

  it("should generate valid steps with tree visual snapshots", () => {
    const steps = treeNodePredictionTraverser.generateSteps(
      treeNodePredictionTraverser.defaultInput,
    );
    expect(steps.length).toBeGreaterThan(0);
    expect(steps[0].primarySnapshot.kind).toBe("tree");
    expect(steps[steps.length - 1].primarySnapshot.kind).toBe("tree");

    const codeLines = treeNodePredictionTraverser.code.split("\n").length;
    for (const step of steps) {
      expect(step.codeLine).toBeGreaterThanOrEqual(1);
      expect(step.codeLine).toBeLessThanOrEqual(codeLines);
      expect(step.explanation.what).toBeTruthy();
      expect(step.explanation.why).toBeTruthy();
    }
  });
});
