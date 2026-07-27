import { describe, expect, it } from "vitest";
import {
  euclidGcd,
  DEFAULT_EUCLID_GCD_INPUT,
  generateEuclidGcdSteps,
  PYTHON_EUCLID_GCD_CODE,
} from "../euclidGcd";
import type { ArrayVisualSnapshot } from "../../../types/dsa";

describe("euclidGcd spec logic", () => {
  it("has category math_and_number_theory and valid metadata", () => {
    expect(euclidGcd.id).toBe("euclid-gcd");
    expect(euclidGcd.category).toBe("math_and_number_theory");
    expect(euclidGcd.defaultInput).toEqual(DEFAULT_EUCLID_GCD_INPUT);
    expect(euclidGcd.code).toBe(PYTHON_EUCLID_GCD_CODE);
  });

  it("ships a topic guide teaching the remainder identity", () => {
    const guide = euclidGcd.topicGuide;
    expect(guide.overview).toContain("greatest common divisor");
    expect(guide.sections.length).toBeGreaterThanOrEqual(4);
    expect(guide.sections.length).toBeLessThanOrEqual(6);
    guide.sections.forEach((section) => {
      expect(section.heading.length).toBeGreaterThan(0);
      expect(section.body.split(". ").length).toBeGreaterThanOrEqual(3);
    });
    expect(guide.keyTerms?.map((t) => t.term)).toContain("Bezout identity");
  });

  it("generates correct steps for Euclidean GCD", () => {
    const steps = generateEuclidGcdSteps(DEFAULT_EUCLID_GCD_INPUT);
    expect(steps.length).toBeGreaterThan(0);
    const lastStep = steps[steps.length - 1];
    const snap = lastStep.primarySnapshot as ArrayVisualSnapshot;
    expect(snap.kind).toBe("array");
    expect(lastStep.variables.gcd).toBe(6);
  });

  it("handles coprime numbers correctly", () => {
    const steps = generateEuclidGcdSteps({ a: 17, b: 13 });
    const lastStep = steps[steps.length - 1];
    expect(lastStep.variables.gcd).toBe(1);
  });

  it("provides 3 typed examples (basic, complex, negative) that generate steps without errors", () => {
    expect(euclidGcd.examples).toHaveLength(3);
    expect(euclidGcd.examples?.map((ex) => ex.kind)).toEqual(["basic", "complex", "negative"]);
    expect(euclidGcd.examples?.map((ex) => ex.title)).toEqual([
      "Basic Example",
      "Complex Edge Case",
      "Failing / Boundary Case",
    ]);

    for (const example of euclidGcd.examples!) {
      const steps = euclidGcd.generateSteps(example.input as { a: number; b: number });
      expect(steps.length).toBeGreaterThan(0);
    }
  });
});
