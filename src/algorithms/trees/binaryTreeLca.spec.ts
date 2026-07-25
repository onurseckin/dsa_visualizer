import { describe, expect, it } from 'vitest';
import {
  binaryTreeLca,
  DEFAULT_BINARY_TREE_LCA_INPUT,
  generateBinaryTreeLcaSteps,
} from './binaryTreeLca';
import type { TreeVisualSnapshot } from '../../types/dsa';

describe('binaryTreeLca algorithm spec', () => {
  it('should have valid definition metadata', () => {
    expect(binaryTreeLca.id).toBe('binary-tree-lca');
    expect(binaryTreeLca.title).toBe('Lowest Common Ancestor of a Binary Tree');
    expect(binaryTreeLca.category).toBe('tree');
    expect(binaryTreeLca.difficulty).toBe('Medium');
    expect(binaryTreeLca.defaultInput).toEqual(DEFAULT_BINARY_TREE_LCA_INPUT);
  });

  it('should generate steps and find LCA of nodes 5 and 1 as node 3', () => {
    const steps = generateBinaryTreeLcaSteps(DEFAULT_BINARY_TREE_LCA_INPUT);
    expect(steps.length).toBeGreaterThan(0);

    const firstStep = steps[0];
    expect(firstStep.codeLine).toBe(1);
    expect(firstStep.variables.p).toBe(5);
    expect(firstStep.variables.q).toBe(1);

    const lastStep = steps[steps.length - 1];
    expect(lastStep.variables.lcaVal).toBe(3);

    const snapshot = lastStep.primarySnapshot as TreeVisualSnapshot;
    expect(snapshot.kind).toBe('tree');
    expect(snapshot.nodes).toHaveLength(9);

    const lcaNode = snapshot.nodes.find((n) => n.id === '3');
    expect(lcaNode?.state).toBe('sorted');
  });

  it('should find LCA when one node is the ancestor of the other', () => {
    const input = {
      ...DEFAULT_BINARY_TREE_LCA_INPUT,
      pVal: 5,
      qVal: 4,
    };
    const steps = generateBinaryTreeLcaSteps(input);
    const lastStep = steps[steps.length - 1];

    expect(lastStep.variables.lcaVal).toBe(5);
  });

  it('should handle small binary tree', () => {
    const input = {
      rootId: '10',
      pVal: 20,
      qVal: 30,
      nodes: [
        { id: '10', val: 10, leftId: '20', rightId: '30', state: 'default' as const },
        { id: '20', val: 20, state: 'default' as const },
        { id: '30', val: 30, state: 'default' as const },
      ],
    };
    const steps = generateBinaryTreeLcaSteps(input);
    const lastStep = steps[steps.length - 1];

    expect(lastStep.variables.lcaVal).toBe(10);
  });
});
