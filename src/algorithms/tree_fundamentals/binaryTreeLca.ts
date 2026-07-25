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
    'Begin the LCA search',
    `We're hunting for the lowest node that has both ${pVal} and ${qVal} beneath it. We'll walk the tree bottom-up, so every parent can ask its two subtrees "did you find one of them?" and combine the answers.`,
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
      `Evaluate node ${currentNode.val}`,
      `We first check whether node ${currentNode.val} is itself one of our targets, ${pVal} or ${qVal}. If it is, we can report it upward right away without searching any deeper.`,
      currentId,
      undefined,
      { current: currentNode.val }
    );

    if (currentNode.val === pVal || currentNode.val === qVal) {
      addStep(
        3,
        `Found target ${currentNode.val === pVal ? 'p' : 'q'} at node ${currentNode.val}`,
        `Node ${currentNode.val} is ${currentNode.val === pVal ? 'p' : 'q'} itself, so we return it straight up. Its parent now knows this subtree contains one of the two targets — and if the other target sits below here, this node is already their ancestor.`,
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
        `Search the left subtree of node ${currentNode.val}`,
        `We ask node ${currentNode.val}'s left branch whether it contains ${pVal} or ${qVal}. Whatever it finds — a target or nothing — comes back to us as a return value.`,
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
        `Search the right subtree of node ${currentNode.val}`,
        `Now the same question goes to the right branch. Once both sides have answered, node ${currentNode.val} has everything it needs to decide what to report.`,
        currentId,
        undefined,
        { current: currentNode.val, rightChild: nodeMap.get(currentNode.rightId)?.val ?? 'N/A' }
      );
      rightResult = recurse(currentNode.rightId);
    }

    if (leftResult && rightResult) {
      addStep(
        8,
        `Node ${currentNode.val} is the answer`,
        `The left subtree returned one target and the right subtree returned the other, so their paths split exactly here. That makes node ${currentNode.val} the lowest common ancestor — no deeper node can see both ${pVal} and ${qVal}.`,
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
      `Node ${currentNode.val} passes ${result ? `node ${nodeMap.get(result)?.val}` : 'nothing'} upward`,
      result
        ? `Only one side found a target, so node ${currentNode.val} simply forwards that answer to its parent. The parent will check whether the other target turns up in its opposite branch.`
        : `Neither subtree found a target below node ${currentNode.val}, so we report nothing and let the search continue elsewhere.`,
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
      `The LCA is node ${lcaNode?.val}`,
      `The recursion has unwound all the way back to the root, and node ${lcaNode?.val} is the lowest point where the paths to ${pVal} and ${qVal} converge. Each node was visited just once along the way.`,
      undefined,
      finalLcaId,
      { lcaVal: lcaNode?.val ?? 'Unknown' }
    );
  } else {
    addStep(
      10,
      'No common ancestor exists',
      'Neither target turned up anywhere in the tree, so there is no ancestor to report.',
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
  complexityAnalysis: {
    time: 'The recursion touches each of the N nodes at most once, and every visit does only constant work: compare the node against p and q, then combine the two child results. Nothing is ever revisited, so the total is O(N). We generally cannot stop early either — until both targets are located, either one could still be hiding in an unexplored subtree.',
    space: "The only memory that grows is the recursion call stack, which gets as deep as the tree's height — O(H). In a balanced tree that is about log N frames; in a degenerate chain it can reach N.",
  },
  defaultInput: DEFAULT_BINARY_TREE_LCA_INPUT,
  generateSteps: generateBinaryTreeLcaSteps,
};

