import { describe, expect, it } from 'vitest';
import {
  DEFAULT_TRIE_INPUT,
  generateTriePrefixTreeSteps,
  triePrefixTree,
} from '../triePrefixTree';
import type { GraphVisualSnapshot } from '../../../types/dsa';

describe('triePrefixTree algorithm spec', () => {
  it('should have valid definition metadata', () => {
    expect(triePrefixTree.id).toBe('trie-prefix-tree');
    expect(triePrefixTree.title).toBe('Trie (Prefix Tree)');
    expect(triePrefixTree.category).toBe('tries_and_strings');
    expect(triePrefixTree.difficulty).toBe('Medium');
    expect(triePrefixTree.defaultInput).toEqual(DEFAULT_TRIE_INPUT);
  });

  it('should generate steps for word insertions, search, and prefix check', () => {
    const steps = generateTriePrefixTreeSteps(DEFAULT_TRIE_INPUT);
    expect(steps.length).toBeGreaterThan(0);

    const firstStep = steps[0];
    expect(firstStep.codeLine).toBe(8);

    const lastStep = steps[steps.length - 1];
    expect(lastStep.variables.found).toBe(true);
    expect(lastStep.variables.prefix).toBe('ca');

    const snapshot = lastStep.primarySnapshot as GraphVisualSnapshot;
    expect(snapshot.kind).toBe('graph');
    expect(snapshot.nodes.length).toBeGreaterThan(3);

    const rootNode = snapshot.nodes.find((n) => n.id === 'trie-root');
    expect(rootNode).toBeDefined();
    expect(rootNode?.label).toBe('ROOT');
  });

  it('should handle search for non-existent word', () => {
    const input = {
      wordsToInsert: ['apple', 'app'],
      searchWord: 'banana',
      prefixToSearch: 'ban',
    };
    const steps = generateTriePrefixTreeSteps(input);
    const searchFailStep = steps.find(
      (s) => s.variables.operation === 'search' && s.variables.found === false
    );
    expect(searchFailStep).toBeDefined();
  });
});
