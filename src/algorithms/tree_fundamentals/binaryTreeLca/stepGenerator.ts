import type {
  AlgorithmStep,
  ElementState,
  PrimaryVisualSnapshot,
  TreeNodeItem,
} from "../../../types/dsa";
import { createTutorialStep } from "../../../learning/authoring/tutorialSteps";

export interface BinaryTreeLcaInput {
  nodes: TreeNodeItem[];
  rootId: string;
  pVal: number;
  qVal: number;
}

export const DEFAULT_BINARY_TREE_LCA_INPUT: BinaryTreeLcaInput = {
  rootId: "3",
  pVal: 5,
  qVal: 1,
  nodes: [
    { id: "3", val: 3, leftId: "5", rightId: "1", state: "default" },
    { id: "5", val: 5, leftId: "6", rightId: "2", state: "default" },
    { id: "1", val: 1, leftId: "0", rightId: "8", state: "default" },
    { id: "6", val: 6, state: "default" },
    { id: "2", val: 2, leftId: "7", rightId: "4", state: "default" },
    { id: "0", val: 0, state: "default" },
    { id: "8", val: 8, state: "default" },
    { id: "7", val: 7, state: "default" },
    { id: "4", val: 4, state: "default" },
  ],
};

const createIntroSnapshots = (): Array<{
  narrative: string;
  primarySnapshot: PrimaryVisualSnapshot;
}> => [
  {
    narrative:
      "The Lowest Common Ancestor (LCA) problem finds the deepest node in a binary tree that has both target nodes p and q as descendants.",
    primarySnapshot: {
      kind: "tree",
      rootId: "3",
      nodes: [
        { id: "3", val: 3, leftId: "5", rightId: "1", state: "default" },
        { id: "5", val: 5, leftId: "6", rightId: "2", state: "compare" },
        { id: "1", val: 1, leftId: "0", rightId: "8", state: "compare" },
        { id: "6", val: 6, state: "default" },
        { id: "2", val: 2, state: "default" },
        { id: "0", val: 0, state: "default" },
        { id: "8", val: 8, state: "default" },
      ],
    },
  },
  {
    narrative:
      "By tree graph theory conventions, a node is allowed to be a descendant of itself; if target node p is an ancestor of target node q, node p is their LCA.",
    primarySnapshot: {
      kind: "tree",
      rootId: "3",
      nodes: [
        { id: "3", val: 3, leftId: "5", rightId: "1", state: "default" },
        { id: "5", val: 5, leftId: "6", rightId: "2", state: "sorted" },
        { id: "1", val: 1, leftId: "0", rightId: "8", state: "default" },
        { id: "6", val: 6, state: "default" },
        { id: "2", val: 2, leftId: "7", rightId: "4", state: "compare" },
        { id: "0", val: 0, state: "default" },
        { id: "8", val: 8, state: "default" },
        { id: "7", val: 7, state: "default" },
        { id: "4", val: 4, state: "default" },
      ],
    },
  },
  {
    narrative:
      "We use a post-order Depth-First Search (DFS) traversal: recursively search left and right subtrees first, then make ancestor decisions on the return path.",
    primarySnapshot: {
      kind: "tree",
      rootId: "3",
      nodes: [
        { id: "3", val: 3, leftId: "5", rightId: "1", state: "active" },
        { id: "5", val: 5, leftId: "6", rightId: "2", state: "compare" },
        { id: "1", val: 1, leftId: "0", rightId: "8", state: "compare" },
        { id: "6", val: 6, state: "default" },
        { id: "2", val: 2, state: "default" },
        { id: "0", val: 0, state: "default" },
        { id: "8", val: 8, state: "default" },
      ],
    },
  },
  {
    narrative:
      "Base Case: if the current node is null or matches either target p or q, we return the current node immediately to report a target match.",
    primarySnapshot: {
      kind: "tree",
      rootId: "3",
      nodes: [
        { id: "3", val: 3, leftId: "5", rightId: "1", state: "visited" },
        { id: "5", val: 5, leftId: "6", rightId: "2", state: "sorted" },
        { id: "1", val: 1, leftId: "0", rightId: "8", state: "compare" },
        { id: "6", val: 6, state: "default" },
        { id: "2", val: 2, state: "default" },
        { id: "0", val: 0, state: "default" },
        { id: "8", val: 8, state: "default" },
      ],
    },
  },
  {
    narrative:
      "Subtree Traversal Contract: left = LCA(root.left, p, q) and right = LCA(root.right, p, q) collect non-null node references returned from each branch.",
    primarySnapshot: {
      kind: "tree",
      rootId: "3",
      nodes: [
        { id: "3", val: 3, leftId: "5", rightId: "1", state: "visited" },
        { id: "5", val: 5, leftId: "6", rightId: "2", state: "swap" },
        { id: "1", val: 1, leftId: "0", rightId: "8", state: "swap" },
        { id: "6", val: 6, state: "default" },
        { id: "2", val: 2, state: "default" },
        { id: "0", val: 0, state: "default" },
        { id: "8", val: 8, state: "default" },
      ],
    },
  },
  {
    narrative:
      "Divergence Decision (left && right): if both left and right return non-null node handles, targets p and q sit in opposite subtrees, making the current node the unique LCA!",
    primarySnapshot: {
      kind: "tree",
      rootId: "3",
      nodes: [
        { id: "3", val: 3, leftId: "5", rightId: "1", state: "active" },
        { id: "5", val: 5, leftId: "6", rightId: "2", state: "swap" },
        { id: "1", val: 1, leftId: "0", rightId: "8", state: "swap" },
        { id: "6", val: 6, state: "default" },
        { id: "2", val: 2, state: "default" },
        { id: "0", val: 0, state: "default" },
        { id: "8", val: 8, state: "default" },
      ],
    },
  },
  {
    narrative:
      "Single Subtree Forwarding: if only one subtree returns non-null, we bubble that result upward to parent frames since it contains both targets.",
    primarySnapshot: {
      kind: "tree",
      rootId: "3",
      nodes: [
        { id: "3", val: 3, leftId: "5", rightId: "1", state: "swap" },
        { id: "5", val: 5, leftId: "6", rightId: "2", state: "visited" },
        { id: "1", val: 1, leftId: "0", rightId: "8", state: "visited" },
        { id: "6", val: 6, state: "default" },
        { id: "2", val: 2, state: "default" },
        { id: "0", val: 0, state: "default" },
        { id: "8", val: 8, state: "default" },
      ],
    },
  },
  {
    narrative:
      "LCA algorithms power Git merge bases (git merge-base), AST scope resolution in compilers, and PyTorch autograd computation graphs in O(N) time and O(H) space.",
    primarySnapshot: {
      kind: "tree",
      rootId: "3",
      nodes: [
        { id: "3", val: 3, leftId: "5", rightId: "1", state: "sorted" },
        { id: "5", val: 5, leftId: "6", rightId: "2", state: "visited" },
        { id: "1", val: 1, leftId: "0", rightId: "8", state: "visited" },
        { id: "6", val: 6, state: "default" },
        { id: "2", val: 2, state: "default" },
        { id: "0", val: 0, state: "default" },
        { id: "8", val: 8, state: "default" },
      ],
    },
  },
];

