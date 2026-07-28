import { describe, it, expect } from "vitest";
import { greedyDecisionTreeBuilder } from "./greedyDecisionTreeBuilder";

describe("greedy-decision-tree-builder", () => {
  it("should have valid metadata", () => {
    expect(greedyDecisionTreeBuilder.id).toBeDefined();
    expect(greedyDecisionTreeBuilder.title).toBeDefined();
    expect(greedyDecisionTreeBuilder.code).toBeDefined();
    expect(greedyDecisionTreeBuilder.examples?.length).toBeGreaterThan(0);
    expect(greedyDecisionTreeBuilder.description.length).toBeGreaterThan(200);
    expect(greedyDecisionTreeBuilder.topicGuide.sections.length).toBeGreaterThanOrEqual(4);
  });

  it("should generate at least 20 steps", () => {
    const steps = greedyDecisionTreeBuilder.generateSteps(greedyDecisionTreeBuilder.defaultInput);
    expect(steps.length).toBeGreaterThanOrEqual(20);
    expect(steps[0].primarySnapshot.kind).toBeDefined();
    expect(steps[steps.length - 1].primarySnapshot.kind).toBeDefined();
  });

  it("should map every line of code in trivia.lineExplanations", () => {
    const lineExplanations = greedyDecisionTreeBuilder.trivia?.lineExplanations;
    expect(lineExplanations).toBeDefined();
    const codeLines = greedyDecisionTreeBuilder.code.trim().split("\n");
    for (let i = 1; i <= codeLines.length; i++) {
      expect(lineExplanations?.[i]).toBeDefined();
      expect(lineExplanations?.[i]?.length).toBeGreaterThan(0);
    }
  });
});
