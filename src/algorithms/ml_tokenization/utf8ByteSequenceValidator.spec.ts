import { describe, it, expect } from "vitest";
import { utf8ByteSequenceValidator } from "./utf8ByteSequenceValidator";

describe("utf8ByteSequenceValidator", () => {
  it("should be a valid AlgorithmDefinition", () => {
    expect(utf8ByteSequenceValidator.id).toBe("utf8ByteSequenceValidator");
    expect(utf8ByteSequenceValidator.category).toBe("ml_tokenization");
    expect(utf8ByteSequenceValidator.isMlInfra).toBe(true);
    expect(utf8ByteSequenceValidator.mlInfraCategory).toBe("ml_tokenization");
  });

  it("generateSteps should return at least one step for defaultInput", () => {
    const steps = utf8ByteSequenceValidator.generateSteps(utf8ByteSequenceValidator.defaultInput);
    expect(steps.length).toBeGreaterThan(0);
    expect(steps[0].stepIndex).toBe(0);
  });
});
