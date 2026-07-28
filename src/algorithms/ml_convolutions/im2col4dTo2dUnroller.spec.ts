import { describe, it, expect } from "vitest";
import {
  im2col4dTo2dUnroller,
  DEFAULT_IM2COL4DTO2DUNROLLER_INPUT,
  generateIm2col4dTo2dUnrollerSteps,
} from "./im2col4dTo2dUnroller";

describe("im2col-4d-to-2d-unroller", () => {
  it("should have correct metadata", () => {
    expect(im2col4dTo2dUnroller.id).toBe("im2col-4d-to-2d-unroller");
    expect(im2col4dTo2dUnroller.topicIds.some((topicId) => topicId.startsWith("ml_"))).toBe(true);
    expect(im2col4dTo2dUnroller.topicIds).toContain("ml_convolutions");
    expect(im2col4dTo2dUnroller.topicIds).toContain("ml_convolutions");
    expect(im2col4dTo2dUnroller.topicIds).toContain("ml_gemm_roofline");
  });

  it("should generate at least 20 algorithm steps for default input", () => {
    const steps = generateIm2col4dTo2dUnrollerSteps(DEFAULT_IM2COL4DTO2DUNROLLER_INPUT);
    expect(steps.length).toBeGreaterThanOrEqual(20);
    expect(steps[0].explanation.what).toContain("im2col 4D-to-2D Matrix Unroller");
    expect(steps[steps.length - 1].explanation.what).toBe("Execution Complete");
  });

  it("should map every code line in trivia.lineExplanations", () => {
    const codeLines = im2col4dTo2dUnroller.code.split("\n");
    const lineExplanations = im2col4dTo2dUnroller.trivia?.lineExplanations;
    expect(lineExplanations).toBeDefined();

    codeLines.forEach((_, index) => {
      const lineNum = index + 1;
      expect(lineExplanations?.[lineNum]).toBeDefined();
      expect(typeof lineExplanations?.[lineNum]).toBe("string");
      expect(lineExplanations?.[lineNum].length).toBeGreaterThan(0);
    });
  });

  it("should teach the topic through a topicGuide with Markdown and LaTeX", () => {
    const guide = im2col4dTo2dUnroller.topicGuide;
    expect(guide.overview.length).toBeGreaterThan(100);
    expect(guide.sections.length).toBeGreaterThanOrEqual(4);
    expect(guide.sections.length).toBeLessThanOrEqual(6);

    guide.sections.forEach((section) => {
      expect(section.heading.length).toBeGreaterThan(0);
      expect(section.body.length).toBeGreaterThan(50);
    });

    const allText = [guide.overview, ...guide.sections.map((s) => s.body)].join(" ");
    expect(allText).toContain("$");
    expect(allText.toLowerCase()).toContain("im2col");

    expect(guide.keyTerms?.length).toBeGreaterThanOrEqual(3);
    expect(guide.keyTerms?.length).toBeLessThanOrEqual(6);
  });
});
