import { describe, it, expect } from "vitest";
import {
  fusedDepthwiseSeparableConv2dEngine,
  DEFAULT_FUSEDDEPTHWISESEPARABLECONV2DENGINE_INPUT,
  generateFusedDepthwiseSeparableConv2dEngineSteps,
} from "./fusedDepthwiseSeparableConv2dEngine";

describe("fusedDepthwiseSeparableConv2dEngine", () => {
  it("should have correct metadata", () => {
    expect(fusedDepthwiseSeparableConv2dEngine.id).toBe("fusedDepthwiseSeparableConv2dEngine");
    expect(fusedDepthwiseSeparableConv2dEngine.isMlInfra).toBe(true);
    expect(fusedDepthwiseSeparableConv2dEngine.mlInfraLevel).toBe(8);
    expect(fusedDepthwiseSeparableConv2dEngine.mlInfraCategory).toBe("ml_convolutions");
    expect(fusedDepthwiseSeparableConv2dEngine.categories).toContain("ml_convolutions");
    expect(fusedDepthwiseSeparableConv2dEngine.categories).toContain("ml_hardware_kernels");
  });

  it("should generate at least 20 algorithm steps for default input", () => {
    const steps = generateFusedDepthwiseSeparableConv2dEngineSteps(
      DEFAULT_FUSEDDEPTHWISESEPARABLECONV2DENGINE_INPUT,
    );
    expect(steps.length).toBeGreaterThanOrEqual(20);
    expect(steps[0].explanation.what).toContain("Fused Depthwise Separable Conv2D Engine");
    expect(steps[steps.length - 1].explanation.what).toBe("Execution Complete");
  });

  it("should map every code line in trivia.lineExplanations", () => {
    const codeLines = fusedDepthwiseSeparableConv2dEngine.code.split("\n");
    const lineExplanations = fusedDepthwiseSeparableConv2dEngine.trivia?.lineExplanations;
    expect(lineExplanations).toBeDefined();

    codeLines.forEach((_, index) => {
      const lineNum = index + 1;
      expect(lineExplanations?.[lineNum]).toBeDefined();
      expect(typeof lineExplanations?.[lineNum]).toBe("string");
      expect(lineExplanations?.[lineNum].length).toBeGreaterThan(0);
    });
  });

  it("should teach the topic through a topicGuide with Markdown and LaTeX", () => {
    const guide = fusedDepthwiseSeparableConv2dEngine.topicGuide;
    expect(guide.overview.length).toBeGreaterThan(120);
    expect(guide.sections.length).toBeGreaterThanOrEqual(4);
    expect(guide.sections.length).toBeLessThanOrEqual(6);

    guide.sections.forEach((section) => {
      expect(section.heading.length).toBeGreaterThan(0);
      expect(section.body.length).toBeGreaterThan(50);
    });

    const allText = [guide.overview, ...guide.sections.map((s) => s.body)].join(" ");
    expect(allText).toContain("$");
    expect(allText.toLowerCase()).toContain("depthwise");

    expect(guide.keyTerms?.length).toBeGreaterThanOrEqual(3);
    expect(guide.keyTerms?.length).toBeLessThanOrEqual(6);
  });
});
