import { describe, it, expect } from "vitest";
import {
  winogradF23TransformMatrices,
  DEFAULT_WINOGRADF23TRANSFORMMATRICES_INPUT,
  generateWinogradF23TransformMatricesSteps,
} from "./winogradF23TransformMatrices";

describe("winogradF23TransformMatrices", () => {
  it("should have correct metadata", () => {
    expect(winogradF23TransformMatrices.id).toBe("winogradF23TransformMatrices");
    expect(winogradF23TransformMatrices.isMlInfra).toBe(true);
    expect(winogradF23TransformMatrices.mlInfraLevel).toBe(8);
    expect(winogradF23TransformMatrices.mlInfraCategory).toBe("ml_convolutions");
    expect(winogradF23TransformMatrices.categories).toContain("ml_convolutions");
    expect(winogradF23TransformMatrices.categories).toContain("ml_gemm_roofline");
  });

  it("should generate at least 20 algorithm steps for default input", () => {
    const steps = generateWinogradF23TransformMatricesSteps(
      DEFAULT_WINOGRADF23TRANSFORMMATRICES_INPUT,
    );
    expect(steps.length).toBeGreaterThanOrEqual(20);
    expect(steps[0].explanation.what).toContain("Winograd F(2x2, 3x3) Transform Matrices");
    expect(steps[steps.length - 1].explanation.what).toContain("Inverse Spatial Transform");
  });

  it("should map every code line in trivia.lineExplanations", () => {
    const codeLines = winogradF23TransformMatrices.code.split("\n");
    const lineExplanations = winogradF23TransformMatrices.trivia?.lineExplanations;
    expect(lineExplanations).toBeDefined();

    codeLines.forEach((_, index) => {
      const lineNum = index + 1;
      expect(lineExplanations?.[lineNum]).toBeDefined();
      expect(typeof lineExplanations?.[lineNum]).toBe("string");
      expect(lineExplanations?.[lineNum].length).toBeGreaterThan(0);
    });
  });

  it("should teach the topic through a topicGuide with Markdown and LaTeX", () => {
    const guide = winogradF23TransformMatrices.topicGuide;
    expect(guide.overview.length).toBeGreaterThan(120);
    expect(guide.sections.length).toBeGreaterThanOrEqual(4);
    expect(guide.sections.length).toBeLessThanOrEqual(6);

    guide.sections.forEach((section) => {
      expect(section.heading.length).toBeGreaterThan(0);
      expect(section.body.length).toBeGreaterThan(50);
    });

    const allText = [guide.overview, ...guide.sections.map((s) => s.body)].join(" ");
    expect(allText).toContain("$");
    expect(allText.toLowerCase()).toContain("winograd");

    expect(guide.keyTerms?.length).toBeGreaterThanOrEqual(3);
    expect(guide.keyTerms?.length).toBeLessThanOrEqual(6);
  });
});
