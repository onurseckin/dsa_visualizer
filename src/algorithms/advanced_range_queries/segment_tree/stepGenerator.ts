import type {
  AlgorithmStep,
  ElementState,
  PrimaryVisualSnapshot,
  TreeNodeItem,
} from "../../../types/dsa";
import { createTutorialStep } from "../../../learning/authoring/tutorialSteps";
import type { SegmentTreeInput, InternalNode } from "./types";
import { DEFAULT_SEGMENT_TREE_INPUT } from "./types";

const createIntroSnapshots = (): Array<{
  narrative: string;
  primarySnapshot: PrimaryVisualSnapshot;
}> => [
  {
    narrative:
      "Dynamic range query problems require efficiently computing subsegment aggregations (like range sums, minimums, or maximums) while allowing individual element values to change dynamically.",
    primarySnapshot: {
      kind: "array",
      name: "inputArray",
      elements: [
        { id: "e0", value: 1, state: "default" },
        { id: "e1", value: 3, state: "default" },
        { id: "e2", value: 5, state: "default" },
        { id: "e3", value: 7, state: "default" },
        { id: "e4", value: 9, state: "default" },
        { id: "e5", value: 11, state: "default" },
      ],
    },
  },
  {
    narrative:
      "A standard array allows instantaneous O(1) point updates, but answering any range sum query requires linearly iterating through subsegment elements in O(N) worst-case time.",
    primarySnapshot: {
      kind: "array",
      name: "inputArray",
      elements: [
        { id: "e0", value: 1, state: "active" },
        { id: "e1", value: 3, state: "active" },
        { id: "e2", value: 5, state: "active" },
        { id: "e3", value: 7, state: "active" },
        { id: "e4", value: 9, state: "active" },
        { id: "e5", value: 11, state: "active" },
      ],
    },
  },
  {
    narrative:
      "A static prefix sum array turns range queries into an O(1) subtraction, but updating even a single array element forces recomputing all subsequent prefix sums in O(N) time.",
    primarySnapshot: {
      kind: "array",
      name: "prefixSum",
      elements: [
        { id: "p0", value: 1, state: "visited" },
        { id: "p1", value: 4, state: "visited" },
        { id: "p2", value: 9, state: "visited" },
        { id: "p3", value: 16, state: "visited" },
        { id: "p4", value: 25, state: "visited" },
        { id: "p5", value: 36, state: "visited" },
      ],
    },
  },
  {
    narrative:
      "The Segment Tree resolves this trade-off by organizing array elements into a balanced binary interval tree, guaranteeing logarithmic O(log N) time for both queries and updates.",
    primarySnapshot: {
      kind: "tree",
      rootId: "n1",
      nodes: [
        { id: "n1", val: 36, leftId: "n2", rightId: "n3", state: "default" },
        { id: "n2", val: 9, leftId: "n4", rightId: "n5", state: "default" },
        { id: "n3", val: 27, leftId: "n6", rightId: "n7", state: "default" },
        { id: "n4", val: 4, state: "default" },
        { id: "n5", val: 5, state: "default" },
        { id: "n6", val: 16, state: "default" },
        { id: "n7", val: 11, state: "default" },
      ],
    },
  },
  {
    narrative:
      "In a Segment Tree, the root node represents the complete array range [0..N-1], while child nodes recursively partition intervals in half until leaf nodes represent single elements.",
    primarySnapshot: {
      kind: "tree",
      rootId: "n1",
      nodes: [
        { id: "n1", val: 36, leftId: "n2", rightId: "n3", state: "active" },
        { id: "n2", val: 9, leftId: "n4", rightId: "n5", state: "default" },
        { id: "n3", val: 27, leftId: "n6", rightId: "n7", state: "default" },
        { id: "n4", val: 4, state: "default" },
        { id: "n5", val: 5, state: "default" },
        { id: "n6", val: 16, state: "default" },
        { id: "n7", val: 11, state: "default" },
      ],
    },
  },
  {
    narrative:
      "Each internal node caches the precomputed aggregate sum of its left and right subtrees, building a hierarchical cache over all contiguous intervals.",
    primarySnapshot: {
      kind: "tree",
      rootId: "n1",
      nodes: [
        { id: "n1", val: 36, leftId: "n2", rightId: "n3", state: "visited" },
        { id: "n2", val: 9, leftId: "n4", rightId: "n5", state: "active" },
        { id: "n3", val: 27, leftId: "n6", rightId: "n7", state: "active" },
        { id: "n4", val: 4, state: "default" },
        { id: "n5", val: 5, state: "default" },
        { id: "n6", val: 16, state: "default" },
        { id: "n7", val: 11, state: "default" },
      ],
    },
  },
  {
    narrative:
      "Building the tree executes bottom-up recursion in post-order: leaves pick up element values, and parent nodes merge child values in linear O(N) time.",
    primarySnapshot: {
      kind: "tree",
      rootId: "n1",
      nodes: [
        { id: "n1", val: 36, leftId: "n2", rightId: "n3", state: "default" },
        { id: "n2", val: 9, leftId: "n4", rightId: "n5", state: "visited" },
        { id: "n3", val: 27, leftId: "n6", rightId: "n7", state: "visited" },
        { id: "n4", val: 4, state: "active" },
        { id: "n5", val: 5, state: "active" },
        { id: "n6", val: 16, state: "active" },
        { id: "n7", val: 11, state: "active" },
      ],
    },
  },
  {
    narrative:
      "A point update traverses a single root-to-leaf branch of length O(log N), updating the leaf and recalculating parent aggregates while unwinding recursion.",
    primarySnapshot: {
      kind: "tree",
      rootId: "n1",
      nodes: [
        { id: "n1", val: 37, leftId: "n2", rightId: "n3", state: "swap" },
        { id: "n2", val: 10, leftId: "n4", rightId: "n5", state: "swap" },
        { id: "n3", val: 27, leftId: "n6", rightId: "n7", state: "default" },
        { id: "n4", val: 5, state: "swap" },
        { id: "n5", val: 5, state: "default" },
        { id: "n6", val: 16, state: "default" },
        { id: "n7", val: 11, state: "default" },
      ],
    },
  },
  {
    narrative:
      "Range queries recursively decompose target interval [L, R] into a minimal set of at most O(log N) non-overlapping node segments, skipping disjoint subtrees completely.",
    primarySnapshot: {
      kind: "tree",
      rootId: "n1",
      nodes: [
        { id: "n1", val: 36, leftId: "n2", rightId: "n3", state: "default" },
        { id: "n2", val: 9, leftId: "n4", rightId: "n5", state: "active" },
        { id: "n3", val: 27, leftId: "n6", rightId: "n7", state: "compare" },
        { id: "n4", val: 4, state: "visited" },
        { id: "n5", val: 5, state: "visited" },
        { id: "n6", val: 16, state: "default" },
        { id: "n7", val: 11, state: "default" },
      ],
    },
  },
  {
    narrative:
      "The complete tree is stored compactly in an array of size 4N using standard binary tree indexing where node v has left child 2v and right child 2v+1.",
    primarySnapshot: {
      kind: "array",
      name: "treeArray",
      elements: [
        { id: "t1", value: 36, label: "v=1 [0..5]", state: "active" },
        { id: "t2", value: 9, label: "v=2 [0..2]", state: "default" },
        { id: "t3", value: 27, label: "v=3 [3..5]", state: "default" },
        { id: "t4", value: 4, label: "v=4 [0..1]", state: "default" },
        { id: "t5", value: 5, label: "v=5 [2..2]", state: "default" },
      ],
    },
  },
];