export const generateBinaryTreeLcaSteps = (input: BinaryTreeLcaInput): AlgorithmStep[] => {
  const steps: AlgorithmStep[] = [];
  let stepIndex = 0;

  const nodes =
    Array.isArray(input?.nodes) && input.nodes.length > 0
      ? input.nodes
      : DEFAULT_BINARY_TREE_LCA_INPUT.nodes;
  const rootId = input?.rootId ?? DEFAULT_BINARY_TREE_LCA_INPUT.rootId;
  const pVal = typeof input?.pVal === "number" ? input.pVal : DEFAULT_BINARY_TREE_LCA_INPUT.pVal;
  const qVal = typeof input?.qVal === "number" ? input.qVal : DEFAULT_BINARY_TREE_LCA_INPUT.qVal;

  const nodeMap = new Map<string, TreeNodeItem>();
  nodes.forEach((n) => nodeMap.set(n.id, n));

  const addStep = (
    narrative: string,
    primarySnapshot: PrimaryVisualSnapshot,
    phase: "intro" | "walkthrough" = "walkthrough",
  ) => {
    steps.push(createTutorialStep({ stepIndex: stepIndex++, phase, narrative, primarySnapshot }));
  };

  const isDefaultTutorialInput =
    !input ||
    (input.rootId === DEFAULT_BINARY_TREE_LCA_INPUT.rootId &&
      input.pVal === DEFAULT_BINARY_TREE_LCA_INPUT.pVal &&
      input.qVal === DEFAULT_BINARY_TREE_LCA_INPUT.qVal &&
      Array.isArray(input.nodes) &&
      input.nodes.length === DEFAULT_BINARY_TREE_LCA_INPUT.nodes.length);

  if (isDefaultTutorialInput) {
    for (const intro of createIntroSnapshots()) {
      addStep(intro.narrative, intro.primarySnapshot, "intro");
    }
  }

  const visitedSet = new Set<string>();

  const makeTreeSnapshot = (
    activeId?: string,
    lcaId?: string,
    activeSubtreeResultId?: string,
    overrideActiveState?: ElementState,
  ): PrimaryVisualSnapshot => {
    const updatedNodes: TreeNodeItem[] = nodes.map((node) => {
      let state: ElementState = node.state || "default";
      if (lcaId && node.id === lcaId) {
        state = "sorted";
      } else if (activeSubtreeResultId && node.id === activeSubtreeResultId) {
        state = "swap";
      } else if (activeId && node.id === activeId) {
        state = overrideActiveState ?? "active";
      } else if (node.val === pVal || node.val === qVal) {
        state = "compare";
      } else if (visitedSet.has(node.id)) {
        state = "visited";
      }

      return { ...node, state };
    });

    return {
      kind: "tree",
      rootId: rootId || "",
      nodes: updatedNodes,
    };
  };

  if (!rootId || !nodeMap.has(rootId)) {
    addStep(
      "The input tree root is null or empty, so no Lowest Common Ancestor can be computed; returning null.",
      {
        kind: "tree",
        rootId: "",
        nodes: [],
      },
    );
    return steps;
  }

  addStep(
    `Having established the mental model, let's now transition to our binary tree searching for LCA of target nodes p = ${pVal} and q = ${qVal}.`,
    makeTreeSnapshot(undefined),
  );

  const recurse = (currentId?: string): string | null => {
    if (!currentId || !nodeMap.has(currentId)) {
      return null;
    }

    const currentNode = nodeMap.get(currentId)!;
    visitedSet.add(currentId);

    addStep(
      `Traverse Node(${currentNode.val}) at index ${currentId}: execute post-order DFS to inspect left and right subtrees for target values p = ${pVal} and q = ${qVal}.`,
      makeTreeSnapshot(currentId),
    );

    if (currentNode.val === pVal || currentNode.val === qVal) {
      addStep(
        `Node(${currentNode.val}) matches target node ${currentNode.val === pVal ? `p=${pVal}` : `q=${qVal}`}! Base case matched; return Node(${currentNode.val}) upward.`,
        makeTreeSnapshot(currentId, undefined, currentId),
      );
      return currentId;
    }

    const leftResult = recurse(currentNode.leftId);
    const rightResult = recurse(currentNode.rightId);

    if (leftResult && rightResult) {
      addStep(
        `Node(${currentNode.val}) receives non-null results from BOTH subtrees (left: Node(${nodeMap.get(leftResult)?.val}), right: Node(${nodeMap.get(rightResult)?.val}))! Node(${currentNode.val}) is the Lowest Common Ancestor!`,
        makeTreeSnapshot(currentId, undefined, currentId),
      );
      return currentId;
    }

    const res = leftResult ?? rightResult;
    if (res) {
      addStep(
        `Node(${currentNode.val}) receives single subtree result Node(${nodeMap.get(res)?.val}): forwarding non-null candidate upward to parent.`,
        makeTreeSnapshot(currentNode.id, undefined, res),
      );
    } else {
      addStep(
        `Node(${currentNode.val}) receives null from both subtrees: neither target p=${pVal} nor q=${qVal} exists in this subtree; returning null upward.`,
        makeTreeSnapshot(currentNode.id, undefined, currentNode.id),
      );
    }

    return res;
  };

  const finalLca = recurse(rootId);
  const finalLcaVal = finalLca ? nodeMap.get(finalLca)?.val : "null";

  addStep(
    `Lowest Common Ancestor search complete! Identified Node(${finalLcaVal}) as the Lowest Common Ancestor for targets p = ${pVal} and q = ${qVal}.`,
    makeTreeSnapshot(undefined, finalLca ?? undefined),
  );

  return steps;
};

export default generateBinaryTreeLcaSteps;
