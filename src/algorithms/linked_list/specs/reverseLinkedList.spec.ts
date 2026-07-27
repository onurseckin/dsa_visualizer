import { describe, expect, it } from "vitest";
import {
  DEFAULT_REVERSE_LINKED_LIST_INPUT,
  generateReverseLinkedListSteps,
  reverseLinkedList,
} from "../reverseLinkedList";

describe("reverseLinkedList algorithm spec", () => {
  it("should have correct algorithm metadata", () => {
    expect(reverseLinkedList.id).toBe("reverse-linked-list");
    expect(reverseLinkedList.title).toBe("Reverse Linked List");
    expect(reverseLinkedList.category).toBe("linked_list");
    expect(reverseLinkedList.difficulty).toBe("Easy");
    expect(reverseLinkedList.defaultInput).toEqual(DEFAULT_REVERSE_LINKED_LIST_INPUT);
  });

  it("should generate at least 20 steps and reverse default linked list input", () => {
    const steps = generateReverseLinkedListSteps(DEFAULT_REVERSE_LINKED_LIST_INPUT);
    expect(steps.length).toBeGreaterThanOrEqual(20);

    const firstStep = steps[0];
    expect(firstStep.stepIndex).toBe(0);
    expect(firstStep.codeLine).toBe(1);

    const lastStep = steps[steps.length - 1];
    expect(lastStep.codeLine).toBe(9);
    expect(lastStep.variables.newHead).toBe(6);

    expect(lastStep.primarySnapshot.kind).toBe("array");
    if (lastStep.primarySnapshot.kind === "array") {
      expect(lastStep.primarySnapshot.elements).toHaveLength(6);
      lastStep.primarySnapshot.elements.forEach((el) => {
        expect(el.state).toBe("sorted");
      });
    }
  });

  it("should map every code line in trivia.lineExplanations", () => {
    const codeLines = reverseLinkedList.code.split("\n");
    const lineExplanations = reverseLinkedList.trivia?.lineExplanations;
    expect(lineExplanations).toBeDefined();

    codeLines.forEach((_, index) => {
      const lineNum = index + 1;
      expect(lineExplanations?.[lineNum]).toBeDefined();
      expect(typeof lineExplanations?.[lineNum]).toBe("string");
      expect(lineExplanations?.[lineNum].length).toBeGreaterThan(0);
    });
  });

  it("should handle single element linked list", () => {
    const input = { nodes: [42] };
    const steps = generateReverseLinkedListSteps(input);
    expect(steps.length).toBeGreaterThan(0);

    const lastStep = steps[steps.length - 1];
    expect(lastStep.variables.newHead).toBe(42);
  });

  it("should handle empty linked list input", () => {
    const input = { nodes: [] };
    const steps = generateReverseLinkedListSteps(input);
    expect(steps.length).toBe(3);
    const lastStep = steps[steps.length - 1];
    expect(lastStep.variables.newHead).toBe("None");
  });
});
