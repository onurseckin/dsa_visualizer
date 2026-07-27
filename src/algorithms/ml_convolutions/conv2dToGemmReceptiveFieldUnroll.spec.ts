import { describe, it, expect } from "vitest";
import {
  conv2dToGemmReceptiveFieldUnroll,
  DEFAULT_CONV2DTOGEMMRECEPTIVEFIELDUNROLL_INPUT,
  generateConv2dToGemmReceptiveFieldUnrollSteps,
} from "./conv2dToGemmReceptiveFieldUnroll";

describe("conv2dToGemmReceptiveFieldUnroll (Conv2D Receptive Field Patch Unroller)", () => {
  it("should have correct metadata", () => {
    expect(conv2dToGemmReceptiveFieldUnroll.id).toBe("conv2dToGemmReceptiveFieldUnroll");
    expect(conv2dToGemmReceptiveFieldUnroll.isMlInfra).toBe(true);
    expect(conv2dToGemmReceptiveFieldUnroll.mlInfraLevel).toBe(8);
    expect(conv2dToGemmReceptiveFieldUnroll.mlInfraCategory).toBe("ml_convolutions");
    expect(conv2dToGemmReceptiveFieldUnroll.categories).toContain("ml_convolutions");
  });

  it("should generate at least 20 algorithm steps for default input", () => {
    const steps = generateConv2dToGemmReceptiveFieldUnrollSteps(
      DEFAULT_CONV2DTOGEMMRECEPTIVEFIELDUNROLL_INPUT,
    );
    expect(steps.length).toBeGreaterThanOrEqual(20);
    expect(steps[0].explanation.what).toContain("Conv2D Receptive Field Patch Unroller");
    expect(steps[steps.length - 1].explanation.what).toBe("Execution Complete");
  });

  it("should map every code line in trivia.lineExplanations", () => {
    const codeLines = conv2dToGemmReceptiveFieldUnroll.code.split("\n");
    const lineExplanations = conv2dToGemmReceptiveFieldUnroll.trivia?.lineExplanations;
    expect(lineExplanations).toBeDefined();

    codeLines.forEach((_, index) => {
      const lineNum = index + 1;
      expect(lineExplanations?.[lineNum]).toBeDefined();
      expect(typeof lineExplanations?.[lineNum]).toBe("string");
      expect(lineExplanations?.[lineNum].length).toBeGreaterThan(0);
    });
  });

  it("should teach the topic through a topicGuide with Markdown and LaTeX", () => {
    const guide = conv2dToGemmReceptiveFieldUnroll.topicGuide;
    expect(guide.overview.length).toBeGreaterThan(120);
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
