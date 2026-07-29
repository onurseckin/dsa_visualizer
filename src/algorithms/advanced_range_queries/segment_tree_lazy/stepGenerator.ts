import type {
  AlgorithmStep,
  ElementState,
  PrimaryVisualSnapshot,
  TreeNodeItem,
} from "../../../types/dsa";
import { createTutorialStep } from "../../../learning/authoring/tutorialSteps";
import type { SegmentTreeLazyInput, InternalNode } from "./types";
import { DEFAULT_SEGMENT_TREE_LAZY_INPUT } from "./types";

const createIntroSnapshots = (): Array<{
  narrative: string;
  primarySnapshot: PrimaryVisualSnapshot;
}> => [
  {
    narrative:
      "Point updates in a standard Segment Tree take logarithmic time, but updating every element across an arbitrary subsegment [L, R] naively touches up to O(N) leaves, degrading performance.",
    primarySnapshot: {
      kind: "array",
      name: "rawArray",
      elements: [
        { id: "e0", value: 1, state: "active" },
        { id: "e1", value: 2, state: "active" },
        { id: "e2", value: 3, state: "active" },
        { id: "e3", value: 4, state: "active" },
        { id: "e4", value: 5, state: "active" },
      ],
    },
  },
  {
    narrative:
      "Updating individual leaf nodes one by one forces repeated O(log N) traversals, making range updates take linear O(N log N) time in total.",
    primarySnapshot: {
      kind: "tree",
      rootId: "n1",
      nodes: [
        { id: "n1", val: 15, leftId: "n2", rightId: "n3", state: "active" },
        { id: "n2", val: 6, leftId: "n4", rightId: "n5", state: "active" },
        { id: "n3", val: 9, leftId: "n6", rightId: "n7", state: "active" },
        { id: "n4", val: 3, state: "active" },
        { id: "n5", val: 3, state: "active" },
        { id: "n6", val: 4, state: "active" },
        { id: "n7", val: 5, state: "active" },
      ],
    },
  },
  {
    narrative:
      "Lazy Propagation resolves this bottleneck by deferring updates to child subtrees until those specific descendants are accessed by subsequent queries or updates.",
    primarySnapshot: {
      kind: "tree",
      rootId: "n1",
      nodes: [
        { id: "n1", val: 15, leftId: "n2", rightId: "n3", state: "default" },
        { id: "n2", val: 21, leftId: "n4", rightId: "n5", state: "swap" },
        { id: "n3", val: 9, leftId: "n6", rightId: "n7", state: "default" },
        { id: "n4", val: 3, state: "default" },
        { id: "n5", val: 3, state: "default" },
        { id: "n6", val: 4, state: "default" },
        { id: "n7", val: 5, state: "default" },
      ],
    },
  },
  {
    narrative:
      "When a node's range [start..end] is fully enclosed inside update interval [L, R], we update the node's cached sum immediately by adding (count * delta).",
    primarySnapshot: {
      kind: "tree",
      rootId: "n1",
      nodes: [
        { id: "n1", val: 30, leftId: "n2", rightId: "n3", state: "visited" },
        { id: "n2", val: 21, leftId: "n4", rightId: "n5", state: "active" },
        { id: "n3", val: 9, leftId: "n6", rightId: "n7", state: "default" },
        { id: "n4", val: 3, state: "default" },
        { id: "n5", val: 3, state: "default" },
        { id: "n6", val: 4, state: "default" },
        { id: "n7", val: 5, state: "default" },
      ],
    },
  },
  {
    narrative:
      "Instead of descending into its children, we record a deferred tag lazy[node] += delta at the node and prune recursion immediately in O(1) time.",
    primarySnapshot: {
      kind: "tree",
      rootId: "n1",
      nodes: [
        { id: "n1", val: 30, leftId: "n2", rightId: "n3", state: "default" },
        { id: "n2", val: 21, leftId: "n4", rightId: "n5", state: "swap" },
        { id: "n3", val: 9, leftId: "n6", rightId: "n7", state: "default" },
        { id: "n4", val: 3, state: "default" },
        { id: "n5", val: 3, state: "default" },
        { id: "n6", val: 4, state: "default" },
        { id: "n7", val: 5, state: "default" },
      ],
    },
  },
  {
    narrative:
      "Lazy tags represent promised updates owed to descendants: child nodes retain older values until a future traversal explicitly visits them.",
    primarySnapshot: {
      kind: "tree",
      rootId: "n1",
      nodes: [
        { id: "n1", val: 30, leftId: "n2", rightId: "n3", state: "default" },
        { id: "n2", val: 21, leftId: "n4", rightId: "n5", state: "active" },
        { id: "n3", val: 9, leftId: "n6", rightId: "n7", state: "default" },
        { id: "n4", val: 3, state: "compare" },
        { id: "n5", val: 3, state: "compare" },
        { id: "n6", val: 4, state: "default" },
        { id: "n7", val: 5, state: "default" },
      ],
    },
  },
  {
    narrative:
      "Whenever a future query or update visits a node holding a non-zero lazy tag, a pushdown operation transfers the pending delta down to its direct left and right children.",
    primarySnapshot: {
      kind: "tree",
      rootId: "n1",
      nodes: [
        { id: "n1", val: 30, leftId: "n2", rightId: "n3", state: "default" },
        { id: "n2", val: 21, leftId: "n4", rightId: "n5", state: "visited" },
        { id: "n3", val: 9, leftId: "n6", rightId: "n7", state: "default" },
        { id: "n4", val: 13, state: "swap" },
        { id: "n5", val: 8, state: "swap" },
        { id: "n6", val: 4, state: "default" },
        { id: "n7", val: 5, state: "default" },
      ],
    },
  },
  {
    narrative:
      "During pushdown, child cached sums are updated instantly, child lazy tags inherit the delta, and the parent node's lazy tag is cleared back to zero.",
    primarySnapshot: {
      kind: "tree",
      rootId: "n1",
      nodes: [
        { id: "n1", val: 30, leftId: "n2", rightId: "n3", state: "default" },
        { id: "n2", val: 21, leftId: "n4", rightId: "n5", state: "default" },
        { id: "n3", val: 9, leftId: "n6", rightId: "n7", state: "default" },
        { id: "n4", val: 13, state: "visited" },
        { id: "n5", val: 8, state: "visited" },
        { id: "n6", val: 4, state: "default" },
        { id: "n7", val: 5, state: "default" },
      ],
    },
  },
  {
    narrative:
      "Lazy pushdown guarantees that no node ever serves incorrect query answers or stale updates when visited.",
    primarySnapshot: {
      kind: "tree",
      rootId: "n1",
      nodes: [
        { id: "n1", val: 30, leftId: "n2", rightId: "n3", state: "active" },
        { id: "n2", val: 21, leftId: "n4", rightId: "n5", state: "active" },
        { id: "n3", val: 9, leftId: "n6", rightId: "n7", state: "default" },
        { id: "n4", val: 13, state: "active" },
        { id: "n5", val: 8, state: "default" },
        { id: "n6", val: 4, state: "default" },
        { id: "n7", val: 5, state: "default" },
      ],
    },
  },
  {
    narrative:
      "With lazy propagation, both range updates and range queries execute in optimal O(log N) time per operation while using linear O(N) auxiliary space.",
    primarySnapshot: {
      kind: "array",
      name: "lazyArray",
      elements: [
        { id: "l1", value: 0, label: "root lazy", state: "default" },
        { id: "l2", value: 0, label: "left lazy", state: "default" },
        { id: "l3", value: 0, label: "right lazy", state: "default" },
        { id: "l4", value: 5, label: "node 4 lazy", state: "active" },
        { id: "l5", value: 5, label: "node 5 lazy", state: "active" },
      ],
    },
  },
];

