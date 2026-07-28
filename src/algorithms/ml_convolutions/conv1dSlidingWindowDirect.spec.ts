import { describe, it, expect } from "vitest";
import {
  conv1dSlidingWindowDirect,
  DEFAULT_CONV1DSLIDINGWINDOWDIRECT_INPUT,
  generateConv1dSlidingWindowDirectSteps,
} from "./conv1dSlidingWindowDirect";

describe("conv1dSlidingWindowDirect (1D Cross-Correlation Basics)", () => {
  it("should have correct metadata", () => {
    expect(conv1dSlidingWindowDirect.id).toBe("conv1d-sliding-window-direct");
    expect(conv1dSlidingWindowDirect.topicIds.some((topicId) => topicId.startsWith("ml_"))).toBe(
      true,
    );
    expect(conv1dSlidingWindowDirect.topicIds).toContain("ml_convolutions");
    expect(conv1dSlidingWindowDirect.topicIds).toContain("ml_convolutions");
  });

  it("should generate at least 20 algorithm steps for default input", () => {
    const steps = generateConv1dSlidingWindowDirectSteps(DEFAULT_CONV1DSLIDINGWINDOWDIRECT_INPUT);
    expect(steps.length).toBeGreaterThanOrEqual(20);
    expect(steps[0].explanation.what).toContain("1D Cross-Correlation Basics");
    expect(steps[steps.length - 1].explanation.what).toBe("Execution Complete");
  });

  it("should map every code line in trivia.lineExplanations", () => {
    const codeLines = conv1dSlidingWindowDirect.code.split("\n");
    const lineExplanations = conv1dSlidingWindowDirect.trivia?.lineExplanations;
    expect(lineExplanations).toBeDefined();

    codeLines.forEach((_, index) => {
      const lineNum = index + 1;
      expect(lineExplanations?.[lineNum]).toBeDefined();
      expect(typeof lineExplanations?.[lineNum]).toBe("string");
      expect(lineExplanations?.[lineNum].length).toBeGreaterThan(0);
    });
  });

  it("should teach the topic through a topicGuide with Markdown and LaTeX", () => {
    const guide = conv1dSlidingWindowDirect.topicGuide;
    expect(guide.overview.length).toBeGreaterThan(120);
    expect(guide.sections.length).toBeGreaterThanOrEqual(4);
    expect(guide.sections.length).toBeLessThanOrEqual(6);

    guide.sections.forEach((section) => {
      expect(section.heading.length).toBeGreaterThan(0);
      expect(section.body.length).toBeGreaterThan(50);
    });

    const allText = [guide.overview, ...guide.sections.map((s) => s.body)].join(" ");
    expect(allText).toContain("$");
    expect(allText.toLowerCase()).toContain("cross-correlation");

    expect(guide.keyTerms?.length).toBeGreaterThanOrEqual(3);
    expect(guide.keyTerms?.length).toBeLessThanOrEqual(6);
  });
});
