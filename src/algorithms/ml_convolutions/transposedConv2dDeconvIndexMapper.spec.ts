import { describe, it, expect } from "vitest";
import {
  transposedConv2dDeconvIndexMapper,
  DEFAULT_TRANSPOSEDCONV2DDECONVINDEXMAPPER_INPUT,
  generateTransposedConv2dDeconvIndexMapperSteps,
} from "./transposedConv2dDeconvIndexMapper";

describe("transposedConv2dDeconvIndexMapper", () => {
  it("should have correct metadata", () => {
    expect(transposedConv2dDeconvIndexMapper.id).toBe("transposedConv2dDeconvIndexMapper");
    expect(transposedConv2dDeconvIndexMapper.isMlInfra).toBe(true);
    expect(transposedConv2dDeconvIndexMapper.mlInfraLevel).toBe(8);
    expect(transposedConv2dDeconvIndexMapper.mlInfraCategory).toBe("ml_convolutions");
    expect(transposedConv2dDeconvIndexMapper.categories).toContain("ml_convolutions");
    expect(transposedConv2dDeconvIndexMapper.categories).toContain("ml_hardware_kernels");
  });

  it("should generate at least 20 algorithm steps for default input", () => {
    const steps = generateTransposedConv2dDeconvIndexMapperSteps(
      DEFAULT_TRANSPOSEDCONV2DDECONVINDEXMAPPER_INPUT,
    );
    expect(steps.length).toBeGreaterThanOrEqual(20);
    expect(steps[0].explanation.what).toContain("Transposed 2D Convolution Engine");
    expect(steps[steps.length - 1].explanation.what).toBe("Execution Complete");
  });

  it("should map every code line in trivia.lineExplanations", () => {
    const codeLines = transposedConv2dDeconvIndexMapper.code.split("\n");
    const lineExplanations = transposedConv2dDeconvIndexMapper.trivia?.lineExplanations;
    expect(lineExplanations).toBeDefined();

    codeLines.forEach((_, index) => {
      const lineNum = index + 1;
      expect(lineExplanations?.[lineNum]).toBeDefined();
      expect(typeof lineExplanations?.[lineNum]).toBe("string");
      expect(lineExplanations?.[lineNum].length).toBeGreaterThan(0);
    });
  });

  it("should teach the topic through a topicGuide with Markdown and LaTeX", () => {
    const guide = transposedConv2dDeconvIndexMapper.topicGuide;
    expect(guide.overview.length).toBeGreaterThan(120);
    expect(guide.sections.length).toBeGreaterThanOrEqual(4);
    expect(guide.sections.length).toBeLessThanOrEqual(6);

    guide.sections.forEach((section) => {
      expect(section.heading.length).toBeGreaterThan(0);
      expect(section.body.length).toBeGreaterThan(50);
    });

    const allText = [guide.overview, ...guide.sections.map((s) => s.body)].join(" ");
    expect(allText).toContain("$");
    expect(allText.toLowerCase()).toContain("transposed");

    expect(guide.keyTerms?.length).toBeGreaterThanOrEqual(3);
    expect(guide.keyTerms?.length).toBeLessThanOrEqual(6);
  });
});
