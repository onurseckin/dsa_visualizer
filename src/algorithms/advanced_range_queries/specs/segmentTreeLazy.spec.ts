import { describe, expect, it } from "vitest";
import {
  DEFAULT_SEGMENT_TREE_LAZY_INPUT,
  generateSegmentTreeLazySteps,
  segmentTreeLazy,
} from "../segmentTreeLazy";
import type { TreeVisualSnapshot } from "../../../types/dsa";

describe("segmentTreeLazy algorithm spec", () => {
  it("should have correct algorithm metadata", () => {
    expect(segmentTreeLazy.id).toBe("segment-tree-lazy");
    expect(segmentTreeLazy.title).toBe("Segment Tree (Lazy Propagation)");
    expect(segmentTreeLazy.topicIds).toContain("advanced_range_queries");
    expect(segmentTreeLazy.difficulty).toBe("Hard");
    expect(segmentTreeLazy.code).toContain("class SegmentTreeLazy");
    expect(segmentTreeLazy.timeComplexity.average).toBe("O(log n)");
    expect(segmentTreeLazy.spaceComplexity).toBe("O(n)");
  });

  it("should generate at least 20 steps for default input", () => {
    const steps = generateSegmentTreeLazySteps(DEFAULT_SEGMENT_TREE_LAZY_INPUT);
    expect(steps.length).toBeGreaterThanOrEqual(20);

    const firstStep = steps[0];
    expect(firstStep.stepIndex).toBe(0);
    expect(firstStep.primarySnapshot.kind).toBe("tree");

    const snapshot = firstStep.primarySnapshot as TreeVisualSnapshot;
    expect(snapshot.nodes).toBeDefined();

    const queryResultSteps = steps.filter((s) =>
      s.explanation.what.includes("Range query [1..3] equals"),
    );
    expect(queryResultSteps.length).toBe(2);

    // Initial sum for range [1..3] in array [1, 2, 3, 4, 5] is 2 + 3 + 4 = 9
    expect(queryResultSteps[0].variables.totalSum).toBe(9);

    // After adding 5 to [1..3], array becomes [1, 7, 8, 9, 5]. Range [1..3] sum is 7 + 8 + 9 = 24
    expect(queryResultSteps[1].variables.totalSum).toBe(24);
  });

  it("should map every code line in trivia.lineExplanations", () => {
    const codeLines = segmentTreeLazy.code.split("\n");
    const lineExplanations = segmentTreeLazy.trivia?.lineExplanations;
    expect(lineExplanations).toBeDefined();

    codeLines.forEach((_, index) => {
      const lineNum = index + 1;
      expect(lineExplanations?.[lineNum]).toBeDefined();
      expect(typeof lineExplanations?.[lineNum]).toBe("string");
      expect(lineExplanations?.[lineNum].length).toBeGreaterThan(0);
    });
  });

  it("should handle empty input array", () => {
    const steps = generateSegmentTreeLazySteps({ array: [] });
    expect(steps.length).toBe(1);
    expect(steps[0].variables.n).toBe(0);
  });

  it("should handle lazy pushdown, leaf updates, out-of-bounds queries, and invalid ops", () => {
    const steps1 = generateSegmentTreeLazySteps({ array: [1, 2, 3, 4] });
    expect(steps1.length).toBeGreaterThan(0);

    const steps2 = generateSegmentTreeLazySteps({
      array: [10, 20, 30, 40],
      operations: [
        { type: "rangeUpdate", left: 0, right: 1 }, // omitted value defaults to 1
        { type: "rangeUpdate", left: 0, right: 1, value: 5 }, // set lazy tag on node [0..1]
        { type: "rangeQuery", left: 0, right: 0 }, // forces pushLazy on node [0..1]
        { type: "rangeUpdate", left: 2, right: 2, value: 10 }, // leaf node update (start === end)
        { type: "rangeUpdate", left: 10, right: 20, value: 5 }, // completely out of bounds update
        { type: "rangeQuery", left: 10, right: 20 }, // completely out of bounds query
        { type: "invalid" as unknown as "rangeUpdate", left: 0, right: 0 },
      ],
    });
    expect(steps2.length).toBeGreaterThan(0);
  });

  it("should teach the topic through a topicGuide with Markdown and LaTeX", () => {
    const guide = segmentTreeLazy.topicGuide;
    expect(guide.overview.length).toBeGreaterThan(120);
    expect(guide.sections.length).toBeGreaterThanOrEqual(4);
    expect(guide.sections.length).toBeLessThanOrEqual(6);

    guide.sections.forEach((section) => {
      expect(section.heading.length).toBeGreaterThan(0);
      expect(section.body.length).toBeGreaterThan(50);
    });

    const allText = [guide.overview, ...guide.sections.map((s) => s.body)].join(" ");
    expect(allText).toContain("lazy tag");
    expect(allText).toContain("push");

    expect(guide.keyTerms?.length).toBeGreaterThanOrEqual(3);
    expect(guide.keyTerms?.length).toBeLessThanOrEqual(6);
    expect(guide.keyTerms?.map((t) => t.term)).toContain("Push Operation");
  });

  it("provides 3 typed examples (basic, complex, negative) that generate steps without errors", () => {
    expect(segmentTreeLazy.examples).toHaveLength(3);
    expect(segmentTreeLazy.examples?.map((ex) => ex.kind)).toEqual([
      "basic",
      "complex",
      "negative",
    ]);
    expect(segmentTreeLazy.examples?.map((ex) => ex.title)).toEqual([
      "Basic Example",
      "Complex Edge Case",
      "Failing / Boundary Case",
    ]);

    for (const example of segmentTreeLazy.examples!) {
      const steps = segmentTreeLazy.generateSteps(example.input as { array: number[] });
      expect(steps.length).toBeGreaterThan(0);
    }
  });
});
