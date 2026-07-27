import { describe, it, expect } from "vitest";
import { flashAttentionBackwardRecomputationEngine } from "./flashAttentionBackwardRecomputationEngine";

describe("flashAttentionBackwardRecomputationEngine", () => {
  it("should have valid metadata", () => {
    expect(flashAttentionBackwardRecomputationEngine.id).toBeDefined();
    expect(flashAttentionBackwardRecomputationEngine.title).toBeDefined();
    expect(flashAttentionBackwardRecomputationEngine.code).toBeDefined();
    expect(flashAttentionBackwardRecomputationEngine.examples?.length).toBeGreaterThan(0);
  });

  it("should generate valid steps", () => {
    const steps = flashAttentionBackwardRecomputationEngine.generateSteps(
      flashAttentionBackwardRecomputationEngine.defaultInput,
    );
    expect(steps.length).toBeGreaterThan(0);
    expect(steps[0].primarySnapshot.kind).toBeDefined();
    expect(steps[steps.length - 1].primarySnapshot.kind).toBeDefined();
  });
});
