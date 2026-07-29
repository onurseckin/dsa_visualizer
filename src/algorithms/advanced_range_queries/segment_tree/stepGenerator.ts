import type { AlgorithmStep, ElementState, TreeNodeItem } from "../../../types/dsa";
import type { SegmentTreeInput, InternalNode } from "./types";
import { DEFAULT_SEGMENT_TREE_INPUT } from "./types";

export const generateSegmentTreeSteps = (input?: SegmentTreeInput): AlgorithmStep[] => {
  const steps: AlgorithmStep[] = [];
  let stepIndex = 0;

  const safeInput = input ?? DEFAULT_SEGMENT_TREE_INPUT;
  const rawArray = Array.isArray(safeInput?.array)
    ? safeInput.array
    : DEFAULT_SEGMENT_TREE_INPUT.array;
  const n = rawArray.length;

  if (n === 0) {
    steps.push({
      stepIndex: 0,
      codeLine: 2,
      explanation: {
        what: "Checking input array length.",
        why: "The input array is empty, so there is no tree structure to build.",
      },
      primarySnapshot: {
        kind: "tree",
        nodes: [],
      },
      auxiliaryState: {},
      variables: { n: 0 },
    });
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

  const addStep = (
    codeLine: number,
    what: string,
    why: string,
    variables: Record<string, string | number | boolean>,
    stateMap?: Record<number, ElementState>,
  ) => {
    steps.push({
      stepIndex: stepIndex++,
      codeLine,
      explanation: { what, why },
      primarySnapshot: {
        kind: "tree",
        nodes: getTreeSnapshot(stateMap),
        rootId: "node-1",
      },
      auxiliaryState: {
        customState: {
          originalArray: rawArray.join(", "),
        },
      },
      variables,
    });
  };

  addStep(
    5,
    `Initializing Segment Tree for array of ${n} elements.`,
    `The tree partitions [${rawArray.join(", ")}] into a binary interval hierarchy where leaves store individual elements and internal nodes cache range sums.`,
    { n },
  );

  const buildTree = (node: number, start: number, end: number) => {
    addStep(
      7,
      `Visiting node ${node} for interval [${start}..${end}].`,
      start === end
        ? `Single-element range reached leaf node holding arr[${start}] = ${rawArray[start]}.`
        : `Multi-element interval requires splitting at mid = Math.floor((${start} + ${end}) / 2) to build left and right subtrees first.`,
      { node, start, end },
      { [node]: "compare" },
    );

    if (start === end) {
      treeValues[node] = rawArray[start];
      addStep(
        9,
        `Stored ${treeValues[node]} in leaf node ${node}.`,
        `Leaf ${node} directly serves point queries for index ${start} without further recursive calls.`,
        { node, start, end, val: treeValues[node] },
        { [node]: "sorted" },
      );
      return;
    }

    const mid = Math.floor((start + end) / 2);
    buildTree(2 * node, start, mid);
    buildTree(2 * node + 1, mid + 1, end);

    treeValues[node] = treeValues[2 * node] + treeValues[2 * node + 1];

    addStep(
      14,
      `Merging child aggregates into node ${node}: ${treeValues[2 * node]} + ${treeValues[2 * node + 1]} = ${treeValues[node]}.`,
      `Node ${node} caches the combined sum for interval [${start}..${end}], enabling O(1) query pruning for this range.`,
      {
        node,
        start,
        end,
        leftVal: treeValues[2 * node],
        rightVal: treeValues[2 * node + 1],
        val: treeValues[node],
      },
      { [node]: "active", [2 * node]: "sorted", [2 * node + 1]: "sorted" },
    );
  };

  buildTree(1, 0, n - 1);

  addStep(
    14,
    "Completed Segment Tree construction.",
    `The root caches the total array sum ${treeValues[1]}, and all interval nodes are ready for logarithmic queries and point updates.`,
    { totalSum: treeValues[1] },
  );

  const queryTree = (node: number, start: number, end: number, l: number, r: number): number => {
    if (r < start || end < l) {
      addStep(
        29,
        `Skipping node ${node} — range [${start}..${end}] is disjoint from query [${l}..${r}].`,
        `Since [${start}..${end}] does not overlap [${l}..${r}], this branch returns identity sum 0 and prunes further traversal.`,
        { node, start, end, l, r },
        { [node]: "visited" },
      );
      return 0;
    }

    if (l <= start && end <= r) {
      addStep(
        31,
        `Taking cached sum ${treeValues[node]} from node ${node} (range [${start}..${end}] is fully inside [${l}..${r}]).`,
        `Complete interval coverage allows returning the precomputed aggregate immediately without descending into child nodes.`,
        { node, start, end, l, r, val: treeValues[node] },
        { [node]: "sorted" },
      );
      return treeValues[node];
    }

    const mid = Math.floor((start + end) / 2);

    addStep(
      32,
      `Splitting query at node ${node} (range [${start}..${end}] partially overlaps [${l}..${r}]).`,
      `Recursing into left child [${start}..${mid}] and right child [${mid + 1}..${end}] to collect partial contributions.`,
      { node, start, end, l, r, mid },
      { [node]: "compare" },
    );

    const leftSum = queryTree(2 * node, start, mid, l, r);
    const rightSum = queryTree(2 * node + 1, mid + 1, end, l, r);
    const result = leftSum + rightSum;

    addStep(
      35,
      `Combining child query results at node ${node}: ${leftSum} + ${rightSum} = ${result}.`,
      `Merging left branch sum ${leftSum} and right branch sum ${rightSum} yields total contribution for interval [${start}..${end}].`,
      { node, start, end, leftSum, rightSum, result },
      { [node]: "active" },
    );

    return result;
  };

  const updateTree = (node: number, start: number, end: number, idx: number, val: number) => {
    if (start === end) {
      const oldVal = treeValues[node];
      treeValues[node] = val;
      addStep(
        18,
        `Updating leaf node ${node} at index ${idx} to value ${val} (old value = ${oldVal}).`,
        `Target leaf mutated. Unwinding recursion will refresh cached sums for all parent ancestors.`,
        { node, idx, oldVal, val },
        { [node]: "swap" },
      );
      return;
    }

    const mid = Math.floor((start + end) / 2);
    addStep(
      21,
      `Navigating update for index ${idx} through node ${node} [${start}..${end}].`,
      idx <= mid
        ? `Index ${idx} is in the left half [${start}..${mid}], leaving the right subtree untouched.`
        : `Index ${idx} is in the right half [${mid + 1}..${end}], leaving the left subtree untouched.`,
      { node, start, end, idx, val },
      { [node]: "compare" },
    );

    if (idx <= mid) {
      updateTree(2 * node, start, mid, idx, val);
    } else {
      updateTree(2 * node + 1, mid + 1, end, idx, val);
    }

    treeValues[node] = treeValues[2 * node] + treeValues[2 * node + 1];

    addStep(
      25,
      `Refreshed node ${node}'s cached sum to ${treeValues[node]} for range [${start}..${end}].`,
      `Recomputed parent aggregate after child update to restore segment tree invariants.`,
      { node, start, end, val: treeValues[node] },
      { [node]: "active" },
    );
  };

  const ops = safeInput.operations ?? [];
  for (const op of ops) {
    if (op.type === "query" && op.left !== undefined && op.right !== undefined) {
      addStep(
        27,
        `Start query for range [${op.left}..${op.right}]`,
        `We walk down from the root, keeping only branches that overlap [${op.left}..${op.right}] and grabbing cached sums wherever a node's interval fits entirely inside.`,
        { op: "query", left: op.left, right: op.right },
      );

      const totalSum = queryTree(1, 0, n - 1, op.left, op.right);

      addStep(
        35,
        `Range query [${op.left}..${op.right}] equals ${totalSum}`,
        `Adding up the covered pieces gives ${totalSum} — and we touched only a handful of nodes instead of scanning the whole array.`,
        { left: op.left, right: op.right, totalSum },
      );
    } else if (op.type === "update" && op.index !== undefined && op.value !== undefined) {
      addStep(
        16,
        `Start update: set index ${op.index} to ${op.value}`,
        `We follow the single path from the root down to index ${op.index}'s leaf, then repair the cached sums on the way back up.`,
        { op: "update", index: op.index, value: op.value },
      );

      updateTree(1, 0, n - 1, op.index, op.value);

      addStep(
        25,
        `Finish update at index ${op.index}`,
        `Every ancestor on the path has been refreshed, and the root's total now reads ${treeValues[1]}.`,
        { index: op.index, newRootSum: treeValues[1] },
      );
    }
  }

  addStep(
    35,
    "All operations complete",
    "Every query and update touched only a root-to-leaf slice of the tree — that O(log n) path length is the whole point of the structure.",
    { rootSum: treeValues[1] },
  );

  return steps;
};
