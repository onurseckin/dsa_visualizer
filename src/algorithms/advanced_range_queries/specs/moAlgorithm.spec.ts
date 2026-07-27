import { describe, expect, it } from "vitest";
import { moAlgorithm, generateMoAlgorithmSteps } from "../moAlgorithm";
import type { ArrayVisualSnapshot } from "../../../types/dsa";

describe("moAlgorithm algorithm spec", () => {
  it("should have correct algorithm metadata", () => {
    expect(moAlgorithm.id).toBe("mo-algorithm");
    expect(moAlgorithm.title).toContain("Mo's Algorithm");
    expect(moAlgorithm.category).toBe("advanced_range_queries");
    expect(moAlgorithm.timeComplexity.average).toContain("sqrt");
    expect(moAlgorithm.spaceComplexity).toBe("O(n + q)");
  });

  it("should generate at least 20 steps for default input", () => {
    const steps = generateMoAlgorithmSteps(moAlgorithm.defaultInput);
    expect(steps.length).toBeGreaterThanOrEqual(20);

    const firstStep = steps[0];
    expect(firstStep.stepIndex).toBe(0);
    expect(firstStep.primarySnapshot.kind).toBe("array");

    const snapshot = firstStep.primarySnapshot as ArrayVisualSnapshot;
    expect(snapshot.elements).toBeDefined();

    const querySteps = steps.filter((s) => s.explanation.what.includes("Processing Query"));
    expect(querySteps.length).toBeGreaterThan(0);
  });

  it("should map every code line in trivia.lineExplanations", () => {
    const codeLines = moAlgorithm.code.split("\n");
    const lineExplanations = moAlgorithm.trivia?.lineExplanations;
    expect(lineExplanations).toBeDefined();

    codeLines.forEach((_, index) => {
      const lineNum = index + 1;
      expect(lineExplanations?.[lineNum]).toBeDefined();
      expect(typeof lineExplanations?.[lineNum]).toBe("string");
      expect(lineExplanations?.[lineNum].length).toBeGreaterThan(0);
    });
  });

  it("should teach the topic through a topicGuide with Markdown and LaTeX", () => {
    const guide = moAlgorithm.topicGuide;
    expect(guide.overview.length).toBeGreaterThan(120);
    expect(guide.sections.length).toBeGreaterThanOrEqual(4);
    expect(guide.sections.length).toBeLessThanOrEqual(6);

    guide.sections.forEach((section) => {
      expect(section.heading.length).toBeGreaterThan(0);
      expect(section.body.length).toBeGreaterThan(50);
    });

    const allText = [guide.overview, ...guide.sections.map((s) => s.body)].join(" ");
    expect(allText.toLowerCase()).toContain("offline");
    expect(allText.toLowerCase()).toContain("pointer");

    expect(guide.keyTerms?.length).toBeGreaterThanOrEqual(3);
    expect(guide.keyTerms?.length).toBeLessThanOrEqual(6);
    expect(guide.keyTerms?.map((t) => t.term)).toContain("Offline Querying");
  });

  it("should handle single element input array", () => {
    const steps = generateMoAlgorithmSteps({
      array: [100],
      queries: [{ left: 0, right: 0 }],
    });
    expect(steps.length).toBeGreaterThan(0);
  });

  it("should handle empty input array", () => {
    const steps = generateMoAlgorithmSteps({ array: [], queries: [] });
    expect(steps.length).toBe(2);
    expect(steps[1].explanation.what).toContain("empty");
  });

  it("provides 3 typed examples (basic, complex, negative) that generate steps without errors", () => {
    expect(moAlgorithm.examples).toHaveLength(3);
    expect(moAlgorithm.examples?.map((ex) => ex.kind)).toEqual(["basic", "complex", "negative"]);

    for (const example of moAlgorithm.examples!) {
      const steps = moAlgorithm.generateSteps(
        example.input as { array: number[]; queries: { left: number; right: number }[] },
      );
      expect(steps.length).toBeGreaterThan(0);
    }
  });
});
