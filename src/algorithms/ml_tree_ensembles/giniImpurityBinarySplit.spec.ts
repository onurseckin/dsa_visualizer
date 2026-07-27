import { describe, it, expect } from "vitest";
import { giniImpurityBinarySplit } from "./giniImpurityBinarySplit";

describe("giniImpurityBinarySplit", () => {
  it("should have valid metadata", () => {
    expect(giniImpurityBinarySplit.id).toBeDefined();
    expect(giniImpurityBinarySplit.title).toBeDefined();
    expect(giniImpurityBinarySplit.code).toBeDefined();
    expect(giniImpurityBinarySplit.examples?.length).toBeGreaterThan(0);
  });

  it("should generate valid steps", () => {
    const steps = giniImpurityBinarySplit.generateSteps(giniImpurityBinarySplit.defaultInput);
    expect(steps.length).toBeGreaterThan(0);
    expect(steps[0].primarySnapshot.kind).toBeDefined();
    expect(steps[steps.length - 1].primarySnapshot.kind).toBeDefined();
  });
});
