import { describe, it, expect } from "vitest";
import { ivfPqAsymmetricDistanceComputation } from "./ivfPqAsymmetricDistanceComputation";

describe("ivfPqAsymmetricDistanceComputation", () => {
  it("should be defined and have correctly populated fields", () => {
    expect(ivfPqAsymmetricDistanceComputation).toBeDefined();
    expect(ivfPqAsymmetricDistanceComputation.id).toBe("ivfPqAsymmetricDistanceComputation");
    expect(ivfPqAsymmetricDistanceComputation.isMlInfra).toBe(true);
    expect(ivfPqAsymmetricDistanceComputation.mlInfraLevel).toBe(5);
    expect(ivfPqAsymmetricDistanceComputation.categories).toContain("ml_vector_search");
  });

  it("should generate steps successfully", () => {
    const steps = ivfPqAsymmetricDistanceComputation.generateSteps(ivfPqAsymmetricDistanceComputation.defaultInput);
    expect(steps.length).toBeGreaterThan(0);
    expect(steps[0].stepIndex).toBe(0);
  });
});
