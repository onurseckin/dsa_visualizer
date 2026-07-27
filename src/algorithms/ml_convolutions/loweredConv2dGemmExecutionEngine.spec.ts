import { describe, it, expect } from "vitest";
import {
  loweredConv2dGemmExecutionEngine,
  DEFAULT_LOWEREDCONV2DGEMMEXECUTIONENGINE_INPUT,
  generateLoweredConv2dGemmExecutionEngineSteps,
} from "./loweredConv2dGemmExecutionEngine";

describe("loweredConv2dGemmExecutionEngine", () => {
  it("should have correct metadata", () => {
    expect(loweredConv2dGemmExecutionEngine.id).toBe("loweredConv2dGemmExecutionEngine");
    expect(loweredConv2dGemmExecutionEngine.isMlInfra).toBe(true);
    expect(loweredConv2dGemmExecutionEngine.mlInfraLevel).toBe(8);
    expect(loweredConv2dGemmExecutionEngine.mlInfraCategory).toBe("ml_convolutions");
    expect(loweredConv2dGemmExecutionEngine.categories).toContain("ml_convolutions");
    expect(loweredConv2dGemmExecutionEngine.categories).toContain("ml_gemm_roofline");
  });

  it("should generate at least 20 algorithm steps for default input", () => {
    const steps = generateLoweredConv2dGemmExecutionEngineSteps(
      DEFAULT_LOWEREDCONV2DGEMMEXECUTIONENGINE_INPUT,
    );
    expect(steps.length).toBeGreaterThanOrEqual(20);
    expect(steps[0].explanation.what).toContain("Lowered Conv2D GEMM Execution Engine");
    expect(steps[steps.length - 1].explanation.what).toBe(
      "Reshape Y_2d Matrix to 4D Output Tensor & Complete",
    );
  });

  it("should map every code line in trivia.lineExplanations", () => {
    const codeLines = loweredConv2dGemmExecutionEngine.code.split("\n");
    const lineExplanations = loweredConv2dGemmExecutionEngine.trivia?.lineExplanations;
    expect(lineExplanations).toBeDefined();

    codeLines.forEach((_, index) => {
      const lineNum = index + 1;
      expect(lineExplanations?.[lineNum]).toBeDefined();
      expect(typeof lineExplanations?.[lineNum]).toBe("string");
      expect(lineExplanations?.[lineNum].length).toBeGreaterThan(0);
    });
  });

  it("should teach the topic through a topicGuide with Markdown and LaTeX", () => {
    const guide = loweredConv2dGemmExecutionEngine.topicGuide;
    expect(guide.overview.length).toBeGreaterThan(120);
    expect(guide.sections.length).toBeGreaterThanOrEqual(4);
    expect(guide.sections.length).toBeLessThanOrEqual(6);

    guide.sections.forEach((section) => {
      expect(section.heading.length).toBeGreaterThan(0);
      expect(section.body.length).toBeGreaterThan(50);
    });

    const allText = [guide.overview, ...guide.sections.map((s) => s.body)].join(" ");
    expect(allText).toContain("$");
    expect(allText.toLowerCase()).toContain("lowered");

    expect(guide.keyTerms?.length).toBeGreaterThanOrEqual(3);
    expect(guide.keyTerms?.length).toBeLessThanOrEqual(6);
  });
});
