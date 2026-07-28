import { describe, it, expect } from "vitest";
import { hnswMultiLayerProbabilisticGraph } from "./hnswMultiLayerProbabilisticGraph";

describe("hnsw-multi-layer-probabilistic-graph", () => {
  it("should be defined and have correctly populated fields", () => {
    expect(hnswMultiLayerProbabilisticGraph).toBeDefined();
    expect(hnswMultiLayerProbabilisticGraph.id).toBe("hnsw-multi-layer-probabilistic-graph");
    expect(
      hnswMultiLayerProbabilisticGraph.topicIds.some((topicId) => topicId.startsWith("ml_")),
    ).toBe(true);
    expect(hnswMultiLayerProbabilisticGraph.topicIds).toContain("ml_vector_search");
  });

  it("should generate steps successfully", () => {
    const steps = hnswMultiLayerProbabilisticGraph.generateSteps(
      hnswMultiLayerProbabilisticGraph.defaultInput,
    );
    expect(steps.length).toBeGreaterThan(0);
    expect(steps[0].stepIndex).toBe(0);
  });
});
