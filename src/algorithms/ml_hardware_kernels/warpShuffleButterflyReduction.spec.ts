import { describe, it, expect } from "vitest";
import { warpShuffleButterflyReduction } from "./warpShuffleButterflyReduction";

describe("warpShuffleButterflyReduction", () => {
  it("should have valid metadata", () => {
    expect(warpShuffleButterflyReduction.id).toBeDefined();
    expect(warpShuffleButterflyReduction.title).toBeDefined();
    expect(warpShuffleButterflyReduction.code).toBeDefined();
    expect(warpShuffleButterflyReduction.examples?.length).toBeGreaterThan(0);
  });

  it("should generate valid steps", () => {
    const steps = warpShuffleButterflyReduction.generateSteps(
      warpShuffleButterflyReduction.defaultInput,
    );
    expect(steps.length).toBeGreaterThan(0);
    expect(steps[0].primarySnapshot.kind).toBeDefined();
    expect(steps[steps.length - 1].primarySnapshot.kind).toBeDefined();
  });
});
