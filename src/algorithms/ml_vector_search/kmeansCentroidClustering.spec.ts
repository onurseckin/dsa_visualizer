import { describe, it, expect } from "vitest";
import { kmeansCentroidClustering } from "./kmeansCentroidClustering";

describe("kmeansCentroidClustering", () => {
  it("should be defined and have correctly populated fields", () => {
    expect(kmeansCentroidClustering).toBeDefined();
    expect(kmeansCentroidClustering.id).toBe("kmeansCentroidClustering");
    expect(kmeansCentroidClustering.isMlInfra).toBe(true);
    expect(kmeansCentroidClustering.mlInfraLevel).toBe(5);
    expect(kmeansCentroidClustering.categories).toContain("ml_vector_search");
  });

  it("should generate steps successfully", () => {
    const steps = kmeansCentroidClustering.generateSteps(kmeansCentroidClustering.defaultInput);
    expect(steps.length).toBeGreaterThan(0);
    expect(steps[0].stepIndex).toBe(0);
  });
});
