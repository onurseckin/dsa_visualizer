import { describe, it, expect } from "vitest";
import {
  winogradMinimalFilteringExecution,
  DEFAULT_WINOGRADMINIMALFILTERINGEXECUTION_INPUT,
  generateWinogradMinimalFilteringExecutionSteps,
} from "./winogradMinimalFilteringExecution";

describe("winograd-minimal-filtering-execution", () => {
  it("should have correct metadata", () => {
    expect(winogradMinimalFilteringExecution.id).toBe("winograd-minimal-filtering-execution");
    expect(
      winogradMinimalFilteringExecution.topicIds.some((topicId) => topicId.startsWith("ml_")),
    ).toBe(true);
    expect(winogradMinimalFilteringExecution.topicIds).toContain("ml_convolutions");
    expect(winogradMinimalFilteringExecution.topicIds).toContain("ml_convolutions");
    expect(winogradMinimalFilteringExecution.topicIds).toContain("ml_gemm_roofline");
  });

  it("should generate at least 20 algorithm steps for default input", () => {
    const steps = generateWinogradMinimalFilteringExecutionSteps(
      DEFAULT_WINOGRADMINIMALFILTERINGEXECUTION_INPUT,
    );
    expect(steps.length).toBeGreaterThanOrEqual(20);
    expect(steps[0].explanation.what).toContain(
      "Winograd F(2x2, 3x3) Minimal Filtering Execution Engine",
    );
    expect(steps[steps.length - 1].explanation.what).toBe("Execution Complete");
  });

  it("should map every code line in trivia.lineExplanations", () => {
    const codeLines = winogradMinimalFilteringExecution.code.split("\n");
    const lineExplanations = winogradMinimalFilteringExecution.trivia?.lineExplanations;
    expect(lineExplanations).toBeDefined();

    codeLines.forEach((_, index) => {
      const lineNum = index + 1;
      expect(lineExplanations?.[lineNum]).toBeDefined();
      expect(typeof lineExplanations?.[lineNum]).toBe("string");
      expect(lineExplanations?.[lineNum].length).toBeGreaterThan(0);
    });
  });

  it("should teach the topic through a topicGuide with Markdown and LaTeX", () => {
    const guide = winogradMinimalFilteringExecution.topicGuide;
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
