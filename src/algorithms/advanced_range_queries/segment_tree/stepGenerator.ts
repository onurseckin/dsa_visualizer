import type { AlgorithmStep, ElementState, TreeNodeItem } from "../../../types/dsa";
import type { SegmentTreeInput, InternalNode } from "./types";

export const generateSegmentTreeSteps = (input: SegmentTreeInput): AlgorithmStep[] => {
  const steps: AlgorithmStep[] = [];
  let stepIndex = 0;

  const n = input.array.length;

  if (n === 0) {
    steps.push({
      stepIndex: 0,
      codeLine: 2,
      explanation: {
        what: "Check the input array",
        why: "The input array is empty, so there is no tree to build — we stop here.",
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
          originalArray: input.array.join(", "),
        },
      },
      variables,
    });
  };

  addStep(
    5,
    `Set up a tree for ${n} elements`,
    `We are going to cover [${input.array.join(", ")}] with nested intervals: leaves hold single elements, and every parent stores the sum of its two children.`,
    { n },
  );

  const buildTree = (node: number, start: number, end: number) => {
    addStep(
      7,
      `Visit node ${node} for range [${start}..${end}]`,
      start === end
        ? `This interval is down to a single element, so node ${node} becomes a leaf holding arr[${start}] = ${input.array[start]}.`
        : `This interval still spans several elements, so we split it in half and build the two children before we can know this node's sum.`,
      { node, start, end },
      { [node]: "compare" },
    );

    if (start === end) {
      treeValues[node] = input.array[start];
      addStep(
        9,
        `Store ${treeValues[node]} in leaf ${node}`,
        `This leaf now answers any query that needs exactly index ${start} — its value never has to be recomputed.`,
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
      `Sum the children into node ${node}`,
      `With both halves built, node ${node} caches ${treeValues[2 * node]} + ${treeValues[2 * node + 1]} = ${treeValues[node]} for range [${start}..${end}], so future queries can grab this whole interval in one lookup.`,
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
    "Finish building the tree",
    `The root now caches the full-array sum ${treeValues[1]}, and every interval below it is precomputed and ready to serve queries.`,
    { totalSum: treeValues[1] },
  );

  const queryTree = (node: number, start: number, end: number, l: number, r: number): number => {
    if (r < start || end < l) {
      addStep(
        29,
        `Skip node ${node} — no overlap`,
        `Its range [${start}..${end}] lies entirely outside our target [${l}..${r}], so this branch contributes 0 and we never descend into it.`,
        { node, start, end, l, r },
        { [node]: "visited" },
      );
      return 0;
    }

    if (l <= start && end <= r) {
      addStep(
        31,
        `Take node ${node}'s cached sum ${treeValues[node]}`,
        `Its whole range [${start}..${end}] sits inside our target [${l}..${r}], so we use the precomputed sum without visiting a single child — this pruning is what keeps queries fast.`,
        { node, start, end, l, r, val: treeValues[node] },
        { [node]: "sorted" },
      );
      return treeValues[node];
    }

    const mid = Math.floor((start + end) / 2);

    addStep(
      32,
      `Split the query at node ${node}`,
      `Our target [${l}..${r}] covers only part of [${start}..${end}], so we ask the left child about [${start}..${mid}] and the right child about [${mid + 1}..${end}].`,
      { node, start, end, l, r, mid },
      { [node]: "compare" },
    );

    const leftSum = queryTree(2 * node, start, mid, l, r);
    const rightSum = queryTree(2 * node + 1, mid + 1, end, l, r);
    const result = leftSum + rightSum;

    addStep(
      35,
      `Combine partial sums at node ${node}`,
      `The left branch reported ${leftSum} and the right branch reported ${rightSum}, so this subtree's answer for the query is ${result}.`,
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
        `Overwrite leaf ${node} with ${val}`,
        `We reached the leaf for index ${idx} and replace ${oldVal} with ${val}; now we walk back up, refreshing each ancestor's cached sum.`,
        { node, idx, oldVal, val },
        { [node]: "swap" },
      );
      return;
    }

    const mid = Math.floor((start + end) / 2);
    addStep(
      21,
      `Descend through node ${node}`,
      idx <= mid
        ? `Index ${idx} falls in the left half [${start}..${mid}], so only the left child needs to change — the right subtree stays untouched.`
        : `Index ${idx} falls in the right half [${mid + 1}..${end}], so only the right child needs to change — the left subtree stays untouched.`,
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
      `Refresh node ${node}'s sum to ${treeValues[node]}`,
      `One of its children just changed, so we recompute the cached sum for [${start}..${end}] to keep every interval on this path consistent.`,
      { node, start, end, val: treeValues[node] },
      { [node]: "active" },
    );
  };

  const ops = input.operations ?? [];
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
