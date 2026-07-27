import { describe, it, expect } from "vitest";
import {
  findFirstOccurrence1d,
  DEFAULT_FINDFIRSTOCCURRENCE1D_INPUT,
  generateFindFirstOccurrence1dSteps,
} from "./findFirstOccurrence1d";

describe("find-first-occurrence-1d (Find First Occurrence in 1D Buffer)", () => {
  it("should have correct metadata", () => {
    expect(findFirstOccurrence1d.id).toBe("find-first-occurrence-1d");
    expect(findFirstOccurrence1d.isMlInfra).toBe(true);
    expect(findFirstOccurrence1d.mlInfraLevel).toBe(1);
    expect(findFirstOccurrence1d.mlInfraCategory).toBe("ml_tensor_algebra");
    expect(findFirstOccurrence1d.categories).toContain("ml_tensor_algebra");
  });

  it("should generate valid algorithm steps", () => {
    const steps = generateFindFirstOccurrence1dSteps(DEFAULT_FINDFIRSTOCCURRENCE1D_INPUT);
    expect(steps.length).toBeGreaterThan(0);
    expect(steps[0].explanation.what).toContain("Find First Occurrence in 1D Buffer");
    expect(steps[steps.length - 1].explanation.what).toBe("Execution Complete");
  });
});
