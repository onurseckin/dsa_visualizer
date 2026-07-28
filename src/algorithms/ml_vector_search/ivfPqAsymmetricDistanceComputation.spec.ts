import { describe, it, expect } from "vitest";
import { ivfPqAsymmetricDistanceComputation } from "./ivfPqAsymmetricDistanceComputation";

describe("ivf-pq-asymmetric-distance-computation", () => {
  it("should be defined and have correctly populated fields", () => {
    expect(ivfPqAsymmetricDistanceComputation).toBeDefined();
    expect(ivfPqAsymmetricDistanceComputation.id).toBe("ivf-pq-asymmetric-distance-computation");
    expect(
      ivfPqAsymmetricDistanceComputation.topicIds.some((topicId) => topicId.startsWith("ml_")),
    ).toBe(true);
    expect(ivfPqAsymmetricDistanceComputation.topicIds).toContain("ml_vector_search");
  });

  it("should generate steps successfully", () => {
    const steps = ivfPqAsymmetricDistanceComputation.generateSteps(
      ivfPqAsymmetricDistanceComputation.defaultInput,
    );
    expect(steps.length).toBeGreaterThan(0);
    expect(steps[0].stepIndex).toBe(0);
  });
});
