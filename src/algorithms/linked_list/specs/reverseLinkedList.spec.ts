import { describe, expect, it } from 'vitest';
import {
  DEFAULT_REVERSE_LINKED_LIST_INPUT,
  generateReverseLinkedListSteps,
  reverseLinkedList,
} from '../reverseLinkedList';
import type { ArrayVisualSnapshot } from '../../../types/dsa';

describe('reverseLinkedList algorithm spec', () => {
  it('should have correct algorithm metadata', () => {
    expect(reverseLinkedList.id).toBe('reverse-linked-list');
    expect(reverseLinkedList.title).toBe('Reverse Linked List');
    expect(reverseLinkedList.category).toBe('linked_list');
    expect(reverseLinkedList.difficulty).toBe('Easy');
    expect(reverseLinkedList.defaultInput).toEqual(DEFAULT_REVERSE_LINKED_LIST_INPUT);
  });

  it('should generate steps and reverse default linked list input', () => {
    const steps = generateReverseLinkedListSteps(DEFAULT_REVERSE_LINKED_LIST_INPUT);
    expect(steps.length).toBeGreaterThan(0);

    const firstStep = steps[0];
    expect(firstStep.stepIndex).toBe(0);
    expect(firstStep.codeLine).toBe(1);

    const lastStep = steps[steps.length - 1];
    expect(lastStep.codeLine).toBe(9);
    expect(lastStep.variables.newHead).toBe(5);

    const snap = lastStep.primarySnapshot as ArrayVisualSnapshot;
    expect(snap.kind).toBe('array');
    expect(snap.elements).toHaveLength(5);
    snap.elements.forEach((el) => {
      expect(el.state).toBe('sorted');
    });
  });

  it('should handle single element linked list', () => {
    const input = { nodes: [42] };
    const steps = generateReverseLinkedListSteps(input);
    expect(steps.length).toBeGreaterThan(0);

    const lastStep = steps[steps.length - 1];
    expect(lastStep.variables.newHead).toBe(42);
  });

  it('should handle empty linked list input', () => {
    const input = { nodes: [] };
    const steps = generateReverseLinkedListSteps(input);
    expect(steps.length).toBe(3);
    const lastStep = steps[steps.length - 1];
    expect(lastStep.variables.newHead).toBe('None');
  });
});
