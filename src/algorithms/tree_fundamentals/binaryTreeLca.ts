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
    `Initialize bottom-up post-order LCA search for target nodes p = ${pVal} and q = ${qVal}`,
    `Post-order DFS (left, right, root) allows search status to bubble up from leaves to parents. This allows us to pinpoint the exact node where paths from p and q converge.`,
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
      `Evaluate Node(${currentNode.val}) for base-case target matching`,
      `Check if Node(${currentNode.val}) is null or matches target p (${pVal}) or q (${qVal}). If matched, return this node upward immediately.`,
      currentId,
      undefined,
      { current: currentNode.val }
    );

    if (currentNode.val === pVal || currentNode.val === qVal) {
      addStep(
        3,
        `Base case met: Node(${currentNode.val}) matches target ${currentNode.val === pVal ? 'p' : 'q'} (${currentNode.val})`,
        `By returning Node(${currentNode.val}), we inform parent callers that target ${currentNode.val === pVal ? 'p' : 'q'} exists in this subtree branch.`,
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
        `Explore the left branch under Node(${currentNode.val}) to determine if p (${pVal}) or q (${qVal}) resides within it.`,
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
        `Explore the right branch under Node(${currentNode.val}) to locate the remaining target node.`,
        currentId,
        undefined,
        { current: currentNode.val, rightChild: nodeMap.get(currentNode.rightId)?.val ?? 'N/A' }
      );
      rightResult = recurse(currentNode.rightId);
    }

    if (leftResult && rightResult) {
      addStep(
        8,
        `LCA Invariant Triggered! Node(${currentNode.val}) received non-null returns from both subtrees`,
        `Target p (${pVal}) resides in one subtree and target q (${qVal}) in the other. Therefore, Node(${currentNode.val}) is the unique Lowest Common Ancestor!`,
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
      `Node(${currentNode.val}) returns ${result ? `Node(${nodeMap.get(result)?.val})` : 'None'} upward`,
      `Propagate non-null target reference upward to the parent node so it can check if the other target was found in a parallel branch.`,
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
      `LCA Search Complete! Lowest Common Ancestor is Node(${lcaNode?.val})`,
      `The post-order traversal has unwound back to root, confirming Node(${lcaNode?.val}) as the lowest ancestor containing both p (${pVal}) and q (${qVal}).`,
      undefined,
      finalLcaId,
      { lcaVal: lcaNode?.val ?? 'Unknown' }
    );
  } else {
    addStep(
      10,
      `LCA Search Complete: No Common Ancestor Found`,
      `Neither p nor q was present in the binary tree.`,
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
    'Find the lowest common ancestor (LCA) node in a binary tree for two given nodes p and q. The LCA is defined as the lowest node in the tree that has both p and q as descendants (where a node is allowed to be a descendant of itself). Using a bottom-up post-order Depth-First Search (DFS) traversal, the algorithm recursively evaluates left and right subtrees: if both subtrees return non-null matches, the current node is the unique LCA; if only one subtree returns a match, that match is passed upward.',
  constraints: [
    '2 <= Number of nodes N <= 10^5',
    '-10^9 <= Node.val <= 10^9',
    'All Node.val are unique',
    'p != q',
    'Both nodes p and q are guaranteed to exist in the tree',
  ],
  examples: [
    {
      input: 'root = [3,5,1,6,2,0,8,null,null,7,4], p = 5, q = 1',
      output: '3',
      explanation:
        'Node 3 is the root. Target p (5) is the left child and target q (1) is the right child. Because p and q reside in different subtrees of 3, node 3 is the lowest common ancestor.',
    },
    {
      input: 'root = [3,5,1,6,2,0,8,null,null,7,4], p = 5, q = 4',
      output: '5',
      explanation:
        'Target q (4) is a descendant of target p (5). According to the LCA definition, a node can be a descendant of itself, so node 5 is the LCA.',
    },
    {
      input: 'root = [1,2], p = 1, q = 2',
      output: '1',
      explanation:
        'Node 1 is the root and parent of node 2. The lowest common ancestor of parent node 1 and child node 2 is node 1.',
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

