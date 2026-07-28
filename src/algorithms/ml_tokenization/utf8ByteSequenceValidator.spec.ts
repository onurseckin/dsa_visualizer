import { describe, it, expect } from "vitest";
import { utf8ByteSequenceValidator, generateUtf8ValidatorSteps } from "./utf8ByteSequenceValidator";

describe("utf8-byte-sequence-validator", () => {
  it("should be a valid AlgorithmDefinition", () => {
    expect(utf8ByteSequenceValidator.id).toBe("utf8-byte-sequence-validator");
    expect(utf8ByteSequenceValidator.topicIds).toContain("ml_tokenization");
    expect(utf8ByteSequenceValidator.topicIds.some((topicId) => topicId.startsWith("ml_"))).toBe(
      true,
    );
    expect(utf8ByteSequenceValidator.topicIds).toContain("ml_tokenization");
  });

  it("generateSteps should handle valid ASCII and 4-byte emoji input", () => {
    const steps = generateUtf8ValidatorSteps({
      bytes: [0x68, 0x69, 0xf0, 0x9f, 0x9a, 0x80],
    });
    expect(steps.length).toBeGreaterThan(0);
    const lastStep = steps[steps.length - 1];
    expect(lastStep.variables.isValid).toBe(true);
    expect(lastStep.primarySnapshot.kind).toBe("array");
  });

  it("generateSteps should handle valid 2-byte and 3-byte sequences", () => {
    // 2-byte: 0xC3 0x9C ('Ü'), 3-byte: 0xE2 0x82 0xAC ('€')
    const steps = generateUtf8ValidatorSteps({
      bytes: [0xc3, 0x9c, 0xe2, 0x82, 0xac],
    });
    expect(steps.length).toBeGreaterThan(0);
    const lastStep = steps[steps.length - 1];
    expect(lastStep.variables.isValid).toBe(true);
  });

  it("generateSteps should handle invalid 2-byte, 3-byte, 4-byte, and illegal lead byte", () => {
    // 0xC0 (truncated 2-byte), 0xE0 0x80 (truncated 3-byte), 0xF0 (truncated 4-byte), 0xFF (illegal lead)
    const steps = generateUtf8ValidatorSteps({
      bytes: [0xc0, 0x00, 0xe0, 0x80, 0x00, 0xf0, 0x00, 0xff],
    });
    expect(steps.length).toBeGreaterThan(0);
    const lastStep = steps[steps.length - 1];
    expect(lastStep.variables.isValid).toBe(false);
  });

  it("generateSteps should handle empty input without errors", () => {
    const steps = generateUtf8ValidatorSteps({ bytes: [] });
    expect(steps.length).toBe(2);
    expect(steps[1].variables.isValid).toBe(true);
  });
});
