import { describe, expect, it } from "vitest";
import {
  DEFAULT_HNSW_VECTOR_SEARCH_INPUT,
  generateHnswVectorSearchSteps,
  hnswVectorSearch,
} from "../hnswVectorSearch";
import type { GraphVisualSnapshot } from "../../../types/dsa";

describe("hnswVectorSearch algorithm spec", () => {
  it("should have correct ML Infra Level 4 metadata", () => {
    expect(hnswVectorSearch.id).toBe("hnsw-vector-search");
    expect(hnswVectorSearch.isMlInfra).toBe(true);
    expect(hnswVectorSearch.mlInfraLevel).toBe(4);
    expect(hnswVectorSearch.category).toBe("ml_vector_search");
    expect(hnswVectorSearch.defaultInput).toEqual(DEFAULT_HNSW_VECTOR_SEARCH_INPUT);
    expect(hnswVectorSearch.sources).toEqual([
      { type: "ml_infra", kind: "ml_infra", label: "ML Infra Level 4" },
    ]);
  });

  it("should perform 2-layer search and return nearest vector nodes for default input", () => {
    const steps = generateHnswVectorSearchSteps(DEFAULT_HNSW_VECTOR_SEARCH_INPUT);
    expect(steps.length).toBeGreaterThan(0);

    const lastStep = steps[steps.length - 1];
    expect(lastStep.codeLine).toBe(46);
    expect(lastStep.variables.resultCount).toBe(2);
    expect(lastStep.variables.topMatch).toBe("N4");

    const snap = lastStep.primarySnapshot as GraphVisualSnapshot;
    expect(snap.kind).toBe("graph");
    expect(snap.nodes.length).toBe(5);
  });

  it("should expand result set W when efSearch is set to 3", () => {
    const customInput = {
      ...DEFAULT_HNSW_VECTOR_SEARCH_INPUT,
      query: [11, 11] as [number, number],
      efSearch: 3,
    };
    const steps = generateHnswVectorSearchSteps(customInput);
    const lastStep = steps[steps.length - 1];
    expect(lastStep.variables.resultCount).toBe(3);
    expect(lastStep.variables.topMatch).toBe("N0");
  });

  it("should handle single-node graph correctly", () => {
    const singleNodeInput = {
      nodes: [
        {
          id: "N0",
          vector: [10, 10] as [number, number],
          layerNeighbors: { 0: [] },
        },
      ],
      query: [100, 100] as [number, number],
      entryPointId: "N0",
      maxLayer: 0,
      efSearch: 1,
    };
    const steps = generateHnswVectorSearchSteps(singleNodeInput);
    const lastStep = steps[steps.length - 1];
    expect(lastStep.variables.topMatch).toBe("N0");
  });
});

describe("hnswVectorSearch trivia metadata", () => {
  const meta = hnswVectorSearch.trivia;
  const lines = hnswVectorSearch.code.replace(/\s+$/, "").split("\n");

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
