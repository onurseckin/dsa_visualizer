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

export const BINARY_TREE_LCA_CODE = `def lowest_common_ancestor(root, p, q):
    if not root or root.val == p or root.val == q:
        return root

    left = lowest_common_ancestor(root.left, p, q)
    right = lowest_common_ancestor(root.right, p, q)

    if left and right:
        return root
    return left if left else right`;

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
    `Initialize Lowest Common Ancestor (LCA) search for p = ${pVal} and q = ${qVal}`,
    `Begin post-order depth-first search (DFS) starting from root node '${rootId}'.`,
    undefined,
    undefined,
    { p: pVal, q: qVal }
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
      `Evaluate Node(${currentNode.val}) against null/target checks`,
      `Check if Node(${currentNode.val}) is null, or equals target p (${pVal}) or q (${qVal}).`,
      currentId,
      undefined,
      { current: currentNode.val }
    );

    if (currentNode.val === pVal || currentNode.val === qVal) {
      addStep(
        3,
        `Base case met: Node(${currentNode.val}) matches target ${currentNode.val === pVal ? 'p' : 'q'} (${currentNode.val})`,
        `Return Node(${currentNode.val}) up the call stack to signal target discovery.`,
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
        5,
        `Recurse into left subtree of Node(${currentNode.val})`,
        `Call lowest_common_ancestor on left child Node(${nodeMap.get(currentNode.leftId)?.val}).`,
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
        6,
        `Recurse into right subtree of Node(${currentNode.val})`,
        `Call lowest_common_ancestor on right child Node(${nodeMap.get(currentNode.rightId)?.val}).`,
        currentId,
        undefined,
        { current: currentNode.val, rightChild: nodeMap.get(currentNode.rightId)?.val ?? 'N/A' }
      );
      rightResult = recurse(currentNode.rightId);
    }

    if (leftResult && rightResult) {
      addStep(
        8,
        `LCA Found: Node(${currentNode.val}) received non-null returns from both subtrees!`,
        `Since p (${pVal}) and q (${qVal}) reside in separate subtrees under Node(${currentNode.val}), Node(${currentNode.val}) is the Lowest Common Ancestor!`,
        currentId,
        currentId,
        { current: currentNode.val, lcaFound: true }
      );
      callStack.pop();
      return currentId;
    }

    const result = leftResult !== null ? leftResult : rightResult;
    addStep(
      10,
      `Node(${currentNode.val}) returns ${result ? `Node(${nodeMap.get(result)?.val})` : 'None'} up the stack`,
      `Propagate non-null subtree result upward (or None if neither subtree contained p or q).`,
      currentId,
      undefined,
      { current: currentNode.val, returned: result ? (nodeMap.get(result)?.val ?? 'None') : 'None' }
    );

    callStack.pop();
    return result;
  };

  const finalLcaId = recurse(rootId);

  if (finalLcaId) {
    const lcaNode = nodeMap.get(finalLcaId);
    addStep(
      10,
      `LCA Search Complete!`,
      `The Lowest Common Ancestor of nodes p = ${pVal} and q = ${qVal} is Node(${lcaNode?.val}).`,
      undefined,
      finalLcaId,
      { lcaVal: lcaNode?.val ?? 'Unknown' }
    );
  } else {
    addStep(
      10,
      `LCA Search Complete: No Common Ancestor Found`,
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
  category: 'tree_fundamentals',
  difficulty: 'Medium',
  description:
    'Given a binary tree and two nodes p and q, find the lowest common ancestor (LCA) node in the tree using bottom-up post-order recursion.',
  constraints: [
    'The number of nodes in the tree is in the range [2, 10^5].',
    '-10^9 <= Node.val <= 10^9',
    'All Node.val are unique.',
    'p != q',
    'p and q will exist in the tree.',
  ],
  examples: [
    {
      input: 'root = [3,5,1,6,2,0,8,null,null,7,4], p = 5, q = 1',
      output: '3',
      explanation: 'The LCA of nodes 5 and 1 is 3.',
    },
    {
      input: 'root = [3,5,1,6,2,0,8,null,null,7,4], p = 5, q = 4',
      output: '5',
      explanation: 'The LCA of nodes 5 and 4 is 5, since a node can be a descendant of itself according to the LCA definition.',
    },
  ],
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
