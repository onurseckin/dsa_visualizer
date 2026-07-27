import { describe, it, expect } from "vitest";
import { lshMultiTableBucketGrouping } from "./lshMultiTableBucketGrouping";

describe("lshMultiTableBucketGrouping", () => {
  it("should be defined and have correctly populated fields", () => {
    expect(lshMultiTableBucketGrouping).toBeDefined();
    expect(lshMultiTableBucketGrouping.id).toBe("lshMultiTableBucketGrouping");
    expect(lshMultiTableBucketGrouping.isMlInfra).toBe(true);
    expect(lshMultiTableBucketGrouping.mlInfraLevel).toBe(5);
    expect(lshMultiTableBucketGrouping.categories).toContain("ml_vector_search");
  });

  it("should generate steps successfully", () => {
    const steps = lshMultiTableBucketGrouping.generateSteps(
      lshMultiTableBucketGrouping.defaultInput,
    );
    expect(steps.length).toBeGreaterThan(0);
    expect(steps[0].stepIndex).toBe(0);
  });
});
