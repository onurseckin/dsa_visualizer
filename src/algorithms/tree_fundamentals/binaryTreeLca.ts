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
  topicGuide: {
    overview:
      'The lowest common ancestor of two nodes is the deepest node that has both of them somewhere in its subtree — geometrically, the point where the two root-to-node paths stop being the same path and diverge. The technique that finds it is bottom-up post-order recursion: instead of computing paths and comparing them, every node asks its two children one question, waits for both answers, and combines them into the answer it hands to its own parent. Learning to design a recursive tree function around what it returns upward, rather than around what it does on the way down, unlocks a whole family of tree problems that look unrelated on the surface.',
    sections: [
      {
        heading: 'The one question every node answers',
        body: 'The entire algorithm rests on choosing the right contract for the recursive call, and the contract here is: return a non-null node if this subtree contains p, q, or their lowest common ancestor, and null if it contains none of them. Once you accept that contract for the children, writing the body is almost mechanical, which is why a problem that sounds like it needs parent pointers and path comparison fits in five lines. Notice how little information travels upward — a single node reference, not a path, not a count, not a set — and that frugality is deliberate, because anything more would cost memory at every frame. The hard part of tree recursion is almost never the code; it is deciding what the return value means.',
      },
      {
        heading: 'How the three cases combine',
        body: 'The base case fires when the node is null, in which case there is nothing here, or when the node is p or q, in which case you return it immediately and never look deeper. Otherwise you recurse into the left child, recurse into the right child, and then inspect the two results. If both came back non-null, then one target lives on each side, so their paths split right here and you return the current node as the answer. If exactly one came back non-null you forward it upward unchanged, and if neither did you return null. In the default tree, searching for 5 and 1 under root 3, the left call surfaces 5 and the right call surfaces 1, so node 3 sees two non-null results and reports itself.',
      },
      {
        heading: 'Why what surfaces is the lowest ancestor',
        body: 'Post-order sequencing is doing the real work: a node is only allowed to decide after both of its subtrees have finished reporting, so the decision is always made with complete information about everything below. The two targets each send exactly one signal travelling upward, and those two signals can meet at exactly one node — the deepest node with one target on each side — because above that point they have merged into a single result. Every ancestor higher up therefore sees only one non-null child result and forwards it without claiming the answer, so the node that surfaces at the root is precisely the deepest qualifying one. No deeper node can qualify either, since a node deeper than the meeting point sits inside only one of the two branches and can see at most one target.',
      },
      {
        heading: 'The self-descendant rule and what it hides',
        body: 'The problem defines a node as a descendant of itself, so when q lives inside p\'s subtree the answer is p. The early return at root.val == p is what implements that: you stop the instant you hit p and never discover that q is below, and the result is correct anyway. This shortcut is only safe because the problem guarantees both nodes exist in the tree — drop that guarantee and the same code confidently returns p for a q that is not there at all. If you must handle possibly-absent nodes, you cannot return early; you have to search the full subtree and track how many of the two targets were actually found, then report an answer only when the count reaches two.',
      },
      {
        heading: 'When a different approach is the right one',
        body: 'If the tree is a binary search tree you should not use this at all: compare both target values against the current node and walk down the single branch they agree on, which finds the split point in O(H) with no recursion and no combining. For a single query on a general tree, this post-order walk is the right tool, since any correct method has to be prepared to look at every node. If instead you will answer many queries on the same tree, precompute — binary lifting over ancestor tables, or an Euler tour reduced to a range-minimum query — and pay a one-time linear or log-linear setup for logarithmic or constant answers afterwards. And when nodes carry parent pointers the problem changes character entirely, becoming the "find where two linked lists merge" exercise: climb from both nodes and detect the intersection.',
      },
      {
        heading: 'The family of problems this shape solves',
        body: 'Once you see the pattern of returning a computed value from each subtree and combining it at the parent, you can reuse it directly for subtree sums, for height and the balanced-tree check, for the tree diameter where each node combines its two child depths, and for the maximum path sum where each node returns its best downward chain while updating a global best. Distance between two nodes is a neat follow-up that builds on this very function: depth of p plus depth of q minus twice the depth of their lowest common ancestor. The recurring caution is the same across all of them — on a skewed tree the recursion depth equals the node count, so very deep inputs want an explicit stack or an iterative parent-map formulation instead.',
      },
    ],
    keyTerms: [
      {
        term: 'Ancestor and descendant',
        definition:
          'A node is an ancestor of everything in its subtree, and those nodes are its descendants. By this problem\'s convention a node counts as both an ancestor and a descendant of itself.',
      },
      {
        term: 'Lowest common ancestor',
        definition:
          'Among all nodes that have both targets as descendants, the one furthest from the root. It is unique, and it is exactly where the two root-to-target paths diverge.',
      },
      {
        term: 'Post-order traversal',
        definition:
          'A depth-first order that finishes both children before processing the node itself. It is the traversal to use whenever a node\'s answer depends on its subtrees\' answers.',
      },
      {
        term: 'Recursive contract',
        definition:
          'The promise about what a recursive call returns for any subtree you hand it. Here it is "a target, the answer, or null", and every line of the body is justified by trusting that promise for the children.',
      },
      {
        term: 'Skewed tree',
        definition:
          'A tree that degenerates into a chain, where each node has a single child, so its height equals its node count. It is the worst case for anything whose cost scales with height, including this recursion\'s stack depth.',
      },
    ],
  },
  defaultInput: DEFAULT_BINARY_TREE_LCA_INPUT,
  generateSteps: generateBinaryTreeLcaSteps,
};