export const generateSegmentTreeSteps = (input?: SegmentTreeInput): AlgorithmStep[] => {
  const steps: AlgorithmStep[] = [];
  let stepIndex = 0;

  for (const intro of createIntroSnapshots()) {
    steps.push(
      createTutorialStep({
        stepIndex: stepIndex++,
        phase: "intro",
        narrative: intro.narrative,
        primarySnapshot: intro.primarySnapshot,
      }),
    );
  }

  const safeInput = input ?? DEFAULT_SEGMENT_TREE_INPUT;
  const rawArray = Array.isArray(safeInput?.array)
    ? safeInput.array
    : DEFAULT_SEGMENT_TREE_INPUT.array;
  const n = rawArray.length;

  if (n === 0) {
    steps.push(
      createTutorialStep({
        stepIndex: stepIndex++,
        phase: "walkthrough",
        narrative: "The input array is empty, so no Segment Tree can be constructed.",
        primarySnapshot: { kind: "tree", nodes: [] },
      }),
    );
    return steps;
  }

  const maxTreeNodes = 4 * n;
  const treeValues = new Array<number>(maxTreeNodes).fill(0);
  const activeNodeMap = new Map<number, InternalNode>();

  const dummyBuild = (node: number, start: number, end: number) => {
    activeNodeMap.set(node, { nodeIdx: node, start, end, val: 0 });
    if (start === end) return;
    const mid = Math.floor((start + end) / 2);
    dummyBuild(2 * node, start, mid);
    dummyBuild(2 * node + 1, mid + 1, end);
  };
  dummyBuild(1, 0, n - 1);

  const getTreeSnapshot = (stateMap?: Record<number, ElementState>): TreeNodeItem[] => {
    const nodes: TreeNodeItem[] = [];
    activeNodeMap.forEach((_, nodeIdx) => {
      const state = stateMap && stateMap[nodeIdx] ? stateMap[nodeIdx] : "default";
      const hasLeft = activeNodeMap.has(2 * nodeIdx);
      const hasRight = activeNodeMap.has(2 * nodeIdx + 1);

      nodes.push({
        id: `node-${nodeIdx}`,
        val: treeValues[nodeIdx],
        leftId: hasLeft ? `node-${2 * nodeIdx}` : undefined,
        rightId: hasRight ? `node-${2 * nodeIdx + 1}` : undefined,
        state,
      });
    });
    return nodes;
  };

  const addWalkthroughStep = (narrative: string, stateMap?: Record<number, ElementState>) => {
    steps.push(
      createTutorialStep({
        stepIndex: stepIndex++,
        phase: "walkthrough",
        narrative,
        primarySnapshot: {
          kind: "tree",
          nodes: getTreeSnapshot(stateMap),
          rootId: "node-1",
        },
      }),
    );
  };

  addWalkthroughStep(
    `Initializing Segment Tree structure for array [${rawArray.join(", ")}] of size ${n}.`,
  );

  const buildTree = (node: number, start: number, end: number) => {
    addWalkthroughStep(`Visiting node ${node} covering interval [${start}..${end}].`, {
      [node]: "compare",
    });

    if (start === end) {
      treeValues[node] = rawArray[start];
      addWalkthroughStep(
        `Reached leaf node ${node} for index ${start}, setting stored value to arr[${start}] = ${treeValues[node]}.`,
        { [node]: "sorted" },
      );
      return;
    }

    const mid = Math.floor((start + end) / 2);
    buildTree(2 * node, start, mid);
    buildTree(2 * node + 1, mid + 1, end);

    treeValues[node] = treeValues[2 * node] + treeValues[2 * node + 1];

    addWalkthroughStep(
      `Merged left subtree sum (${treeValues[2 * node]}) and right subtree sum (${treeValues[2 * node + 1]}) into parent node ${node} [${start}..${end}] = ${treeValues[node]}.`,
      { [node]: "active", [2 * node]: "sorted", [2 * node + 1]: "sorted" },
    );
  };

  buildTree(1, 0, n - 1);

  const allVisitedState: Record<number, ElementState> = {};
  activeNodeMap.forEach((_, idx) => {
    allVisitedState[idx] = "visited";
  });

  addWalkthroughStep(
    `Completed Segment Tree build. The root node 1 caches total array sum ${treeValues[1]}.`,
    allVisitedState,
  );

  const queryTree = (node: number, start: number, end: number, l: number, r: number): number => {
    if (r < start || end < l) {
      addWalkthroughStep(
        `Skipping node ${node} [${start}..${end}] because it is completely outside query range [${l}..${r}].`,
        { [node]: "visited" },
      );
      return 0;
    }

    if (l <= start && end <= r) {
      addWalkthroughStep(
        `Found node ${node} [${start}..${end}] fully contained within query range [${l}..${r}]. Grabbing cached sum ${treeValues[node]}.`,
        { [node]: "sorted" },
      );
      return treeValues[node];
    }

    const mid = Math.floor((start + end) / 2);

    addWalkthroughStep(
      `Node ${node} [${start}..${end}] partially overlaps query range [${l}..${r}]. Splitting query at mid point ${mid}.`,
      { [node]: "compare" },
    );

    const leftSum = queryTree(2 * node, start, mid, l, r);
    const rightSum = queryTree(2 * node + 1, mid + 1, end, l, r);
    const result = leftSum + rightSum;

    addWalkthroughStep(
      `Combined query contributions at node ${node}: left sum ${leftSum} + right sum ${rightSum} = ${result}.`,
      { [node]: "active" },
    );

    return result;
  };

  const updateTree = (node: number, start: number, end: number, idx: number, val: number) => {
    if (start === end) {
      const oldVal = treeValues[node];
      treeValues[node] = val;
      addWalkthroughStep(
        `Updated leaf node ${node} at index ${idx} to value ${val} (previous value was ${oldVal}).`,
        { [node]: "swap" },
      );
      return;
    }

    const mid = Math.floor((start + end) / 2);
    addWalkthroughStep(
      `Descending update path for index ${idx} through node ${node} [${start}..${end}].`,
      { [node]: "compare" },
    );

    if (idx <= mid) {
      updateTree(2 * node, start, mid, idx, val);
    } else {
      updateTree(2 * node + 1, mid + 1, end, idx, val);
    }

    treeValues[node] = treeValues[2 * node] + treeValues[2 * node + 1];

    addWalkthroughStep(
      `Recalculated node ${node} cached sum to ${treeValues[node]} for range [${start}..${end}] after child update.`,
      { [node]: "active" },
    );
  };

  const ops = safeInput.operations ?? [];
  for (const op of ops) {
    if (op.type === "query" && op.left !== undefined && op.right !== undefined) {
      addWalkthroughStep(`Starting range query sum for interval [${op.left}..${op.right}].`, {
        1: "active",
      });

      const totalSum = queryTree(1, 0, n - 1, op.left, op.right);

      addWalkthroughStep(
        `Completed range query sum for [${op.left}..${op.right}], obtaining result ${totalSum}.`,
        { 1: "sorted" },
      );
    } else if (op.type === "update" && op.index !== undefined && op.value !== undefined) {
      addWalkthroughStep(`Starting point update at index ${op.index} with new value ${op.value}.`, {
        1: "active",
      });

      updateTree(1, 0, n - 1, op.index, op.value);

      addWalkthroughStep(
        `Finished update at index ${op.index}. The updated root sum is now ${treeValues[1]}.`,
        { 1: "visited" },
      );
    }
  }

  const finalState: Record<number, ElementState> = {};
  activeNodeMap.forEach((_, nodeIdx) => {
    finalState[nodeIdx] = "sorted";
  });

  addWalkthroughStep(
    "All Segment Tree operations finished successfully. Point updates and range queries executed in O(log N) time.",
    finalState,
  );

  return steps;
};
