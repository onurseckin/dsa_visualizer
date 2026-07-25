import type {
  AlgorithmDefinition,
  AlgorithmStep,
  TreeNodeItem,
} from '../../types/dsa';

export interface BinaryTreeLcaInput {
  nodes: TreeNodeItem[];
  rootId: string;
  pVal: number;
  qVal: number;
}

export const BINARY_TREE_LCA_CODE = `function lowestCommonAncestor(root, p, q) {
  if (!root || root.val === p || root.val === q) return root;

  const left = lowestCommonAncestor(root.left, p, q);
  const right = lowestCommonAncestor(root.right, p, q);

  if (left && right) return root;
  return left ? left : right;
}`;

export const DEFAULT_BINARY_TREE_LCA_INPUT: BinaryTreeLcaInput = {
  rootId: '3',
  pVal: 5,
  qVal: 1,
  nodes: [
    { id: '3', val: 3, leftId: '5', rightId: '1', state: 'default' },
    { id: '5', val: 5, leftId: '6', rightId: '2', state: 'default' },
    { id: '1', val: 1, leftId: '0', rightId: '8', state: 'default' },
    { id: '6', val: 6, state: 'default' },
    { id: '2', val: 2, leftId: '7', rightId: '4', state: 'default' },
    { id: '0', val: 0, state: 'default' },
    { id: '8', val: 8, state: 'default' },
    { id: '7', val: 7, state: 'default' },
    { id: '4', val: 4, state: 'default' },
  ],
};

export const generateBinaryTreeLcaSteps = (
  input: BinaryTreeLcaInput
): AlgorithmStep[] => {
  const steps: AlgorithmStep[] = [];
  let stepIndex = 0;
  const { nodes, rootId, pVal, qVal } = input;

  const nodeMap = new Map<string, TreeNodeItem>();
  nodes.forEach((n) => nodeMap.set(n.id, n));

  const callStack: string[] = [];
  const visitedSet = new Set<string>();

  const addStep = (
    codeLine: number,
    what: string,
    why: string,
    activeId?: string,
    lcaId?: string,
    extraVars: Record<string, string | number | boolean> = {}
  ) => {
    const updatedNodes: TreeNodeItem[] = nodes.map((node) => {
      let state = node.state || 'default';

      if (lcaId && node.id === lcaId) {
        state = 'sorted';
      } else if (activeId && node.id === activeId) {
        state = 'active';
      } else if (node.val === pVal || node.val === qVal) {
        state = 'compare';
      } else if (visitedSet.has(node.id)) {
        state = 'visited';
      }

      return {
        ...node,
        state,
      };
    });

    steps.push({
      stepIndex: stepIndex++,
      codeLine,
      explanation: { what, why },
      primarySnapshot: {
        kind: 'tree',
        nodes: updatedNodes,
        rootId,
      },
      auxiliaryState: {
        stack: [...callStack],
        visited: Array.from(visitedSet),
      },
      variables: {
        p: pVal,
        q: qVal,
        ...extraVars,
      },
    });
  };

  addStep(
    1,
    `Initialize LCA Search for p=${pVal} and q=${qVal}`,
    `Starting recursive search for Lowest Common Ancestor from rootId '${rootId}'.`
  );

  const recurse = (currentId?: string): string | null => {
    if (!currentId || !nodeMap.has(currentId)) {
      return null;
    }

    const currentNode = nodeMap.get(currentId)!;
    callStack.push(`Node(${currentNode.val})`);
    visitedSet.add(currentId);

    addStep(
      2,
      `Evaluate Node(${currentNode.val})`,
      `Checking if node ${currentNode.val} is null, equals p (${pVal}), or equals q (${qVal}).`,
      currentId,
      undefined,
      { current: currentNode.val }
    );

    if (currentNode.val === pVal || currentNode.val === qVal) {
      addStep(
        2,
        `Node(${currentNode.val}) matches target (${currentNode.val === pVal ? 'p' : 'q'})`,
        `Base case hit. Returning node ${currentNode.val}.`,
        currentId,
        undefined,
        { current: currentNode.val, match: true }
      );
      callStack.pop();
      return currentId;
    }

    // Search Left Subtree
    let leftResult: string | null = null;
    if (currentNode.leftId) {
      addStep(
        4,
        `Recurse into left subtree of Node(${currentNode.val})`,
        `Calling lowestCommonAncestor on left child.`,
        currentId,
        undefined,
        { current: currentNode.val, leftChild: nodeMap.get(currentNode.leftId)?.val ?? 'N/A' }
      );
      leftResult = recurse(currentNode.leftId);
    }

    // Search Right Subtree
    let rightResult: string | null = null;
    if (currentNode.rightId) {
      addStep(
        5,
        `Recurse into right subtree of Node(${currentNode.val})`,
        `Calling lowestCommonAncestor on right child.`,
        currentId,
        undefined,
        { current: currentNode.val, rightChild: nodeMap.get(currentNode.rightId)?.val ?? 'N/A' }
      );
      rightResult = recurse(currentNode.rightId);
    }

    if (leftResult && rightResult) {
      addStep(
        7,
        `Node(${currentNode.val}) receives non-null results from both left and right subtrees!`,
        `p and q are located in different subtrees under Node(${currentNode.val}). Node(${currentNode.val}) is the LCA!`,
        currentId,
        currentId,
        { current: currentNode.val, lcaFound: true }
      );
      callStack.pop();
      return currentId;
    }

    const result = leftResult !== null ? leftResult : rightResult;
    addStep(
      8,
      `Node(${currentNode.val}) returns ${result ? `Node(${nodeMap.get(result)?.val})` : 'null'}`,
      `Bubbling up subtree result.`,
      currentId,
      undefined,
      { current: currentNode.val, returned: result ? (nodeMap.get(result)?.val ?? 'null') : 'null' }
    );

    callStack.pop();
    return result;
  };

  const finalLcaId = recurse(rootId);

  if (finalLcaId) {
    const lcaNode = nodeMap.get(finalLcaId);
    addStep(
      8,
      `LCA Computation Complete!`,
      `The Lowest Common Ancestor of nodes p=${pVal} and q=${qVal} is Node(${lcaNode?.val}).`,
      undefined,
      finalLcaId,
      { lcaVal: lcaNode?.val ?? 'Unknown' }
    );
  } else {
    addStep(
      8,
      `LCA Computation Complete: No Common Ancestor Found`,
      `Neither p nor q was found in the tree.`,
      undefined,
      undefined,
      { lcaVal: 'None' }
    );
  }

  return steps;
};

export const binaryTreeLca: AlgorithmDefinition<BinaryTreeLcaInput> = {
  id: 'binary-tree-lca',
  title: 'Lowest Common Ancestor of a Binary Tree',
  category: 'tree',
  difficulty: 'Medium',
  description:
    'Given a binary tree and two nodes p and q, find the lowest common ancestor (LCA) node in the tree using bottom-up post-order recursion.',
  code: BINARY_TREE_LCA_CODE,
  timeComplexity: {
    best: 'O(N)',
    average: 'O(N)',
    worst: 'O(N)',
  },
  spaceComplexity: 'O(H)',
  defaultInput: DEFAULT_BINARY_TREE_LCA_INPUT,
  generateSteps: generateBinaryTreeLcaSteps,
};
