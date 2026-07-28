import { describe, expect, it } from "vitest";
import {
  DEFAULT_TOPOLOGICAL_SORT_DAG_INPUT,
  TOPOLOGICAL_SORT_DAG_CODE,
  generateTopologicalSortDagSteps,
  topologicalSortDag,
} from "../topologicalSortDag";
import type { GraphVisualSnapshot } from "../../../types/dsa";

describe("topologicalSortDag algorithm spec", () => {
  it("should have correct ML Infra Level 2 metadata", () => {
    expect(topologicalSortDag.id).toBe("topological-sort-dag");
    expect(topologicalSortDag.topicIds.some((topicId) => topicId.startsWith("ml_"))).toBe(true);
    expect(topologicalSortDag.topicIds).toContain("ml_autograd_dags");
    expect(topologicalSortDag.defaultInput).toEqual(DEFAULT_TOPOLOGICAL_SORT_DAG_INPUT);
    expect(topologicalSortDag.sources).toEqual([
      { type: "ml_infra", kind: "ml_infra", label: "Foundational Math & DSA" },
    ]);
  });

  it("should generate valid topological order for default DAG", () => {
    const steps = generateTopologicalSortDagSteps(DEFAULT_TOPOLOGICAL_SORT_DAG_INPUT);
    expect(steps.length).toBeGreaterThan(0);
    const lastStep = steps[steps.length - 1];
    expect(lastStep.variables.processedCount).toBe(6);

    const snap = lastStep.primarySnapshot as GraphVisualSnapshot;
    expect(snap.kind).toBe("graph");
    expect(snap.nodes.length).toBe(6);
  });

  it("should detect cycle in cyclic graph", () => {
    const cyclicInput = {
      numNodes: 3,
      edges: [[0, 1] as [number, number], [1, 2] as [number, number], [2, 0] as [number, number]],
    };
    const steps = generateTopologicalSortDagSteps(cyclicInput);
    const lastStep = steps[steps.length - 1];
    expect(lastStep.explanation.what).toContain("Cycle detected");
    expect(lastStep.variables.processedCount).toBeLessThan(3);
  });
});

describe("topologicalSortDag trivia metadata", () => {
  const meta = topologicalSortDag.trivia;
  const lines = TOPOLOGICAL_SORT_DAG_CODE.replace(/\s+$/, "").split("\n");

  it("points skipLines and hints at valid lines", () => {
    expect(meta).toBeDefined();
    const skipped = meta?.skipLines ?? [];
    const hinted = (meta?.hints ?? []).map((entry) => entry.line);
    expect(hinted.length).toBeGreaterThanOrEqual(2);
    [...skipped, ...hinted].forEach((line) => {
      expect(line).toBeGreaterThanOrEqual(1);
      expect(line).toBeLessThanOrEqual(lines.length);
    });
  });

  it("never offers a distractor that is actually a correct line", () => {
    const real = new Set(lines.map((line) => line.trim()));
    const distractors = meta?.distractors ?? [];
    expect(distractors.length).toBeGreaterThanOrEqual(3);
    distractors.forEach((distractor) => {
      expect(real.has(distractor.trim())).toBe(false);
    });
  });
});
