import { describe, it, expect } from "vitest";
import { treeNodePredictionTraverser } from "./treeNodePredictionTraverser";

describe("treeNodePredictionTraverser", () => {
  it("should have valid metadata", () => {
    expect(treeNodePredictionTraverser.id).toBeDefined();
    expect(treeNodePredictionTraverser.title).toBeDefined();
    expect(treeNodePredictionTraverser.code).toBeDefined();
    expect(treeNodePredictionTraverser.examples?.length).toBeGreaterThan(0);
  });

  it("should generate valid steps", () => {
    const steps = treeNodePredictionTraverser.generateSteps(
      treeNodePredictionTraverser.defaultInput,
    );
    expect(steps.length).toBeGreaterThan(0);
    expect(steps[0].primarySnapshot.kind).toBeDefined();
    expect(steps[steps.length - 1].primarySnapshot.kind).toBeDefined();
  });
});
