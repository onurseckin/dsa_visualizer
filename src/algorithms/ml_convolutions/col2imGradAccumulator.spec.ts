import { describe, it, expect } from "vitest";
import {
  col2imGradAccumulator,
  DEFAULT_COL2IMGRADACCUMULATOR_INPUT,
  generateCol2imGradAccumulatorSteps,
} from "./col2imGradAccumulator";

describe("col2imGradAccumulator (col2im Gradient Accumulator)", () => {
  it("should have correct metadata", () => {
    expect(col2imGradAccumulator.id).toBe("col2im-grad-accumulator");
    expect(col2imGradAccumulator.topicIds.some((topicId) => topicId.startsWith("ml_"))).toBe(true);
    expect(col2imGradAccumulator.topicIds).toContain("ml_convolutions");
    expect(col2imGradAccumulator.topicIds).toContain("ml_convolutions");
  });

  it("should generate at least 20 algorithm steps for default input", () => {
    const steps = generateCol2imGradAccumulatorSteps(DEFAULT_COL2IMGRADACCUMULATOR_INPUT);
    expect(steps.length).toBeGreaterThanOrEqual(20);
    expect(steps[0].explanation.what).toContain("col2im Gradient Accumulator");
    expect(steps[steps.length - 1].explanation.what).toBe("Execution Complete");
  });

  it("should map every code line in trivia.lineExplanations", () => {
    const codeLines = col2imGradAccumulator.code.split("\n");
    const lineExplanations = col2imGradAccumulator.trivia?.lineExplanations;
    expect(lineExplanations).toBeDefined();

    codeLines.forEach((_, index) => {
      const lineNum = index + 1;
      expect(lineExplanations?.[lineNum]).toBeDefined();
      expect(typeof lineExplanations?.[lineNum]).toBe("string");
      expect(lineExplanations?.[lineNum].length).toBeGreaterThan(0);
    });
  });

  it("should teach the topic through a topicGuide with Markdown and LaTeX", () => {
    const guide = col2imGradAccumulator.topicGuide;
    expect(guide.overview.length).toBeGreaterThan(120);
    expect(guide.sections.length).toBeGreaterThanOrEqual(4);
    expect(guide.sections.length).toBeLessThanOrEqual(6);

    guide.sections.forEach((section) => {
      expect(section.heading.length).toBeGreaterThan(0);
      expect(section.body.length).toBeGreaterThan(50);
    });

    const allText = [guide.overview, ...guide.sections.map((s) => s.body)].join(" ");
    expect(allText).toContain("$");
    expect(allText.toLowerCase()).toContain("gradient");

    expect(guide.keyTerms?.length).toBeGreaterThanOrEqual(3);
    expect(guide.keyTerms?.length).toBeLessThanOrEqual(6);
  });
});
