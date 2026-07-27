import { describe, it, expect } from "vitest";
import {
  conv2dPaddingStrideOutputShape,
  DEFAULT_CONV2DPADDINGSTRIDEOUTPUTSHAPE_INPUT,
  generateConv2dPaddingStrideOutputShapeSteps,
} from "./conv2dPaddingStrideOutputShape";

describe("conv2dPaddingStrideOutputShape (2D Conv Output Shape Calculator)", () => {
  it("should have correct metadata", () => {
    expect(conv2dPaddingStrideOutputShape.id).toBe("conv2dPaddingStrideOutputShape");
    expect(conv2dPaddingStrideOutputShape.isMlInfra).toBe(true);
    expect(conv2dPaddingStrideOutputShape.mlInfraLevel).toBe(8);
    expect(conv2dPaddingStrideOutputShape.mlInfraCategory).toBe("ml_convolutions");
    expect(conv2dPaddingStrideOutputShape.categories).toContain("ml_convolutions");
  });

  it("should generate at least 20 algorithm steps for default input", () => {
    const steps = generateConv2dPaddingStrideOutputShapeSteps(
      DEFAULT_CONV2DPADDINGSTRIDEOUTPUTSHAPE_INPUT,
    );
    expect(steps.length).toBeGreaterThanOrEqual(20);
    expect(steps[0].explanation.what).toContain("2D Conv Output Shape Calculator");
    expect(steps[steps.length - 1].explanation.what).toBe("Execution Complete");
  });

  it("should map every code line in trivia.lineExplanations", () => {
    const codeLines = conv2dPaddingStrideOutputShape.code.split("\n");
    const lineExplanations = conv2dPaddingStrideOutputShape.trivia?.lineExplanations;
    expect(lineExplanations).toBeDefined();

    codeLines.forEach((_, index) => {
      const lineNum = index + 1;
      expect(lineExplanations?.[lineNum]).toBeDefined();
      expect(typeof lineExplanations?.[lineNum]).toBe("string");
      expect(lineExplanations?.[lineNum].length).toBeGreaterThan(0);
    });
  });

  it("should teach the topic through a topicGuide with Markdown and LaTeX", () => {
    const guide = conv2dPaddingStrideOutputShape.topicGuide;
    expect(guide.overview.length).toBeGreaterThan(120);
    expect(guide.sections.length).toBeGreaterThanOrEqual(4);
    expect(guide.sections.length).toBeLessThanOrEqual(6);

    guide.sections.forEach((section) => {
      expect(section.heading.length).toBeGreaterThan(0);
      expect(section.body.length).toBeGreaterThan(50);
    });

    const allText = [guide.overview, ...guide.sections.map((s) => s.body)].join(" ");
    expect(allText).toContain("$");
    expect(allText.toLowerCase()).toContain("spatial");

    expect(guide.keyTerms?.length).toBeGreaterThanOrEqual(3);
    expect(guide.keyTerms?.length).toBeLessThanOrEqual(6);
  });
});
