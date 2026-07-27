import { describe, it, expect } from "vitest";
import { multiTreeAdditiveEnsemblePredictor } from "./multiTreeAdditiveEnsemblePredictor";

describe("multiTreeAdditiveEnsemblePredictor", () => {
  it("should have valid metadata", () => {
    expect(multiTreeAdditiveEnsemblePredictor.id).toBeDefined();
    expect(multiTreeAdditiveEnsemblePredictor.title).toBeDefined();
    expect(multiTreeAdditiveEnsemblePredictor.code).toBeDefined();
    expect(multiTreeAdditiveEnsemblePredictor.examples?.length).toBeGreaterThan(0);
  });

  it("should generate valid steps", () => {
    const steps = multiTreeAdditiveEnsemblePredictor.generateSteps(
      multiTreeAdditiveEnsemblePredictor.defaultInput,
    );
    expect(steps.length).toBeGreaterThan(0);
    expect(steps[0].primarySnapshot.kind).toBeDefined();
    expect(steps[steps.length - 1].primarySnapshot.kind).toBeDefined();
  });
});
