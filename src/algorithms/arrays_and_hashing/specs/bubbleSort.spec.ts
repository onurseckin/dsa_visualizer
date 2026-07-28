import { describe, expect, it } from "vitest";
import { bubbleSort, generateBubbleSortSteps } from "../bubbleSort";
import type { ArrayVisualSnapshot } from "../../../types/dsa";
import { requireExampleInputs } from "../../specs/assertions";

describe("bubbleSort algorithm spec", () => {
  it("should have correct algorithm metadata", () => {
    expect(bubbleSort.id).toBe("bubble-sort");
    expect(bubbleSort.title).toBe("Bubble Sort");
    expect(bubbleSort.topicIds).toContain("arrays_and_hashing");
    expect(bubbleSort.defaultInput).toEqual([5, 2, 8, 1, 4]);
  });

  it("should generate valid steps for default input (>= 20 steps)", () => {
    const steps = generateBubbleSortSteps(bubbleSort.defaultInput);
    expect(steps.length).toBeGreaterThanOrEqual(20);

    const firstStep = steps[0];
    expect(firstStep.stepIndex).toBe(0);
    expect(firstStep.codeLine).toBe(1);
    expect(firstStep.explanation.what).toContain("Initialize");

    const lastStep = steps[steps.length - 1];
    expect(lastStep.codeLine).toBe(7);
    expect(lastStep.explanation.what).toContain("complete");

    const snapshot = lastStep.primarySnapshot as ArrayVisualSnapshot;
    const finalValues = snapshot.elements.map((el) => el.value);
    expect(finalValues).toEqual([1, 2, 4, 5, 8]);

    snapshot.elements.forEach((el) => {
      expect(el.state).toBe("sorted");
    });
  });

  it("should handle single element array", () => {
    const steps = generateBubbleSortSteps([42]);
    expect(steps.length).toBeGreaterThanOrEqual(20);
    const lastStep = steps[steps.length - 1];
    const snapshot = lastStep.primarySnapshot as ArrayVisualSnapshot;
    expect(snapshot.elements.map((el) => el.value)).toEqual([42]);
    expect(snapshot.elements[0].state).toBe("sorted");
  });

  it("should handle empty array", () => {
    const steps = generateBubbleSortSteps([]);
    expect(steps.length).toBeGreaterThanOrEqual(20);
    const lastStep = steps[steps.length - 1];
    const snapshot = lastStep.primarySnapshot as ArrayVisualSnapshot;
    expect(snapshot.elements).toEqual([]);
  });

  it("should handle reverse sorted array", () => {
    const steps = generateBubbleSortSteps([3, 2, 1]);
    expect(steps.length).toBeGreaterThanOrEqual(20);
    const lastStep = steps[steps.length - 1];
    const snapshot = lastStep.primarySnapshot as ArrayVisualSnapshot;
    expect(snapshot.elements.map((el) => el.value)).toEqual([1, 2, 3]);
  });

  it("ensures codeLine is 1-indexed (1..7) for defaultInput and all examples", () => {
    const totalLines = bubbleSort.code.split("\n").length;
    expect(totalLines).toBe(7);
    const inputs = [
      bubbleSort.defaultInput,
      ...requireExampleInputs(bubbleSort, (input): input is typeof bubbleSort.defaultInput =>
        Array.isArray(input),
      ),
    ];
    for (const input of inputs) {
      const steps = generateBubbleSortSteps(input);
      expect(steps.length).toBeGreaterThan(0);
      for (const step of steps) {
        expect(step.codeLine).toBeGreaterThanOrEqual(1);
        expect(step.codeLine).toBeLessThanOrEqual(totalLines);
      }
      const codeLines = new Set(steps.map((s) => s.codeLine));
      expect(codeLines.size).toBeGreaterThan(1);
    }
  });
});

describe("bubbleSort trivia metadata", () => {
  const meta = bubbleSort.trivia;
  const lines = bubbleSort.code.split("\n");

  it("maps every code line in lineExplanations", () => {
    expect(meta?.lineExplanations).toBeDefined();
    for (let lineNum = 1; lineNum <= lines.length; lineNum++) {
      expect(meta?.lineExplanations?.[lineNum]).toBeDefined();
      expect(typeof meta?.lineExplanations?.[lineNum]).toBe("string");
      expect(meta?.lineExplanations?.[lineNum].length).toBeGreaterThan(0);
    }
  });

  it("points skipLines and hints at real, non-empty lines", () => {
    expect(meta).toBeDefined();
    const skipped = meta?.skipLines ?? [];
    const hinted = (meta?.hints ?? []).map((entry) => entry.line);
    expect(hinted.length).toBeGreaterThanOrEqual(2);
    [...skipped, ...hinted].forEach((line) => {
      expect(line).toBeGreaterThanOrEqual(1);
      expect(line).toBeLessThanOrEqual(lines.length);
      expect(lines[line - 1].trim()).not.toBe("");
    });
    hinted.forEach((line) => expect(skipped).not.toContain(line));
  });

  it("never offers a distractor that is actually a correct line", () => {
    const real = new Set(lines.map((line) => line.trim()));
    const distractors = meta?.distractors ?? [];
    expect(distractors.length).toBeGreaterThanOrEqual(3);
    expect(new Set(distractors).size).toBe(distractors.length);
    distractors.forEach((distractor) => {
      expect(real.has(distractor.trim())).toBe(false);
    });
  });
});
