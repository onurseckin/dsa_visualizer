import { describe, it, expect } from "vitest";
import { kmeansCentroidClustering } from "./kmeansCentroidClustering";

describe("kmeans-centroid-clustering", () => {
  it("should be defined and have correctly populated fields", () => {
    expect(kmeansCentroidClustering).toBeDefined();
    expect(kmeansCentroidClustering.id).toBe("kmeans-centroid-clustering");
    expect(kmeansCentroidClustering.topicIds.some((topicId) => topicId.startsWith("ml_"))).toBe(
      true,
    );
    expect(kmeansCentroidClustering.topicIds).toContain("ml_vector_search");
  });

  it("should generate steps successfully", () => {
    const steps = kmeansCentroidClustering.generateSteps(kmeansCentroidClustering.defaultInput);
    expect(steps.length).toBeGreaterThan(0);
    expect(steps[0].stepIndex).toBe(0);
  });
});
