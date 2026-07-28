import { describe, expect, it } from "vitest";
import {
  sievePrimes,
  DEFAULT_SIEVE_INPUT,
  generateSieveSteps,
  PYTHON_SIEVE_CODE,
} from "../sievePrimes";
import type { ArrayVisualSnapshot } from "../../../types/dsa";

describe("sievePrimes spec logic", () => {
  it("has category math_and_number_theory and valid metadata", () => {
    expect(sievePrimes.id).toBe("sieve-primes");
    expect(sievePrimes.title).toBe("Sieve of Eratosthenes");
    expect(sievePrimes.topicIds).toContain("math_and_number_theory");
    expect(sievePrimes.difficulty).toBe("Medium");
    expect(sievePrimes.defaultInput).toEqual(DEFAULT_SIEVE_INPUT);
    expect(sievePrimes.code).toBe(PYTHON_SIEVE_CODE);
  });

  it("ships a topic guide teaching elimination and the square-root bound", () => {
    const guide = sievePrimes.topicGuide;
    expect(guide.overview).toContain("sieve");
    expect(guide.sections.length).toBeGreaterThanOrEqual(4);
    expect(guide.sections.length).toBeLessThanOrEqual(6);
    guide.sections.forEach((section) => {
      expect(section.heading.length).toBeGreaterThan(0);
      expect(section.body.split(". ").length).toBeGreaterThanOrEqual(1);
    });
    expect(guide.keyTerms?.map((t) => t.term)).toContain("Square root bound");
  });

  it("generates valid steps and identifies primes up to default limit 30", () => {
    const steps = generateSieveSteps(DEFAULT_SIEVE_INPUT);
    expect(steps.length).toBeGreaterThan(0);

    const firstStep = steps[0];
    expect(firstStep.stepIndex).toBe(0);
    expect(firstStep.codeLine).toBe(1);

    const lastStep = steps[steps.length - 1];
    expect(lastStep.explanation.what).toContain("Return the list of primes");
    expect(lastStep.variables.primeCount).toBe(10); // 2, 3, 5, 7, 11, 13, 17, 19, 23, 29

    // Check boolean array snapshot in auxiliary state
    expect(lastStep.auxiliaryState.hashMap).toBeDefined();
    expect(lastStep.auxiliaryState.hashMap?.["isPrime[2]"]).toBe("true");
    expect(lastStep.auxiliaryState.hashMap?.["isPrime[4]"]).toBe("false");
    expect(lastStep.auxiliaryState.hashMap?.["isPrime[29]"]).toBe("true");

    const snap = lastStep.primarySnapshot as ArrayVisualSnapshot;
    expect(snap.kind).toBe("array");
  });

  it("handles small limits like 10", () => {
    const steps = generateSieveSteps({ limit: 10 });
    const lastStep = steps[steps.length - 1];
    expect(lastStep.variables.primeCount).toBe(4); // 2, 3, 5, 7

    const snapshot = lastStep.primarySnapshot as ArrayVisualSnapshot;
    expect(snapshot.elements.length).toBe(11);
    expect(snapshot.elements.find((el) => el.id === "num-7")?.state).toBe("sorted");
    expect(snapshot.elements.find((el) => el.id === "num-8")?.state).toBe("visited");
  });

  it("handles limit < 2 cleanly", () => {
    const steps = generateSieveSteps({ limit: 1 });
    expect(steps.length).toBeGreaterThan(0);
    const lastStep = steps[steps.length - 1];
    expect(lastStep.variables.primeCount).toBe(0);
  });

  it("snapshots array elements correctly", () => {
    const steps = generateSieveSteps({ limit: 5 });
    const firstSnapshot = steps[0].primarySnapshot as ArrayVisualSnapshot;
    expect(firstSnapshot.elements.map((el) => el.id)).toEqual([
      "num-0",
      "num-1",
      "num-2",
      "num-3",
      "num-4",
      "num-5",
    ]);
  });

  it("provides 3 typed examples (basic, complex, negative) that generate steps without errors", () => {
    expect(sievePrimes.examples).toHaveLength(3);
    expect(sievePrimes.examples?.map((ex) => ex.kind)).toEqual(["basic", "complex", "negative"]);
    expect(sievePrimes.examples?.map((ex) => ex.title)).toEqual([
      "Basic Example",
      "Complex Edge Case",
      "Failing / Boundary Case",
    ]);

    for (const example of sievePrimes.examples!) {
      const steps = sievePrimes.generateSteps(example.input as { limit: number });
      expect(steps.length).toBeGreaterThan(0);
    }
  });
});
