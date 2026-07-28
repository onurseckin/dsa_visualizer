import { describe, it, expect } from "vitest";
import {
  stringHashing,
  generateStringHashingSteps,
  DEFAULT_STRING_HASHING_INPUT,
  type StringHashingInput,
} from "../stringHashing";

describe("stringHashing logic spec", () => {
  it("has correct algorithm metadata", () => {
    expect(stringHashing.id).toBe("string-hashing");
    expect(stringHashing.title).toBe("Polynomial Rolling String Hashing");
    expect(stringHashing.topicIds).toContain("tries_and_strings");
    expect(stringHashing.difficulty).toBe("Medium");
    expect(stringHashing.code).toContain("def string_hashing_search");
  });

  it("ships a comprehensive topic guide and line explanations for trivia", () => {
    const guide = stringHashing.topicGuide;
    expect(guide.overview).toContain("Polynomial Rolling Hashing");
    expect(guide.sections.length).toBeGreaterThanOrEqual(4);
    guide.sections.forEach((section) => {
      expect(section.heading.length).toBeGreaterThan(0);
      expect(section.body.length).toBeGreaterThan(0);
    });

    const trivia = stringHashing.trivia;
    expect(trivia?.lineExplanations).toBeDefined();
    expect(Object.keys(trivia!.lineExplanations!).length).toBe(27);
  });

  it("generates valid steps for default input (>= 20 steps)", () => {
    const steps = generateStringHashingSteps(DEFAULT_STRING_HASHING_INPUT);
    expect(steps.length).toBeGreaterThanOrEqual(20);
    expect(steps[0].stepIndex).toBe(0);

    steps.forEach((step, idx) => {
      expect(step.stepIndex).toBe(idx);
      expect(step.explanation.what).toBeTruthy();
      expect(step.explanation.why).toBeTruthy();
      expect(step.primarySnapshot.kind).toBe("array");
    });

    const lastStep = steps[steps.length - 1];
    expect(lastStep.variables.matchCount).toBe(2);
  });

  it("handles edge case when pattern is not found", () => {
    const input: StringHashingInput = { text: "hello world", pattern: "xyz" };
    const steps = generateStringHashingSteps(input);
    expect(steps.length).toBeGreaterThanOrEqual(20);
    const lastStep = steps[steps.length - 1];
    expect(lastStep.variables.matchCount).toBe(0);
  });

  it("handles edge case when pattern is longer than text", () => {
    const input: StringHashingInput = { text: "abc", pattern: "abcdef" };
    const steps = generateStringHashingSteps(input);
    expect(steps.length).toBeGreaterThan(0);
    const lastStep = steps[steps.length - 1];
    expect(lastStep.variables.matchCount).toBe(0);
  });

  it("ensures step generator is pure and deterministic", () => {
    const steps1 = generateStringHashingSteps(DEFAULT_STRING_HASHING_INPUT);
    const steps2 = generateStringHashingSteps(DEFAULT_STRING_HASHING_INPUT);
    expect(steps1).toEqual(steps2);
  });

  it("provides 3 typed examples that run without error", () => {
    expect(stringHashing.examples).toHaveLength(3);
    for (const example of stringHashing.examples!) {
      const steps = stringHashing.generateSteps(example.input as StringHashingInput);
      expect(steps.length).toBeGreaterThan(0);
    }
  });
});
