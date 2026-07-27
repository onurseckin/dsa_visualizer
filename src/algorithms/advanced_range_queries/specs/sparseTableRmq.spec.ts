import { describe, expect, it } from "vitest";
import { sparseTableRmq, generateSparseTableRmqSteps } from "../sparseTableRmq";
import type { ArrayVisualSnapshot } from "../../../types/dsa";

describe("sparseTableRmq algorithm spec", () => {
  it("should have correct algorithm metadata", () => {
    expect(sparseTableRmq.id).toBe("sparse-table-rmq");
    expect(sparseTableRmq.title).toContain("Sparse Table");
    expect(sparseTableRmq.category).toBe("advanced_range_queries");
    expect(sparseTableRmq.timeComplexity.average).toBe("O(1)");
    expect(sparseTableRmq.spaceComplexity).toBe("O(n log n)");
  });

  it("should generate at least 20 steps for default input", () => {
    const steps = generateSparseTableRmqSteps(sparseTableRmq.defaultInput);
    expect(steps.length).toBeGreaterThanOrEqual(20);

    const firstStep = steps[0];
    expect(firstStep.stepIndex).toBe(0);
    expect(firstStep.primarySnapshot.kind).toBe("array");

    const snapshot = firstStep.primarySnapshot as ArrayVisualSnapshot;
    expect(snapshot.elements).toBeDefined();

    const querySteps = steps.filter((s) => s.explanation.what.includes("RMQ"));
    expect(querySteps.length).toBeGreaterThan(0);
  });

  it("should map every code line in trivia.lineExplanations", () => {
    const codeLines = sparseTableRmq.code.split("\n");
    const lineExplanations = sparseTableRmq.trivia?.lineExplanations;
    expect(lineExplanations).toBeDefined();

    codeLines.forEach((_, index) => {
      const lineNum = index + 1;
      expect(lineExplanations?.[lineNum]).toBeDefined();
      expect(typeof lineExplanations?.[lineNum]).toBe("string");
      expect(lineExplanations?.[lineNum].length).toBeGreaterThan(0);
    });
  });

  it("should teach the topic through a topicGuide with Markdown and LaTeX", () => {
    const guide = sparseTableRmq.topicGuide;
    expect(guide.overview.length).toBeGreaterThan(120);
    expect(guide.sections.length).toBeGreaterThanOrEqual(4);
    expect(guide.sections.length).toBeLessThanOrEqual(6);

    guide.sections.forEach((section) => {
      expect(section.heading.length).toBeGreaterThan(0);
      expect(section.body.length).toBeGreaterThan(50);
    });

    const allText = [guide.overview, ...guide.sections.map((s) => s.body)].join(" ");
    expect(allText).toContain("idempotence");
    expect(allText.toLowerCase()).toContain("precomput");

    expect(guide.keyTerms?.length).toBeGreaterThanOrEqual(3);
    expect(guide.keyTerms?.length).toBeLessThanOrEqual(6);
    expect(guide.keyTerms?.map((t) => t.term)).toContain("Idempotence");
  });

  it("should handle single element input array", () => {
    const steps = generateSparseTableRmqSteps({
      array: [42],
      queries: [{ left: 0, right: 0 }],
    });
    expect(steps.length).toBeGreaterThan(0);
    const lastStep = steps[steps.length - 1];
    expect(lastStep.explanation.what).toContain("RMQ");
  });

  it("should handle empty input array", () => {
    const steps = generateSparseTableRmqSteps({ array: [], queries: [] });
    expect(steps.length).toBe(2);
    expect(steps[1].explanation.what).toContain("empty");
  });

  it("provides 3 typed examples (basic, complex, negative) that generate steps without errors", () => {
    expect(sparseTableRmq.examples).toHaveLength(3);
    expect(sparseTableRmq.examples?.map((ex) => ex.kind)).toEqual(["basic", "complex", "negative"]);

    for (const example of sparseTableRmq.examples!) {
      const steps = sparseTableRmq.generateSteps(
        example.input as { array: number[]; queries: { left: number; right: number }[] },
      );
      expect(steps.length).toBeGreaterThan(0);
    }
  });
});
