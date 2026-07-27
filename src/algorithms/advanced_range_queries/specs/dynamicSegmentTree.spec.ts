import { describe, expect, it } from "vitest";
import { dynamicSegmentTree, generateDynamicSegmentTreeSteps } from "../dynamicSegmentTree";
import type { TreeVisualSnapshot } from "../../../types/dsa";

describe("dynamicSegmentTree algorithm spec", () => {
  it("should have correct algorithm metadata", () => {
    expect(dynamicSegmentTree.id).toBe("dynamic-segment-tree");
    expect(dynamicSegmentTree.title).toContain("Dynamic Segment Tree");
    expect(dynamicSegmentTree.category).toBe("advanced_range_queries");
    expect(dynamicSegmentTree.timeComplexity.average).toContain("log C");
    expect(dynamicSegmentTree.spaceComplexity).toBe("O(Q log C)");
  });

  it("should generate at least 20 steps for default input", () => {
    const steps = generateDynamicSegmentTreeSteps(dynamicSegmentTree.defaultInput);
    expect(steps.length).toBeGreaterThanOrEqual(20);

    const firstStep = steps[0];
    expect(firstStep.stepIndex).toBe(0);
    expect(firstStep.primarySnapshot.kind).toBe("tree");

    const snapshot = firstStep.primarySnapshot as TreeVisualSnapshot;
    expect(snapshot.nodes).toBeDefined();
    expect(snapshot.nodes.length).toBeGreaterThan(0);
  });

  it("should map every code line in trivia.lineExplanations", () => {
    const codeLines = dynamicSegmentTree.code.split("\n");
    const lineExplanations = dynamicSegmentTree.trivia?.lineExplanations;
    expect(lineExplanations).toBeDefined();

    codeLines.forEach((_, index) => {
      const lineNum = index + 1;
      expect(lineExplanations?.[lineNum]).toBeDefined();
      expect(typeof lineExplanations?.[lineNum]).toBe("string");
      expect(lineExplanations?.[lineNum].length).toBeGreaterThan(0);
    });
  });

  it("should teach the topic through a topicGuide with Markdown and LaTeX", () => {
    const guide = dynamicSegmentTree.topicGuide;
    expect(guide.overview.length).toBeGreaterThan(120);
    expect(guide.sections.length).toBeGreaterThanOrEqual(4);
    expect(guide.sections.length).toBeLessThanOrEqual(6);

    guide.sections.forEach((section) => {
      expect(section.heading.length).toBeGreaterThan(0);
      expect(section.body.length).toBeGreaterThan(50);
    });

    const allText = [guide.overview, ...guide.sections.map((s) => s.body)].join(" ");
    expect(allText.toLowerCase()).toContain("sparse");
    expect(allText.toLowerCase()).toContain("pointer");

    expect(guide.keyTerms?.length).toBeGreaterThanOrEqual(3);
    expect(guide.keyTerms?.length).toBeLessThanOrEqual(6);
    expect(guide.keyTerms?.map((t) => t.term)).toContain("Sparse Segment Tree");
  });

  it("should handle single range element", () => {
    const steps = generateDynamicSegmentTreeSteps({
      rangeMin: 1,
      rangeMax: 1,
      operations: [{ type: "update", index: 1, value: 42 }],
    });
    expect(steps.length).toBeGreaterThan(0);
  });

  it("provides 3 typed examples (basic, complex, negative) that generate steps without errors", () => {
    expect(dynamicSegmentTree.examples).toHaveLength(3);
    expect(dynamicSegmentTree.examples?.map((ex) => ex.kind)).toEqual([
      "basic",
      "complex",
      "negative",
    ]);

    for (const example of dynamicSegmentTree.examples!) {
      const steps = dynamicSegmentTree.generateSteps(
        example.input as {
          rangeMin: number;
          rangeMax: number;
          operations: {
            type: "update" | "query";
            index?: number;
            value?: number;
            left?: number;
            right?: number;
          }[];
        },
      );
      expect(steps.length).toBeGreaterThan(0);
    }
  });
});
