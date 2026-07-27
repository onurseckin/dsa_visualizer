import { describe, it, expect } from "vitest";
import {
  multiChannelConv2dAccumulation,
  DEFAULT_MULTICHANNELCONV2DACCUMULATION_INPUT,
  generateMultiChannelConv2dAccumulationSteps,
} from "./multiChannelConv2dAccumulation";

describe("multiChannelConv2dAccumulation", () => {
  it("should have correct metadata", () => {
    expect(multiChannelConv2dAccumulation.id).toBe("multiChannelConv2dAccumulation");
    expect(multiChannelConv2dAccumulation.isMlInfra).toBe(true);
    expect(multiChannelConv2dAccumulation.mlInfraLevel).toBe(8);
    expect(multiChannelConv2dAccumulation.mlInfraCategory).toBe("ml_convolutions");
    expect(multiChannelConv2dAccumulation.categories).toContain("ml_convolutions");
    expect(multiChannelConv2dAccumulation.categories).toContain("ml_hardware_kernels");
  });

  it("should generate at least 20 algorithm steps for default input", () => {
    const steps = generateMultiChannelConv2dAccumulationSteps(
      DEFAULT_MULTICHANNELCONV2DACCUMULATION_INPUT,
    );
    expect(steps.length).toBeGreaterThanOrEqual(20);
    expect(steps[0].explanation.what).toContain("Multi-Channel Conv2D Accumulator");
    expect(steps[steps.length - 1].explanation.what).toBe("Execution Complete");
  });

  it("should map every code line in trivia.lineExplanations", () => {
    const codeLines = multiChannelConv2dAccumulation.code.split("\n");
    const lineExplanations = multiChannelConv2dAccumulation.trivia?.lineExplanations;
    expect(lineExplanations).toBeDefined();

    codeLines.forEach((_, index) => {
      const lineNum = index + 1;
      expect(lineExplanations?.[lineNum]).toBeDefined();
      expect(typeof lineExplanations?.[lineNum]).toBe("string");
      expect(lineExplanations?.[lineNum].length).toBeGreaterThan(0);
    });
  });

  it("should teach the topic through a topicGuide with Markdown and LaTeX", () => {
    const guide = multiChannelConv2dAccumulation.topicGuide;
    expect(guide.overview.length).toBeGreaterThan(120);
    expect(guide.sections.length).toBeGreaterThanOrEqual(4);
    expect(guide.sections.length).toBeLessThanOrEqual(6);

    guide.sections.forEach((section) => {
      expect(section.heading.length).toBeGreaterThan(0);
      expect(section.body.length).toBeGreaterThan(50);
    });

    const allText = [guide.overview, ...guide.sections.map((s) => s.body)].join(" ");
    expect(allText).toContain("$");
    expect(allText.toLowerCase()).toContain("multi-channel");

    expect(guide.keyTerms?.length).toBeGreaterThanOrEqual(3);
    expect(guide.keyTerms?.length).toBeLessThanOrEqual(6);
  });
});
