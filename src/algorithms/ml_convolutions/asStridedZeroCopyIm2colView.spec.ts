import { describe, it, expect } from "vitest";
import {
  asStridedZeroCopyIm2colView,
  DEFAULT_ASSTRIDEDZEROCOPYIM2COLVIEW_INPUT,
  generateAsStridedZeroCopyIm2colViewSteps,
} from "./asStridedZeroCopyIm2colView";

describe("asStridedZeroCopyIm2colView (Zero-Copy `as_strided` im2col View Engine)", () => {
  it("should have correct metadata", () => {
    expect(asStridedZeroCopyIm2colView.id).toBe("as-strided-zero-copy-im2col-view");
    expect(asStridedZeroCopyIm2colView.topicIds.some((topicId) => topicId.startsWith("ml_"))).toBe(
      true,
    );
    expect(asStridedZeroCopyIm2colView.topicIds).toContain("ml_convolutions");
    expect(asStridedZeroCopyIm2colView.topicIds).toContain("ml_convolutions");
  });

  it("should generate at least 20 algorithm steps for default input", () => {
    const steps = generateAsStridedZeroCopyIm2colViewSteps(
      DEFAULT_ASSTRIDEDZEROCOPYIM2COLVIEW_INPUT,
    );
    expect(steps.length).toBeGreaterThanOrEqual(20);
    expect(steps[0].explanation.what).toContain("Zero-Copy `as_strided` im2col View Engine");
    expect(steps[steps.length - 1].explanation.what).toBe("Execution Complete");
  });

  it("should map every code line in trivia.lineExplanations", () => {
    const codeLines = asStridedZeroCopyIm2colView.code.split("\n");
    const lineExplanations = asStridedZeroCopyIm2colView.trivia?.lineExplanations;
    expect(lineExplanations).toBeDefined();

    codeLines.forEach((_, index) => {
      const lineNum = index + 1;
      expect(lineExplanations?.[lineNum]).toBeDefined();
      expect(typeof lineExplanations?.[lineNum]).toBe("string");
      expect(lineExplanations?.[lineNum].length).toBeGreaterThan(0);
    });
  });

  it("should teach the topic through a topicGuide with Markdown and LaTeX", () => {
    const guide = asStridedZeroCopyIm2colView.topicGuide;
    expect(guide.overview.length).toBeGreaterThan(120);
    expect(guide.sections.length).toBeGreaterThanOrEqual(4);
    expect(guide.sections.length).toBeLessThanOrEqual(6);

    guide.sections.forEach((section) => {
      expect(section.heading.length).toBeGreaterThan(0);
      expect(section.body.length).toBeGreaterThan(50);
    });

    const allText = [guide.overview, ...guide.sections.map((s) => s.body)].join(" ");
    expect(allText).toContain("$");
    expect(allText.toLowerCase()).toContain("stride");

    expect(guide.keyTerms?.length).toBeGreaterThanOrEqual(3);
    expect(guide.keyTerms?.length).toBeLessThanOrEqual(6);
  });
});
