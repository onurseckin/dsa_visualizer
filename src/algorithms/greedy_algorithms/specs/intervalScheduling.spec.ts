import { describe, it, expect } from "vitest";
import {
  intervalScheduling,
  generateIntervalSchedulingSteps,
  DEFAULT_INTERVAL_SCHEDULING_INPUT,
} from "../intervalScheduling";

describe("intervalScheduling logic spec", () => {
  it("generates >= 20 steps for default input", () => {
    const steps = generateIntervalSchedulingSteps(DEFAULT_INTERVAL_SCHEDULING_INPUT);
    expect(steps.length).toBeGreaterThanOrEqual(20);

    const firstStep = steps[0];
    expect(firstStep.primarySnapshot.kind).toBe("array");

    const lastStep = steps[steps.length - 1];
    expect(lastStep.explanation.what).toContain("Return");
  });

  it("ships a rich topic guide teaching EFT and exchange arguments", () => {
    const guide = intervalScheduling.topicGuide;
    expect(guide.overview).toContain("Interval Scheduling");
    expect(guide.sections.length).toBeGreaterThanOrEqual(4);
    guide.sections.forEach((section) => {
      expect(section.heading.length).toBeGreaterThan(0);
      expect(section.body.split(". ").length).toBeGreaterThanOrEqual(3);
    });
    expect(guide.keyTerms?.map((t) => t.term)).toContain("Earliest Finish Time (EFT)");
  });

  it("verifies algorithm definition metadata and complete lineExplanations mapping", () => {
    expect(intervalScheduling.id).toBe("interval-scheduling");
    expect(intervalScheduling.topicIds).toContain("greedy_algorithms");
    expect(intervalScheduling.difficulty).toBe("Medium");
    expect(intervalScheduling.code).toContain("def interval_scheduling");

    const lines = intervalScheduling.code.split("\n");
    expect(intervalScheduling.trivia?.lineExplanations).toBeDefined();
    for (let i = 1; i <= lines.length; i++) {
      expect(intervalScheduling.trivia?.lineExplanations?.[i]).toBeDefined();
      expect(typeof intervalScheduling.trivia?.lineExplanations?.[i]).toBe("string");
    }
  });

  it("provides 3 typed examples (basic, complex, negative) that generate steps without errors", () => {
    expect(intervalScheduling.examples).toHaveLength(3);
    expect(intervalScheduling.examples?.map((ex) => ex.kind)).toEqual([
      "basic",
      "complex",
      "negative",
    ]);

    for (const example of intervalScheduling.examples!) {
      const steps = intervalScheduling.generateSteps(
        example.input as { intervals: Array<{ id: string; start: number; end: number }> },
      );
      expect(steps.length).toBeGreaterThan(0);
    }
  });
});
