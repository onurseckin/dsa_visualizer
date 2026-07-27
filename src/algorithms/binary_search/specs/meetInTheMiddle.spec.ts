import { describe, expect, it } from "vitest";
import { meetInTheMiddle, generateMeetInTheMiddleSteps } from "../meetInTheMiddle";
import type { ArrayVisualSnapshot } from "../../../types/dsa";

describe("meetInTheMiddle algorithm spec", () => {
  it("should have correct algorithm metadata", () => {
    expect(meetInTheMiddle.id).toBe("meet-in-the-middle");
    expect(meetInTheMiddle.title).toContain("Meet in the Middle");
    expect(meetInTheMiddle.category).toBe("binary_search");
    expect(meetInTheMiddle.timeComplexity.average).toContain("2^(n/2)");
    expect(meetInTheMiddle.spaceComplexity).toContain("2^(n/2)");
  });

  it("should generate valid steps for default input", () => {
    const steps = generateMeetInTheMiddleSteps(meetInTheMiddle.defaultInput);
    expect(steps.length).toBeGreaterThan(0);

    const firstStep = steps[0];
    expect(firstStep.stepIndex).toBe(0);
    expect(firstStep.primarySnapshot.kind).toBe("array");

    const snapshot = firstStep.primarySnapshot as ArrayVisualSnapshot;
    expect(snapshot.elements).toBeDefined();

    const matchStep = steps.find((s) => s.explanation.what.includes("Found matching pair"));
    expect(matchStep).toBeDefined();
  });

  it("should handle unmatched target", () => {
    const steps = generateMeetInTheMiddleSteps({
      array: [10, 20, 30],
      target: 25,
    });
    expect(steps.length).toBeGreaterThan(0);
    const lastStep = steps[steps.length - 1];
    expect(lastStep.explanation.what).toContain("No combination");
  });

  it("should handle empty array input", () => {
    const steps = generateMeetInTheMiddleSteps({ array: [], target: 0 });
    expect(steps.length).toBe(2);
  });

  it("provides 3 typed examples (basic, complex, negative) that generate steps without errors", () => {
    expect(meetInTheMiddle.examples).toHaveLength(3);
    expect(meetInTheMiddle.examples?.map((ex) => ex.kind)).toEqual(["basic", "complex", "negative"]);

    for (const example of meetInTheMiddle.examples!) {
      const steps = meetInTheMiddle.generateSteps(example.input as { array: number[]; target: number });
      expect(steps.length).toBeGreaterThan(0);
    }
  });
});
