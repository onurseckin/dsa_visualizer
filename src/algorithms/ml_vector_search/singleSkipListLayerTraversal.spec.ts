import { describe, it, expect } from "vitest";
import { singleSkipListLayerTraversal } from "./singleSkipListLayerTraversal";

describe("singleSkipListLayerTraversal", () => {
  it("should be defined and have correctly populated fields", () => {
    expect(singleSkipListLayerTraversal).toBeDefined();
    expect(singleSkipListLayerTraversal.id).toBe("singleSkipListLayerTraversal");
    expect(singleSkipListLayerTraversal.isMlInfra).toBe(true);
    expect(singleSkipListLayerTraversal.mlInfraLevel).toBe(5);
    expect(singleSkipListLayerTraversal.categories).toContain("ml_vector_search");
  });

  it("should generate steps successfully", () => {
    const steps = singleSkipListLayerTraversal.generateSteps(singleSkipListLayerTraversal.defaultInput);
    expect(steps.length).toBeGreaterThan(0);
    expect(steps[0].stepIndex).toBe(0);
  });
});
