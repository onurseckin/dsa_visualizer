import { describe, it, expect } from "vitest";
import {
  ringAllgatherVectorReconstructor,
  RINGALLGATHERVECTORRECONSTRUCTOR_CODE,
  DEFAULT_RINGALLGATHERVECTORRECONSTRUCTOR_INPUT,
  generateRingAllgatherVectorReconstructorSteps,
} from "./ringAllgatherVectorReconstructor";

describe("ring-allgather-vector-reconstructor (Ring All-Gather Phase Vector Reconstructor)", () => {
  it("should have correct metadata", () => {
    expect(ringAllgatherVectorReconstructor.id).toBe("ring-allgather-vector-reconstructor");
    expect(
      ringAllgatherVectorReconstructor.topicIds.some((topicId) => topicId.startsWith("ml_")),
    ).toBe(true);
    expect(ringAllgatherVectorReconstructor.topicIds).toContain("ml_distributed_systems");
    expect(ringAllgatherVectorReconstructor.topicIds).toContain("ml_distributed_systems");
  });

  it("should generate >= 20 algorithm steps", () => {
    const steps = generateRingAllgatherVectorReconstructorSteps(
      DEFAULT_RINGALLGATHERVECTORRECONSTRUCTOR_INPUT,
    );
    expect(steps.length).toBeGreaterThanOrEqual(20);
    expect(steps[0].explanation.what).toContain("Enter ring_allgather_vector_reconstructor");
    expect(steps[steps.length - 1].explanation.what).toBe(
      "Return Reconstructed Global Vectors List",
    );
  });

  it("should have lineExplanations mapping every code line", () => {
    const codeLines = RINGALLGATHERVECTORRECONSTRUCTOR_CODE.trimEnd().split("\n").length;
    const explanations = ringAllgatherVectorReconstructor.trivia?.lineExplanations || {};
    expect(Object.keys(explanations).length).toBe(codeLines);
    for (let i = 1; i <= codeLines; i++) {
      expect(explanations[i]).toBeDefined();
    }
  });
});
