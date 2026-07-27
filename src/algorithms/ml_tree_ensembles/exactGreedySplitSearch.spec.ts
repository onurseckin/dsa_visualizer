import { describe, it, expect } from "vitest";
import { exactGreedySplitSearch } from "./exactGreedySplitSearch";

describe("exactGreedySplitSearch", () => {
  it("should have valid metadata", () => {
    expect(exactGreedySplitSearch.id).toBeDefined();
    expect(exactGreedySplitSearch.title).toBeDefined();
    expect(exactGreedySplitSearch.code).toBeDefined();
    expect(exactGreedySplitSearch.examples?.length).toBeGreaterThan(0);
    expect(exactGreedySplitSearch.description.length).toBeGreaterThan(200);
    expect(exactGreedySplitSearch.topicGuide.sections.length).toBeGreaterThanOrEqual(4);
  });

  it("should generate at least 20 steps", () => {
    const steps = exactGreedySplitSearch.generateSteps(exactGreedySplitSearch.defaultInput);
    expect(steps.length).toBeGreaterThanOrEqual(20);
    expect(steps[0].primarySnapshot.kind).toBeDefined();
    expect(steps[steps.length - 1].primarySnapshot.kind).toBeDefined();
  });

  it("should map every line of code in trivia.lineExplanations", () => {
    const lineExplanations = exactGreedySplitSearch.trivia?.lineExplanations;
    expect(lineExplanations).toBeDefined();
    const codeLines = exactGreedySplitSearch.code.trim().split("\n");
    for (let i = 1; i <= codeLines.length; i++) {
      expect(lineExplanations?.[i]).toBeDefined();
      expect(lineExplanations?.[i]?.length).toBeGreaterThan(0);
    }
  });
});
