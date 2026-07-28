import type { AlgorithmStep, ElementState, TreeNodeItem } from "../../../types/dsa";
import type { SegmentTreeLazyInput, InternalNode } from "./types";

export const generateSegmentTreeLazySteps = (input: SegmentTreeLazyInput): AlgorithmStep[] => {
  const steps: AlgorithmStep[] = [];
  let stepIndex = 0;

  const n = input.array.length;

  if (n === 0) {
    steps.push({
      stepIndex: 0,
      codeLine: 1,
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
        array: input.array.join(", "),
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
    "Set up the tree and lazy arrays",
    `We allocate 4 x ${n} = ${maxTreeNodes} slots for interval sums plus a parallel lazy array; the lazy tags will let us postpone range updates instead of touching every element right away.`,
    { n },
  );

  const buildTree = (node: number, start: number, end: number) => {
    addStep(
      8,
      `Visit node ${node} for range [${start}..${end}]`,
      start === end
        ? `This interval is down to a single element, so node ${node} becomes a leaf holding arr[${start}] = ${input.array[start]}.`
        : `This interval still spans several elements, so we split it in half and build both children before this node can know its sum.`,
      { node, start, end },
      { [node]: "compare" },
    );

    if (start === end) {
      treeValues[node] = input.array[start];
      addStep(
        10,
        `Store ${treeValues[node]} in leaf ${node}`,
        `This leaf now answers exactly index ${start}; its lazy slot stays 0 because leaves have no children to defer work to.`,
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
      `Sum the children into node ${node}`,
      `With both halves built, node ${node} caches ${treeValues[2 * node]} + ${treeValues[2 * node + 1]} = ${treeValues[node]} for range [${start}..${end}].`,
      { node, start, end, val: treeValues[node] },
      { [node]: "active", [2 * node]: "sorted", [2 * node + 1]: "sorted" },
    );
  };

  buildTree(1, 0, n - 1);

  addStep(
    15,
    "Finish building the tree",
    `The root holds the full sum ${treeValues[1]}, and every lazy tag starts at 0 — no work is pending anywhere yet.`,
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
        `Push lazy tag ${val} down from node ${node}`,
        `Before working below node ${node} we settle its deferred update: the left child's sum grows by ${val * leftCount} and the right child's by ${val * rightCount}, each inheriting the tag for its own children, and lazy[${node}] resets to 0.`,
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
        `Skip node ${node} — outside update range`,
        `Its range [${start}..${end}] doesn't touch [${l}..${r}], so nothing in this branch needs to change.`,
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
        `Apply the update lazily at node ${node}`,
        `Its whole range [${start}..${end}] is being increased, so we bump this sum by ${count} x ${val} = ${addTotal} and ${
          start !== end
            ? `park lazy[${node}] = ${lazyValues[node]} for the children to pick up later — we never descend further`
            : "since this is a leaf there are no children to notify"
        }.`,
        { node, start, end, count, val, newSum: treeValues[node], lazyVal: lazyValues[node] },
        { [node]: "sorted" },
        `Range Update [${l}..${r}] += ${val}`,
      );
      return;
    }

    const mid = Math.floor((start + end) / 2);
    addStep(
      39,
      `Split the update at node ${node}`,
      `Only part of [${start}..${end}] falls inside [${l}..${r}], so we recurse into the left half [${start}..${mid}] and the right half [${mid + 1}..${end}] and let each handle its own overlap.`,
      { node, start, end, l, r, mid },
      { [node]: "compare" },
      `Range Update [${l}..${r}] += ${val}`,
    );

    updateRange(2 * node, start, mid, l, r, val);
    updateRange(2 * node + 1, mid + 1, end, l, r, val);

    treeValues[node] = treeValues[2 * node] + treeValues[2 * node + 1];

    addStep(
      42,
      `Refresh node ${node}'s sum to ${treeValues[node]}`,
      `With both children settled we recombine ${treeValues[2 * node]} + ${treeValues[2 * node + 1]} so this node's cached sum stays honest.`,
      { node, start, end, newSum: treeValues[node] },
      { [node]: "active" },
      `Range Update [${l}..${r}] += ${val}`,
    );
  };

  const queryRange = (node: number, start: number, end: number, l: number, r: number): number => {
    if (r < start || end < l) {
      addStep(
        45,
        `Skip node ${node} — no overlap`,
        `Its range [${start}..${end}] lies entirely outside the query [${l}..${r}], so this branch contributes 0.`,
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
        `Take node ${node}'s sum ${treeValues[node]}`,
        `Its whole range [${start}..${end}] sits inside the query [${l}..${r}], and any pending tags above it were already pushed down on the way here, so the cached sum ${treeValues[node]} is up to date.`,
        { node, start, end, l, r, sum: treeValues[node] },
        { [node]: "sorted" },
        `Range Query [${l}..${r}]`,
      );
      return treeValues[node];
    }

    const mid = Math.floor((start + end) / 2);
    addStep(
      54,
      `Split the query at node ${node}`,
      `The target [${l}..${r}] only partially covers [${start}..${end}], so we ask the left child about [${start}..${mid}] and the right child about [${mid + 1}..${end}].`,
      { node, start, end, l, r, mid },
      { [node]: "compare" },
      `Range Query [${l}..${r}]`,
    );

    const leftSum = queryRange(2 * node, start, mid, l, r);
    const rightSum = queryRange(2 * node + 1, mid + 1, end, l, r);
    const result = leftSum + rightSum;

    addStep(
      57,
      `Combine partial sums at node ${node}`,
      `The left branch reported ${leftSum} and the right branch reported ${rightSum}, so this subtree contributes ${result} to the query.`,
      { node, start, end, leftSum, rightSum, result },
      { [node]: "active" },
      `Range Query [${l}..${r}]`,
    );

    return result;
  };

  const ops = input.operations ?? [];
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
