import { describe, expect, it } from "vitest";
import { generateSegmentTreeSteps, segmentTree } from "../segmentTree";
import type { TreeVisualSnapshot } from "../../../types/dsa";

describe("segmentTree algorithm spec", () => {
  it("should have correct algorithm metadata", () => {
    expect(segmentTree.id).toBe("segment-tree");
    expect(segmentTree.title).toContain("Segment Tree");
    expect(segmentTree.category).toBe("advanced_range_queries");
    expect(segmentTree.timeComplexity.average).toBe("O(log n)");
    expect(segmentTree.spaceComplexity).toBe("O(n)");
  });

  it("should generate at least 20 steps for default input", () => {
    const steps = generateSegmentTreeSteps(segmentTree.defaultInput);
    expect(steps.length).toBeGreaterThanOrEqual(20);

    const firstStep = steps[0];
    expect(firstStep.stepIndex).toBe(0);
    expect(firstStep.primarySnapshot.kind).toBe("tree");

    const snapshot = firstStep.primarySnapshot as TreeVisualSnapshot;
    expect(snapshot.nodes).toBeDefined();

    const resultSteps = steps.filter((s) =>
      s.explanation.what.includes("Range query [1..3] equals"),
    );
    expect(resultSteps.length).toBe(2);
    expect(resultSteps[0].variables.totalSum).toBe(15);
    expect(resultSteps[1].variables.totalSum).toBe(16);
  });

  it("should map every code line in trivia.lineExplanations", () => {
    const codeLines = segmentTree.code.split("\n");
    const lineExplanations = segmentTree.trivia?.lineExplanations;
    expect(lineExplanations).toBeDefined();

    codeLines.forEach((_, index) => {
      const lineNum = index + 1;
      expect(lineExplanations?.[lineNum]).toBeDefined();
      expect(typeof lineExplanations?.[lineNum]).toBe("string");
      expect(lineExplanations?.[lineNum].length).toBeGreaterThan(0);
    });
  });

  it("should handle point update operation correctly", () => {
    const steps = generateSegmentTreeSteps({
      array: [10, 20, 30],
      operations: [{ type: "update", index: 0, value: 50 }],
    });
    expect(steps.length).toBeGreaterThan(0);
    const lastStep = steps[steps.length - 1];
    expect(lastStep.variables.rootSum).toBe(100);
  });

  it("should handle empty input array", () => {
    const steps = generateSegmentTreeSteps({ array: [] });
    expect(steps.length).toBe(1);
    expect(steps[0].primarySnapshot.kind).toBe("tree");
  });

  it("should handle right-child update, out-of-bound query, and invalid ops", () => {
    const steps1 = generateSegmentTreeSteps({ array: [1, 2, 3, 4] });
    expect(steps1.length).toBeGreaterThan(0);

    const steps2 = generateSegmentTreeSteps({
      array: [10, 20, 30, 40],
      operations: [
        { type: "update", index: 3, value: 50 },
        { type: "query", left: 10, right: 15 },
        { type: "query", left: 0 },
        { type: "update", index: 1 },
        { type: "unknown" as unknown as "query" },
      ],
    });
    expect(steps2.length).toBeGreaterThan(0);
  });

  it("should teach the topic through a topicGuide with Markdown and LaTeX", () => {
    const guide = segmentTree.topicGuide;
    expect(guide.overview.length).toBeGreaterThan(120);
    expect(guide.sections.length).toBeGreaterThanOrEqual(4);
    expect(guide.sections.length).toBeLessThanOrEqual(6);

    guide.sections.forEach((section) => {
      expect(section.heading.length).toBeGreaterThan(0);
      expect(section.body.length).toBeGreaterThan(50);
    });

    const allText = [guide.overview, ...guide.sections.map((s) => s.body)].join(" ");
    expect(allText).toContain("interval");
    expect(allText).toContain("identity");

    expect(guide.keyTerms?.length).toBeGreaterThanOrEqual(3);
    expect(guide.keyTerms?.length).toBeLessThanOrEqual(6);
    expect(guide.keyTerms?.map((t) => t.term)).toContain("Associative Merge");
  });

  it("provides 3 typed examples (basic, complex, negative) that generate steps without errors", () => {
    expect(segmentTree.examples).toHaveLength(3);
    expect(segmentTree.examples?.map((ex) => ex.kind)).toEqual(["basic", "complex", "negative"]);
    expect(segmentTree.examples?.map((ex) => ex.title)).toEqual([
      "Basic Example",
      "Complex Edge Case",
      "Failing / Boundary Case",
    ]);

    for (const example of segmentTree.examples!) {
      const steps = segmentTree.generateSteps(example.input as { array: number[] });
      expect(steps.length).toBeGreaterThan(0);
    }
  });
});
