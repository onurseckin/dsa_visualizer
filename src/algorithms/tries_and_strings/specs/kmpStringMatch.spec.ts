import { describe, expect, it } from "vitest";
import { DEFAULT_KMP_INPUT, generateKmpSteps, kmpStringMatch } from "../kmpStringMatch";
import type { ArrayVisualSnapshot } from "../../../types/dsa";

describe("kmpStringMatch algorithm spec", () => {
  it("should have correct algorithm metadata", () => {
    expect(kmpStringMatch.id).toBe("kmp-string-match");
    expect(kmpStringMatch.title).toBe("KMP String Matching");
    expect(kmpStringMatch.category).toBe("tries_and_strings");
    expect(kmpStringMatch.difficulty).toBe("Hard");
    expect(kmpStringMatch.defaultInput).toEqual(DEFAULT_KMP_INPUT);
  });

  it("should generate valid steps and find matches for default input", () => {
    const steps = generateKmpSteps(DEFAULT_KMP_INPUT);
    expect(steps.length).toBeGreaterThan(0);

    const firstStep = steps[0];
    expect(firstStep.stepIndex).toBe(0);
    expect(firstStep.codeLine).toBe(1);

    const snapshot = firstStep.primarySnapshot as ArrayVisualSnapshot;
    expect(snapshot.kind).toBe("array");

    const lastStep = steps[steps.length - 1];
    expect(lastStep.explanation.what).toContain("Search complete");
    expect(lastStep.variables.matchesCount).toBe(1);

    // Verify AuxiliaryState has LPS / Prefix table
    const lpsStep = steps.find((s) => s.explanation.what.includes("LPS table complete"));
    expect(lpsStep).toBeDefined();
    expect(lpsStep?.auxiliaryState.hashMap).toBeDefined();
    expect(lpsStep?.auxiliaryState.customState?.lps).toBeDefined();
  });

  it("should handle multiple matches in text", () => {
    const steps = generateKmpSteps({ text: "AAAAA", pattern: "AA" });
    const lastStep = steps[steps.length - 1];
    expect(lastStep.variables.matchesCount).toBe(4);
  });

  it("should handle no match scenario", () => {
    const steps = generateKmpSteps({ text: "ABCDEF", pattern: "XYZ" });
    const lastStep = steps[steps.length - 1];
    expect(lastStep.variables.matchesCount).toBe(0);
    expect(lastStep.explanation.what).toContain("complete");
  });

  it("should handle edge case with empty text or pattern", () => {
    const steps = generateKmpSteps({ text: "", pattern: "A" });
    expect(steps.length).toBeGreaterThan(0);
    const lastStep = steps[steps.length - 1];
    expect(lastStep.variables.matchesCount).toBe(0);
  });

  it("should produce correct snapshot element values matching text ASCII codes", () => {
    const text = "TEST";
    const steps = generateKmpSteps({ text, pattern: "ES" });
    const snapshot = steps[0].primarySnapshot as ArrayVisualSnapshot;
    expect(snapshot.elements.map((el) => el.value)).toEqual([
      "T".charCodeAt(0),
      "E".charCodeAt(0),
      "S".charCodeAt(0),
      "T".charCodeAt(0),
    ]);
  });

  it("should handle undefined input parameters and complex LPS fallback", () => {
    const steps1 = generateKmpSteps({
      text: undefined as unknown as string,
      pattern: undefined as unknown as string,
    });
    expect(steps1.length).toBe(4);

    const steps2 = generateKmpSteps({ text: "AAABAAAB", pattern: "AAAB" });
    const lpsStep = steps2.find((s) => s.explanation.what.includes("Fall back to length"));
    expect(lpsStep).toBeDefined();
    expect(steps2.length).toBeGreaterThan(0);
  });
});
