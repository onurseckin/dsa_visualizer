import { describe, it, expect } from "vitest";
import { singleSkipListLayerTraversal } from "./singleSkipListLayerTraversal";

describe("single-skip-list-layer-traversal", () => {
  it("should be defined and have correctly populated fields", () => {
    expect(singleSkipListLayerTraversal).toBeDefined();
    expect(singleSkipListLayerTraversal.id).toBe("single-skip-list-layer-traversal");
    expect(singleSkipListLayerTraversal.topicIds.some((topicId) => topicId.startsWith("ml_"))).toBe(
      true,
    );
    expect(singleSkipListLayerTraversal.topicIds).toContain("ml_vector_search");
  });

  it("should generate steps successfully", () => {
    const steps = singleSkipListLayerTraversal.generateSteps(
      singleSkipListLayerTraversal.defaultInput,
    );
    expect(steps.length).toBeGreaterThan(0);
    expect(steps[0].stepIndex).toBe(0);
  });
});
