import { describe, it, expect } from "vitest";
import {
  ringAllgatherVectorReconstructor,
  DEFAULT_RINGALLGATHERVECTORRECONSTRUCTOR_INPUT,
  generateRingAllgatherVectorReconstructorSteps,
} from "./ringAllgatherVectorReconstructor";

describe("ring-allgather-vector-reconstructor (Ring All-Gather Phase Vector Reconstructor)", () => {
  it("should have correct metadata", () => {
    expect(ringAllgatherVectorReconstructor.id).toBe("ring-allgather-vector-reconstructor");
    expect(ringAllgatherVectorReconstructor.isMlInfra).toBe(true);
    expect(ringAllgatherVectorReconstructor.mlInfraLevel).toBe(11);
    expect(ringAllgatherVectorReconstructor.mlInfraCategory).toBe("ml_distributed_systems");
    expect(ringAllgatherVectorReconstructor.categories).toContain("ml_distributed_systems");
  });

  it("should generate valid algorithm steps", () => {
    const steps = generateRingAllgatherVectorReconstructorSteps(
      DEFAULT_RINGALLGATHERVECTORRECONSTRUCTOR_INPUT,
    );
    expect(steps.length).toBeGreaterThan(0);
    expect(steps[0].explanation.what).toContain("Ring All-Gather Phase Vector Reconstructor");
    expect(steps[steps.length - 1].explanation.what).toBe("Execution Complete");
  });
});
