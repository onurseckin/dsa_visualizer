import { describe, expect, it } from "vitest";
import {
  persistentSegmentTree,
  generatePersistentSegmentTreeSteps,
} from "../persistentSegmentTree";
import type { TreeVisualSnapshot } from "../../../types/dsa";

describe("persistentSegmentTree algorithm spec", () => {
  it("should have correct algorithm metadata", () => {
    expect(persistentSegmentTree.id).toBe("persistent-segment-tree");
    expect(persistentSegmentTree.title).toContain("Persistent Segment Tree");
    expect(persistentSegmentTree.category).toBe("advanced_range_queries");
    expect(persistentSegmentTree.timeComplexity.average).toBe("O(log n)");
    expect(persistentSegmentTree.spaceComplexity).toBe("O(n + q log n)");
  });

  it("should generate at least 20 steps for default input", () => {
    const steps = generatePersistentSegmentTreeSteps(persistentSegmentTree.defaultInput);
    expect(steps.length).toBeGreaterThanOrEqual(20);

    const firstStep = steps[0];
    expect(firstStep.stepIndex).toBe(0);
    expect(firstStep.primarySnapshot.kind).toBe("tree");

    const snapshot = firstStep.primarySnapshot as TreeVisualSnapshot;
    expect(snapshot.nodes).toBeDefined();
    expect(snapshot.nodes.length).toBeGreaterThan(0);
  });

  it("should map every code line in trivia.lineExplanations", () => {
    const codeLines = persistentSegmentTree.code.split("\n");
    const lineExplanations = persistentSegmentTree.trivia?.lineExplanations;
    expect(lineExplanations).toBeDefined();

    codeLines.forEach((_, index) => {
      const lineNum = index + 1;
      expect(lineExplanations?.[lineNum]).toBeDefined();
      expect(typeof lineExplanations?.[lineNum]).toBe("string");
      expect(lineExplanations?.[lineNum].length).toBeGreaterThan(0);
    });
  });

  it("should teach the topic through a topicGuide with Markdown and LaTeX", () => {
    const guide = persistentSegmentTree.topicGuide;
    expect(guide.overview.length).toBeGreaterThan(120);
    expect(guide.sections.length).toBeGreaterThanOrEqual(4);
    expect(guide.sections.length).toBeLessThanOrEqual(6);

    guide.sections.forEach((section) => {
      expect(section.heading.length).toBeGreaterThan(0);
      expect(section.body.length).toBeGreaterThan(50);
    });

    const allText = [guide.overview, ...guide.sections.map((s) => s.body)].join(" ");
    expect(allText.toLowerCase()).toContain("path");
    expect(allText.toLowerCase()).toContain("version");

    expect(guide.keyTerms?.length).toBeGreaterThanOrEqual(3);
    expect(guide.keyTerms?.length).toBeLessThanOrEqual(6);
    expect(guide.keyTerms?.map((t) => t.term)).toContain("Path Copying");
  });

  it("should handle single element input array", () => {
    const steps = generatePersistentSegmentTreeSteps({
      array: [99],
      operations: [
        { type: "update", version: 0, index: 0, value: 100 },
        { type: "query", version: 0, left: 0, right: 0 },
      ],
    });
    expect(steps.length).toBeGreaterThan(0);
  });

  it("provides 3 typed examples (basic, complex, negative) that generate steps without errors", () => {
    expect(persistentSegmentTree.examples).toHaveLength(3);
    expect(persistentSegmentTree.examples?.map((ex) => ex.kind)).toEqual([
      "basic",
      "complex",
      "negative",
    ]);

    for (const example of persistentSegmentTree.examples!) {
      const steps = persistentSegmentTree.generateSteps(
        example.input as {
          array: number[];
          operations: {
            type: "update" | "query";
            version: number;
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
