import { describe, it, expect } from "vitest";
import { binarySearchBucketIndex } from "./binarySearchBucketIndex";

describe("binarySearchBucketIndex", () => {
  it("should be defined and have correctly populated fields", () => {
    expect(binarySearchBucketIndex).toBeDefined();
    expect(binarySearchBucketIndex.id).toBe("binarySearchBucketIndex");
    expect(binarySearchBucketIndex.isMlInfra).toBe(true);
    expect(binarySearchBucketIndex.mlInfraLevel).toBe(5);
    expect(binarySearchBucketIndex.categories).toContain("ml_vector_search");
  });

  it("should generate steps successfully", () => {
    const steps = binarySearchBucketIndex.generateSteps(binarySearchBucketIndex.defaultInput);
    expect(steps.length).toBeGreaterThan(0);
    expect(steps[0].stepIndex).toBe(0);
  });
});
