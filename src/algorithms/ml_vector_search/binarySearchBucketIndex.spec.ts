import { describe, it, expect } from "vitest";
import { binarySearchBucketIndex } from "./binarySearchBucketIndex";

describe("binary-search-bucket-index", () => {
  it("should be defined and have correctly populated fields", () => {
    expect(binarySearchBucketIndex).toBeDefined();
    expect(binarySearchBucketIndex.id).toBe("binary-search-bucket-index");
    expect(binarySearchBucketIndex.topicIds.some((topicId) => topicId.startsWith("ml_"))).toBe(
      true,
    );
    expect(binarySearchBucketIndex.topicIds).toContain("ml_vector_search");
  });

  it("should have Python code string without comments", () => {
    expect(binarySearchBucketIndex.code).not.toContain("#");
    expect(binarySearchBucketIndex.code).not.toContain('"""');
    expect(binarySearchBucketIndex.code).not.toContain("'''");
  });

  it("should generate steps successfully for default input", () => {
    const steps = binarySearchBucketIndex.generateSteps(binarySearchBucketIndex.defaultInput);
    expect(steps.length).toBeGreaterThan(0);
    expect(steps[0].stepIndex).toBe(0);

    const finalStep = steps[steps.length - 1];
    expect(finalStep.variables?.targetBucket).toBe(3);
    expect(finalStep.primarySnapshot?.kind).toBe("array");
  });

  it("should generate steps for out-of-bounds high query value", () => {
    const steps = binarySearchBucketIndex.generateSteps({
      queryValue: 95.0,
      bucketBoundaries: [10.0, 25.0, 40.0, 55.0, 70.0, 85.0],
    });
    expect(steps.length).toBeGreaterThan(0);
    const finalStep = steps[steps.length - 1];
    expect(finalStep.variables?.targetBucket).toBe(6);
  });

  it("should generate steps for below-minimum query value", () => {
    const steps = binarySearchBucketIndex.generateSteps({
      queryValue: 5.0,
      bucketBoundaries: [10.0, 25.0, 40.0, 55.0, 70.0, 85.0],
    });
    expect(steps.length).toBeGreaterThan(0);
    const finalStep = steps[steps.length - 1];
    expect(finalStep.variables?.targetBucket).toBe(0);
  });
});