export const generateSegmentTreeLazySteps = (input?: SegmentTreeLazyInput): AlgorithmStep[] => {
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

  const safeInput = input ?? DEFAULT_SEGMENT_TREE_LAZY_INPUT;
  const rawArray = Array.isArray(safeInput?.array)
    ? safeInput.array
    : DEFAULT_SEGMENT_TREE_LAZY_INPUT.array;
  const n = rawArray.length;

  if (n === 0) {
    steps.push(
      createTutorialStep({
        stepIndex: stepIndex++,
        phase: "walkthrough",
        narrative:
          "The input array is empty, so no Segment Tree with Lazy Propagation can be built.",
        primarySnapshot: { kind: "tree", nodes: [] },
      }),
    );
    return steps;
  }

  const maxTreeNodes = 4 * n;
  const treeValues = new Array<number>(maxTreeNodes).fill(0);
  const lazyValues = new Array<number>(maxTreeNodes).fill(0);
  const activeNodeMap = new Map<number, InternalNode>();

  const dummyBuild = (node: number, start: number, end: number) => {
    activeNodeMap.set(node, { nodeIdx: node, start, end });
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
    `Initializing Segment Tree with Lazy Propagation for array [${rawArray.join(", ")}] of size ${n}.`,
  );

  const buildTree = (node: number, start: number, end: number) => {
    addWalkthroughStep(`Visiting node ${node} covering interval [${start}..${end}].`, {
      [node]: "compare",
    });

    if (start === end) {
      treeValues[node] = rawArray[start];
      addWalkthroughStep(
        `Leaf node ${node} at index ${start} assigned initial value ${treeValues[node]}.`,
        { [node]: "sorted" },
      );
      return;
    }

    const mid = Math.floor((start + end) / 2);
    buildTree(2 * node, start, mid);
    buildTree(2 * node + 1, mid + 1, end);

    treeValues[node] = treeValues[2 * node] + treeValues[2 * node + 1];

    addWalkthroughStep(
      `Computed node ${node} sum: left child sum (${treeValues[2 * node]}) + right child sum (${treeValues[2 * node + 1]}) = ${treeValues[node]}.`,
      { [node]: "active", [2 * node]: "sorted", [2 * node + 1]: "sorted" },
    );
  };

  buildTree(1, 0, n - 1);

  const pushLazy = (node: number, start: number, end: number) => {
    if (lazyValues[node] !== 0) {
      const val = lazyValues[node];
      treeValues[node] += (end - start + 1) * val;

      if (start !== end) {
        lazyValues[2 * node] += val;
        lazyValues[2 * node + 1] += val;
      }
      lazyValues[node] = 0;

      addWalkthroughStep(
        `Pushed down pending lazy tag (${val}) from node ${node} [${start}..${end}]. New node sum = ${treeValues[node]}.`,
        { [node]: "swap", [2 * node]: "active", [2 * node + 1]: "active" },
      );
    }
  };

  const updateRange = (
    node: number,
    start: number,
    end: number,
    l: number,
    r: number,
    val: number,
  ) => {
    pushLazy(node, start, end);

    if (r < start || end < l) {
      addWalkthroughStep(
        `Node ${node} [${start}..${end}] does not overlap update range [${l}..${r}]. Pruning branch.`,
        { [node]: "visited" },
      );
      return;
    }

    if (l <= start && end <= r) {
      treeValues[node] += (end - start + 1) * val;
      if (start !== end) {
        lazyValues[2 * node] += val;
        lazyValues[2 * node + 1] += val;
      }

      addWalkthroughStep(
        `Node ${node} [${start}..${end}] fully inside update range [${l}..${r}]. Applied delta +${val} (new sum = ${treeValues[node]}) and set lazy tags on children.`,
        { [node]: "sorted" },
      );
      return;
    }

    const mid = Math.floor((start + end) / 2);
    addWalkthroughStep(
      `Node ${node} [${start}..${end}] partially overlaps update range [${l}..${r}]. Splitting update at mid = ${mid}.`,
      { [node]: "compare" },
    );

    updateRange(2 * node, start, mid, l, r, val);
    updateRange(2 * node + 1, mid + 1, end, l, r, val);

    treeValues[node] = treeValues[2 * node] + treeValues[2 * node + 1];

    addWalkthroughStep(
      `Recalculated node ${node} [${start}..${end}] aggregate sum after child updates: ${treeValues[node]}.`,
      { [node]: "active" },
    );
  };

  const queryRange = (node: number, start: number, end: number, l: number, r: number): number => {
    pushLazy(node, start, end);

    if (r < start || end < l) {
      addWalkthroughStep(
        `Node ${node} [${start}..${end}] outside query range [${l}..${r}]. Returning identity sum 0.`,
        { [node]: "visited" },
      );
      return 0;
    }

    if (l <= start && end <= r) {
      addWalkthroughStep(
        `Node ${node} [${start}..${end}] fully contained inside query range [${l}..${r}]. Returning cached sum ${treeValues[node]}.`,
        { [node]: "sorted" },
      );
      return treeValues[node];
    }

    const mid = Math.floor((start + end) / 2);
    addWalkthroughStep(
      `Node ${node} [${start}..${end}] partially overlaps query range [${l}..${r}]. Descending to left and right children.`,
      { [node]: "compare" },
    );

    const leftSum = queryRange(2 * node, start, mid, l, r);
    const rightSum = queryRange(2 * node + 1, mid + 1, end, l, r);
    const total = leftSum + rightSum;

    addWalkthroughStep(
      `Merged query responses at node ${node} [${start}..${end}]: left sum (${leftSum}) + right sum (${rightSum}) = ${total}.`,
      { [node]: "active" },
    );

    return total;
  };

  const ops = safeInput.operations ?? [];
  for (const op of ops) {
    if (op.type === "rangeQuery" && op.left !== undefined && op.right !== undefined) {
      addWalkthroughStep(`Starting range query for interval [${op.left}..${op.right}].`, {
        1: "active",
      });

      const rangeResult = queryRange(1, 0, n - 1, op.left, op.right);

      addWalkthroughStep(
        `Completed range query for interval [${op.left}..${op.right}], obtaining sum ${rangeResult}.`,
        { 1: "visited" },
      );
    } else if (
      op.type === "rangeUpdate" &&
      op.left !== undefined &&
      op.right !== undefined &&
      op.value !== undefined
    ) {
      addWalkthroughStep(
        `Starting range update: adding +${op.value} to all elements in range [${op.left}..${op.right}].`,
        { 1: "active" },
      );

      updateRange(1, 0, n - 1, op.left, op.right, op.value);

      addWalkthroughStep(
        `Finished range update for interval [${op.left}..${op.right}]. Updated root sum is now ${treeValues[1]}.`,
        { 1: "visited" },
      );
    }
  }

  const finalState: Record<number, ElementState> = {};
  activeNodeMap.forEach((_, nodeIdx) => {
    finalState[nodeIdx] = "sorted";
  });

  addWalkthroughStep(
    "All Segment Tree Lazy Propagation operations completed successfully. Range updates and range queries executed in O(log N) time per operation.",
    finalState,
  );

  return steps;
};
