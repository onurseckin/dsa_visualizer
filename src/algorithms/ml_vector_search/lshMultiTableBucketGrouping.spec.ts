import { describe, it, expect } from "vitest";
import { lshMultiTableBucketGrouping } from "./lshMultiTableBucketGrouping";

describe("lsh-multi-table-bucket-grouping", () => {
  it("should be defined and have correctly populated fields", () => {
    expect(lshMultiTableBucketGrouping).toBeDefined();
    expect(lshMultiTableBucketGrouping.id).toBe("lsh-multi-table-bucket-grouping");
    expect(lshMultiTableBucketGrouping.topicIds.some((topicId) => topicId.startsWith("ml_"))).toBe(
      true,
    );
    expect(lshMultiTableBucketGrouping.topicIds).toContain("ml_vector_search");
  });

  it("should generate steps successfully", () => {
    const steps = lshMultiTableBucketGrouping.generateSteps(
      lshMultiTableBucketGrouping.defaultInput,
    );
    expect(steps.length).toBeGreaterThan(0);
    expect(steps[0].stepIndex).toBe(0);
  });
});
