import { describe, it, expect } from "vitest";
import { parallelLockFreeBpeEncoder } from "./parallelLockFreeBpeEncoder";
import { requireExampleInputs } from "../specs/assertions";

describe("parallel-lock-free-bpe-encoder", () => {
  it("should be a valid AlgorithmDefinition", () => {
    expect(parallelLockFreeBpeEncoder.id).toBe("parallel-lock-free-bpe-encoder");
    expect(parallelLockFreeBpeEncoder.topicIds).toContain("ml_tokenization");
    expect(parallelLockFreeBpeEncoder.topicIds.some((topicId) => topicId.startsWith("ml_"))).toBe(
      true,
    );
    expect(parallelLockFreeBpeEncoder.topicIds).toContain("ml_tokenization");
  });

  it("generateSteps should return steps for defaultInput", () => {
    const steps = parallelLockFreeBpeEncoder.generateSteps(parallelLockFreeBpeEncoder.defaultInput);
    expect(steps.length).toBeGreaterThan(0);
    expect(steps[0].stepIndex).toBe(0);
  });

  it("generateSteps should handle edge cases cleanly", () => {
    for (const input of requireExampleInputs(
      parallelLockFreeBpeEncoder,
      (value): value is typeof parallelLockFreeBpeEncoder.defaultInput =>
        typeof value === "object" && value !== null,
    )) {
      const steps = parallelLockFreeBpeEncoder.generateSteps(input);
      expect(steps.length).toBeGreaterThan(0);
      expect(steps[0].stepIndex).toBe(0);
    }
  });
});
