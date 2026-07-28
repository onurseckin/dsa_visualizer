import { describe, it, expect } from "vitest";
import {
  conv2dSlidingWindowDirect,
  DEFAULT_CONV2DSLIDINGWINDOWDIRECT_INPUT,
  generateConv2dSlidingWindowDirectSteps,
} from "./conv2dSlidingWindowDirect";

describe("conv2dSlidingWindowDirect (2D Direct Sliding Window Convolution)", () => {
  it("should have correct metadata", () => {
    expect(conv2dSlidingWindowDirect.id).toBe("conv2d-sliding-window-direct");
    expect(conv2dSlidingWindowDirect.topicIds.some((topicId) => topicId.startsWith("ml_"))).toBe(
      true,
    );
    expect(conv2dSlidingWindowDirect.topicIds).toContain("ml_convolutions");
    expect(conv2dSlidingWindowDirect.topicIds).toContain("ml_convolutions");
  });

  it("should generate at least 20 algorithm steps for default input", () => {
    const steps = generateConv2dSlidingWindowDirectSteps(DEFAULT_CONV2DSLIDINGWINDOWDIRECT_INPUT);
    expect(steps.length).toBeGreaterThanOrEqual(20);
    expect(steps[0].explanation.what).toContain("Initialize dimensions");
    expect(steps[steps.length - 1].explanation.what).toBe("Convolution Complete");
  });

  it("should map every code line in trivia.lineExplanations", () => {
    const codeLines = conv2dSlidingWindowDirect.code.split("\n");
    const lineExplanations = conv2dSlidingWindowDirect.trivia?.lineExplanations;
    expect(lineExplanations).toBeDefined();

    codeLines.forEach((_, index) => {
      const lineNum = index + 1;
      expect(lineExplanations?.[lineNum]).toBeDefined();
      expect(typeof lineExplanations?.[lineNum]).toBe("string");
      expect(lineExplanations?.[lineNum].length).toBeGreaterThan(0);
    });
  });

  it("should teach the topic through a topicGuide with Markdown and LaTeX", () => {
    const guide = conv2dSlidingWindowDirect.topicGuide;
    expect(guide.overview.length).toBeGreaterThan(120);
    expect(guide.sections.length).toBeGreaterThanOrEqual(4);
    expect(guide.sections.length).toBeLessThanOrEqual(6);

    guide.sections.forEach((section) => {
      expect(section.heading.length).toBeGreaterThan(0);
      expect(section.body.length).toBeGreaterThan(50);
    });

    const allText = [guide.overview, ...guide.sections.map((s) => s.body)].join(" ");
    expect(allText).toContain("$");
    expect(allText.toLowerCase()).toContain("convolution");

    expect(guide.keyTerms?.length).toBeGreaterThanOrEqual(3);
    expect(guide.keyTerms?.length).toBeLessThanOrEqual(6);
  });
});
