import { describe, expect, it } from 'vitest';
import {
  huffmanCoding,
  DEFAULT_HUFFMAN_CODING_INPUT,
  generateHuffmanCodingSteps,
  PYTHON_HUFFMAN_CODE,
} from '../huffmanCoding';
import type { TreeVisualSnapshot } from '../../../types/dsa';

describe('huffmanCoding spec logic', () => {
  it('has category greedy_algorithms and valid metadata', () => {
    expect(huffmanCoding.id).toBe('huffman-coding');
    expect(huffmanCoding.title).toBe('Huffman Coding');
    expect(huffmanCoding.category).toBe('greedy_algorithms');
    expect(huffmanCoding.difficulty).toBe('Medium');
    expect(huffmanCoding.defaultInput).toEqual(DEFAULT_HUFFMAN_CODING_INPUT);
    expect(huffmanCoding.code).toBe(PYTHON_HUFFMAN_CODE);
  });

  it('uses Python code representation', () => {
    expect(huffmanCoding.code).toContain('import heapq');
    expect(huffmanCoding.code).toContain('def build_huffman_tree(text):');
    expect(huffmanCoding.code).toContain('class HuffmanNode:');
  });

  it('generates steps for default input "abracadabra"', () => {
    const steps = generateHuffmanCodingSteps(DEFAULT_HUFFMAN_CODING_INPUT);
    expect(steps.length).toBeGreaterThan(0);

    const firstStep = steps[0];
    expect(firstStep.stepIndex).toBe(0);
    expect(firstStep.explanation.what).toContain('abracadabra');

    const lastStep = steps[steps.length - 1];
    expect(lastStep.explanation.what).toContain('complete');
    expect(lastStep.variables.rootFrequency).toBe(11);

    const snapshot = lastStep.primarySnapshot as TreeVisualSnapshot;
    expect(snapshot.kind).toBe('tree');
    expect(snapshot.nodes.length).toBeGreaterThan(0);

    // Verify derived character codes in auxiliary state
    expect(lastStep.auxiliaryState.hashMap).toBeDefined();
    expect(lastStep.auxiliaryState.hashMap?.['code_a']).toBeDefined();
  });

  it('handles custom text input correctly', () => {
    const customInput = { text: 'BCCABBDDAE' };
    const steps = generateHuffmanCodingSteps(customInput);
    expect(steps.length).toBeGreaterThan(0);

    const lastStep = steps[steps.length - 1];
    expect(lastStep.variables.rootFrequency).toBe(10);
  });

  it('handles empty input string gracefully', () => {
    const steps = generateHuffmanCodingSteps({ text: '' });
    expect(steps.length).toBe(1);
    expect(steps[0].variables.textLength).toBe(0);
  });
});
