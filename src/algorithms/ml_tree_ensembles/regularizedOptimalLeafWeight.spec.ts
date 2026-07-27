import { describe, it, expect } from "vitest";
import { regularizedOptimalLeafWeight } from "./regularizedOptimalLeafWeight";

describe("regularizedOptimalLeafWeight", () => {
  it("should have valid metadata", () => {
    expect(regularizedOptimalLeafWeight.id).toBeDefined();
    expect(regularizedOptimalLeafWeight.title).toBeDefined();
    expect(regularizedOptimalLeafWeight.code).toBeDefined();
    expect(regularizedOptimalLeafWeight.examples?.length).toBeGreaterThan(0);
  });

  it("should generate valid steps", () => {
    const steps = regularizedOptimalLeafWeight.generateSteps(
      regularizedOptimalLeafWeight.defaultInput,
    );
    expect(steps.length).toBeGreaterThan(0);
    expect(steps[0].primarySnapshot.kind).toBeDefined();
    expect(steps[steps.length - 1].primarySnapshot.kind).toBeDefined();
  });
});
