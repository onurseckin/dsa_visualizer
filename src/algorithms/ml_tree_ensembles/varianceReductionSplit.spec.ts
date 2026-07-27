import { describe, it, expect } from "vitest";
import { varianceReductionSplit } from "./varianceReductionSplit";

describe("varianceReductionSplit", () => {
  it("should have valid metadata", () => {
    expect(varianceReductionSplit.id).toBeDefined();
    expect(varianceReductionSplit.title).toBeDefined();
    expect(varianceReductionSplit.code).toBeDefined();
    expect(varianceReductionSplit.examples?.length).toBeGreaterThan(0);
  });

  it("should generate valid steps", () => {
    const steps = varianceReductionSplit.generateSteps(varianceReductionSplit.defaultInput);
    expect(steps.length).toBeGreaterThan(0);
    expect(steps[0].primarySnapshot.kind).toBeDefined();
    expect(steps[steps.length - 1].primarySnapshot.kind).toBeDefined();
  });
});
