import { describe, it, expect } from "vitest";
import { parallelLockFreeBpeEncoder } from "./parallelLockFreeBpeEncoder";

describe("parallelLockFreeBpeEncoder", () => {
  it("should be a valid AlgorithmDefinition", () => {
    expect(parallelLockFreeBpeEncoder.id).toBe("parallelLockFreeBpeEncoder");
    expect(parallelLockFreeBpeEncoder.category).toBe("ml_tokenization");
    expect(parallelLockFreeBpeEncoder.isMlInfra).toBe(true);
    expect(parallelLockFreeBpeEncoder.mlInfraCategory).toBe("ml_tokenization");
  });

  it("generateSteps should return at least one step for defaultInput", () => {
    const steps = parallelLockFreeBpeEncoder.generateSteps(parallelLockFreeBpeEncoder.defaultInput);
    expect(steps.length).toBeGreaterThan(0);
    expect(steps[0].stepIndex).toBe(0);
  });
});
