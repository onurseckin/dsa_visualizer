import { describe, expect, it } from "vitest";
import { sqrtDecomposition, generateSqrtDecompositionSteps } from "../sqrtDecomposition";
import type { ArrayVisualSnapshot } from "../../../types/dsa";

describe("sqrtDecomposition algorithm spec", () => {
  it("should have correct algorithm metadata", () => {
    expect(sqrtDecomposition.id).toBe("sqrt-decomposition");
    expect(sqrtDecomposition.title).toContain("SQRT Decomposition");
    expect(sqrtDecomposition.category).toBe("advanced_range_queries");
    expect(sqrtDecomposition.timeComplexity.average).toBe("O(sqrt n)");
    expect(sqrtDecomposition.spaceComplexity).toBe("O(n)");
  });

  it("should generate at least 20 steps for default input", () => {
    const steps = generateSqrtDecompositionSteps(sqrtDecomposition.defaultInput);
    expect(steps.length).toBeGreaterThanOrEqual(20);

    const firstStep = steps[0];
    expect(firstStep.stepIndex).toBe(0);
    expect(firstStep.primarySnapshot.kind).toBe("array");

    const snapshot = firstStep.primarySnapshot as ArrayVisualSnapshot;
    expect(snapshot.elements).toBeDefined();

    const querySteps = steps.filter((s) => s.explanation.what.includes("Query"));
    expect(querySteps.length).toBeGreaterThan(0);
  });

  it("should map every code line in trivia.lineExplanations", () => {
    const codeLines = sqrtDecomposition.code.split("\n");
    const lineExplanations = sqrtDecomposition.trivia?.lineExplanations;
    expect(lineExplanations).toBeDefined();

    codeLines.forEach((_, index) => {
      const lineNum = index + 1;
      expect(lineExplanations?.[lineNum]).toBeDefined();
      expect(typeof lineExplanations?.[lineNum]).toBe("string");
      expect(lineExplanations?.[lineNum].length).toBeGreaterThan(0);
    });
  });

  it("should teach the topic through a topicGuide with Markdown and LaTeX", () => {
    const guide = sqrtDecomposition.topicGuide;
    expect(guide.overview.length).toBeGreaterThan(120);
    expect(guide.sections.length).toBeGreaterThanOrEqual(4);
    expect(guide.sections.length).toBeLessThanOrEqual(6);

    guide.sections.forEach((section) => {
      expect(section.heading.length).toBeGreaterThan(0);
      expect(section.body.length).toBeGreaterThan(50);
    });

    const allText = [guide.overview, ...guide.sections.map((s) => s.body)].join(" ");
    expect(allText.toLowerCase()).toContain("block");
    expect(allText.toLowerCase()).toContain("partition");

    expect(guide.keyTerms?.length).toBeGreaterThanOrEqual(3);
    expect(guide.keyTerms?.length).toBeLessThanOrEqual(6);
    expect(guide.keyTerms?.map((t) => t.term)).toContain("Full Block");
  });

  it("should handle single element input array", () => {
    const steps = generateSqrtDecompositionSteps({
      array: [10],
      operations: [{ type: "query", left: 0, right: 0 }],
    });
    expect(steps.length).toBeGreaterThan(0);
  });

  it("should handle empty input array", () => {
    const steps = generateSqrtDecompositionSteps({ array: [], operations: [] });
    expect(steps.length).toBe(2);
    expect(steps[1].explanation.what).toContain("empty");
  });

  it("provides 3 typed examples (basic, complex, negative) that generate steps without errors", () => {
    expect(sqrtDecomposition.examples).toHaveLength(3);
    expect(sqrtDecomposition.examples?.map((ex) => ex.kind)).toEqual([
      "basic",
      "complex",
      "negative",
    ]);

    for (const example of sqrtDecomposition.examples!) {
      const steps = sqrtDecomposition.generateSteps(
        example.input as {
          array: number[];
          operations: {
            type: "query" | "update";
            left?: number;
            right?: number;
            index?: number;
            value?: number;
          }[];
        },
      );
      expect(steps.length).toBeGreaterThan(0);
    }
  });
});
