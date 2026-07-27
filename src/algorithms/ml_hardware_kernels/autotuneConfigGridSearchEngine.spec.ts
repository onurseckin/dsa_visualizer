import { describe, it, expect } from "vitest";
import { autotuneConfigGridSearchEngine } from "./autotuneConfigGridSearchEngine";

describe("autotuneConfigGridSearchEngine", () => {
  it("should have valid metadata", () => {
    expect(autotuneConfigGridSearchEngine.id).toBeDefined();
    expect(autotuneConfigGridSearchEngine.title).toBeDefined();
    expect(autotuneConfigGridSearchEngine.code).toBeDefined();
    expect(autotuneConfigGridSearchEngine.examples?.length).toBeGreaterThan(0);
  });

  it("should generate valid steps", () => {
    const steps = autotuneConfigGridSearchEngine.generateSteps(
      autotuneConfigGridSearchEngine.defaultInput,
    );
    expect(steps.length).toBeGreaterThan(0);
    expect(steps[0].primarySnapshot.kind).toBeDefined();
    expect(steps[steps.length - 1].primarySnapshot.kind).toBeDefined();
  });
});
