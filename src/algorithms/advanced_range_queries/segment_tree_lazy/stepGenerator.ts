import type { AlgorithmStep, ElementState, TreeNodeItem } from "../../../types/dsa";
import type { SegmentTreeLazyInput, InternalNode } from "./types";
import { DEFAULT_SEGMENT_TREE_LAZY_INPUT } from "./types";

export const generateSegmentTreeLazySteps = (input?: SegmentTreeLazyInput): AlgorithmStep[] => {
  const steps: AlgorithmStep[] = [];
  let stepIndex = 0;

  const safeInput = input ?? DEFAULT_SEGMENT_TREE_LAZY_INPUT;
  const rawArray = Array.isArray(safeInput?.array)
    ? safeInput.array
    : DEFAULT_SEGMENT_TREE_LAZY_INPUT.array;
  const n = rawArray.length;

  if (n === 0) {
    steps.push({
      stepIndex: 0,
      codeLine: 1,
      explanation: {
        what: "Checking input array length.",
        why: "The input array is empty, so there is no tree to build.",
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

  const getAuxiliaryState = (currentOp: string) => {
    const lazyTable: Record<string, string | number> = {};
    activeNodeMap.forEach((meta, nodeIdx) => {
      lazyTable[`Node ${nodeIdx} [${meta.start}..${meta.end}] Lazy`] = lazyValues[nodeIdx];
    });

    return {
      hashMap: lazyTable,
      customState: {
        operation: currentOp,
        array: rawArray.join(", "),
      },
    };
  };

  const addStep = (
    codeLine: number,
    what: string,
    why: string,
    variables: Record<string, string | number | boolean>,
    stateMap?: Record<number, ElementState>,
    currentOp: string = "Building",
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
      auxiliaryState: getAuxiliaryState(currentOp),
      variables,
    });
  };

  addStep(
    4,
    `Initializing Segment Tree with Lazy Propagation for ${n} elements.`,
    `Allocated 4N slots for interval sums alongside a parallel lazy tag array to defer range updates until needed.`,
    { n },
  );

  const buildTree = (node: number, start: number, end: number) => {
    addStep(
      8,
      `Visiting node ${node} for interval [${start}..${end}].`,
      start === end
        ? `Single-element range reached leaf node holding arr[${start}] = ${rawArray[start]}.`
        : `Multi-element interval requires splitting at mid = Math.floor((${start} + ${end}) / 2) to build subtrees first.`,
      { node, start, end },
      { [node]: "compare" },
    );

    if (start === end) {
      treeValues[node] = rawArray[start];
      addStep(
        10,
        `Stored ${treeValues[node]} in leaf node ${node}.`,
        `Leaf ${node} directly serves point queries for index ${start}; lazy slot remains 0.`,
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
      15,
      `Merging child sums into node ${node}: ${treeValues[2 * node]} + ${treeValues[2 * node + 1]} = ${treeValues[node]}.`,
      `Node ${node} caches interval sum for [${start}..${end}].`,
      { node, start, end, val: treeValues[node] },
      { [node]: "active", [2 * node]: "sorted", [2 * node + 1]: "sorted" },
    );
  };

  buildTree(1, 0, n - 1);

  addStep(
    15,
    "Completed Segment Tree construction.",
    `The root holds full-array sum ${treeValues[1]}, and all lazy tags are initialized to 0.`,
    { rootSum: treeValues[1] },
    undefined,
    "Build Complete",
  );

  const pushLazy = (node: number, start: number, end: number) => {
    if (lazyValues[node] !== 0 && start !== end) {
      const mid = Math.floor((start + end) / 2);
      const val = lazyValues[node];

      const leftNode = 2 * node;
      const rightNode = 2 * node + 1;
      const leftCount = mid - start + 1;
      const rightCount = end - mid;

      lazyValues[leftNode] += val;
      treeValues[leftNode] += val * leftCount;

      lazyValues[rightNode] += val;
      treeValues[rightNode] += val * rightCount;

      lazyValues[node] = 0;

      addStep(
        18,
        `Pushing pending lazy tag ${val} down from node ${node}.`,
        `Propagating deferred update: left child sum increases by ${val * leftCount} and right child by ${val * rightCount}, pushing tags to children and clearing parent debt.`,
        {
          node,
          val,
          leftNode,
          rightNode,
          newLeftSum: treeValues[leftNode],
          newRightSum: treeValues[rightNode],
        },
        { [node]: "active", [leftNode]: "swap", [rightNode]: "swap" },
        "Propagating Lazy Tag",
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
      addStep(
        30,
        `Skipping node ${node} (interval [${start}..${end}] is disjoint from update [${l}..${r}]).`,
        `Since [${start}..${end}] does not overlap [${l}..${r}], no modifications are needed in this branch.`,
        { node, start, end, l, r },
        { [node]: "visited" },
        `Range Update [${l}..${r}] += ${val}`,
      );
      return;
    }

    if (l <= start && end <= r) {
      const count = end - start + 1;
      const addTotal = count * val;
      treeValues[node] += addTotal;
      if (start !== end) {
        lazyValues[node] += val;
      }

      addStep(
        34,
        `Applying range update lazily at node ${node} (interval [${start}..${end}]).`,
        `Complete interval coverage allows updating node sum by ${count} * ${val} = ${addTotal} and storing pending lazy tag without descending further.`,
        { node, start, end, count, val, newSum: treeValues[node], lazyVal: lazyValues[node] },
        { [node]: "sorted" },
        `Range Update [${l}..${r}] += ${val}`,
      );
      return;
    }

    const mid = Math.floor((start + end) / 2);
    addStep(
      39,
      `Splitting range update at node ${node} (interval [${start}..${end}] partially overlaps [${l}..${r}]).`,
      `Recursing into left half [${start}..${mid}] and right half [${mid + 1}..${end}].`,
      { node, start, end, l, r, mid },
      { [node]: "compare" },
      `Range Update [${l}..${r}] += ${val}`,
    );

    updateRange(2 * node, start, mid, l, r, val);
    updateRange(2 * node + 1, mid + 1, end, l, r, val);

    treeValues[node] = treeValues[2 * node] + treeValues[2 * node + 1];

    addStep(
      42,
      `Refreshed node ${node}'s cached sum to ${treeValues[node]} for range [${start}..${end}].`,
      `Recomputed parent node sum after updating child subtrees.`,
      { node, start, end, newSum: treeValues[node] },
      { [node]: "active" },
      `Range Update [${l}..${r}] += ${val}`,
    );
  };

  const queryRange = (node: number, start: number, end: number, l: number, r: number): number => {
    if (r < start || end < l) {
      addStep(
        45,
        `Skipping node ${node} (interval [${start}..${end}] is disjoint from query [${l}..${r}]).`,
        `Non-overlapping interval returns identity sum 0.`,
        { node, start, end, l, r },
        { [node]: "visited" },
        `Range Query [${l}..${r}]`,
      );
      return 0;
    }

    pushLazy(node, start, end);

    if (l <= start && end <= r) {
      addStep(
        52,
        `Taking cached sum ${treeValues[node]} from node ${node} (range [${start}..${end}] is fully inside [${l}..${r}]).`,
        `Interval is completely covered and all pending lazy tags on the path have been flushed, returning up-to-date sum immediately.`,
        { node, start, end, l, r, sum: treeValues[node] },
        { [node]: "sorted" },
        `Range Query [${l}..${r}]`,
      );
      return treeValues[node];
    }

    const mid = Math.floor((start + end) / 2);
    addStep(
      54,
      `Splitting query at node ${node} (range [${start}..${end}] partially overlaps [${l}..${r}]).`,
      `Recursing into left child [${start}..${mid}] and right child [${mid + 1}..${end}] to collect partial contributions.`,
      { node, start, end, l, r, mid },
      { [node]: "compare" },
      `Range Query [${l}..${r}]`,
    );

    const leftSum = queryRange(2 * node, start, mid, l, r);
    const rightSum = queryRange(2 * node + 1, mid + 1, end, l, r);
    const result = leftSum + rightSum;

    addStep(
      57,
      `Combining partial sums at node ${node}: ${leftSum} + ${rightSum} = ${result}.`,
      `Merging left branch sum ${leftSum} and right branch sum ${rightSum} yields total contribution for range query.`,
      { node, start, end, leftSum, rightSum, result },
      { [node]: "active" },
      `Range Query [${l}..${r}]`,
    );

    return result;
  };

  const ops = safeInput.operations ?? [];
  for (const op of ops) {
    const isUpdate = op.type === "rangeUpdate" || op.type === "update";
    const isQuery = op.type === "rangeQuery" || op.type === "query";

    if (isUpdate) {
      const val = op.value ?? 1;
      addStep(
        26,
        `Start range update [${op.left}..${op.right}] += ${val}`,
        `Rather than visiting all ${op.right - op.left + 1} elements one by one, we descend only until an interval fits entirely inside the range and record the addition lazily there.`,
        { op: "rangeUpdate", left: op.left, right: op.right, value: val },
        undefined,
        `Range Update [${op.left}..${op.right}] += ${val}`,
      );

      updateRange(1, 0, n - 1, op.left, op.right, val);

      addStep(
        42,
        `Finish range update [${op.left}..${op.right}]`,
        `The additions are all accounted for — some applied directly, some parked in lazy tags — and the root's total now reads ${treeValues[1]}.`,
        { newRootSum: treeValues[1] },
        undefined,
        "Update Complete",
      );
    } else if (isQuery) {
      addStep(
        44,
        `Start range query [${op.left}..${op.right}]`,
        `We descend toward the covered intervals, pushing any pending lazy tags down as we pass so every sum we read is current.`,
        { op: "rangeQuery", left: op.left, right: op.right },
        undefined,
        `Range Query [${op.left}..${op.right}]`,
      );

      const totalSum = queryRange(1, 0, n - 1, op.left, op.right);

      addStep(
        57,
        `Range query [${op.left}..${op.right}] equals ${totalSum}`,
        `The covered intervals sum to ${totalSum}, and lazy work was only performed along the paths we actually walked.`,
        { left: op.left, right: op.right, totalSum },
        undefined,
        "Query Complete",
      );
    }
  }

  addStep(
    57,
    "All operations complete",
    "Every range update and query finished in O(log n) node visits — deferring work with lazy tags is what made whole-range updates that cheap.",
    { finalRootSum: treeValues[1] },
    undefined,
    "All Done",
  );

  return steps;
};
