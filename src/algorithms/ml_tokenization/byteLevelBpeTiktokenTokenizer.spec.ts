import { describe, it, expect } from "vitest";
import { byteLevelBpeTiktokenTokenizer } from "./byteLevelBpeTiktokenTokenizer";

describe("byte-level-bpe-tiktoken-tokenizer", () => {
  it("should be a valid AlgorithmDefinition", () => {
    expect(byteLevelBpeTiktokenTokenizer.id).toBe("byte-level-bpe-tiktoken-tokenizer");
    expect(byteLevelBpeTiktokenTokenizer.topicIds).toContain("ml_tokenization");
    expect(
      byteLevelBpeTiktokenTokenizer.topicIds.some((topicId) => topicId.startsWith("ml_")),
    ).toBe(true);
    expect(byteLevelBpeTiktokenTokenizer.topicIds).toContain("ml_tokenization");
  });

  it("should contain python code completely clean of comments", () => {
    const code = byteLevelBpeTiktokenTokenizer.code;
    expect(code).not.toContain("#");
    expect(code).not.toContain('"""');
    expect(code).not.toContain("'''");
    expect(code).not.toContain("//");
  });

  it("generateSteps should execute without runtime errors for defaultInput", () => {
    const steps = byteLevelBpeTiktokenTokenizer.generateSteps(
      byteLevelBpeTiktokenTokenizer.defaultInput,
    );
    expect(steps.length).toBeGreaterThan(0);
    expect(steps[0].stepIndex).toBe(0);

    const codeLines = byteLevelBpeTiktokenTokenizer.code.split("\n");
    for (const step of steps) {
      expect(step.codeLine).toBeGreaterThanOrEqual(1);
      expect(step.codeLine).toBeLessThanOrEqual(codeLines.length);
      expect(step.explanation.what).toBeTruthy();
      expect(step.explanation.why).toBeTruthy();
      expect(step.primarySnapshot.kind).toBe("array");
    }
  });

  it("generateSteps should handle empty ranks (unmerged bytes fallback)", () => {
    const steps = byteLevelBpeTiktokenTokenizer.generateSteps({ text: "hi", ranks: {} });
    expect(steps.length).toBeGreaterThan(0);
    const lastStep = steps[steps.length - 1];
    expect(lastStep.variables.complete).toBe(true);
  });

  it("generateSteps should handle multi-byte Unicode text correctly", () => {
    const steps = byteLevelBpeTiktokenTokenizer.generateSteps({ text: "€", ranks: {} });
    expect(steps.length).toBeGreaterThan(0);
    expect(steps[0].variables.byteCount).toBe(3); // UTF-8 byte count for € is 3
  });
});
