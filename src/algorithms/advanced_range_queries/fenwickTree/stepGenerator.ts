import type { AlgorithmStep, ArrayElement } from "../../../types/dsa";

export interface FenwickTreeOperation {
  type: "update" | "query";
  index?: number;
  delta?: number;
  left?: number;
  right?: number;
}

export interface FenwickTreeInput {
  array: number[];
  operations?: FenwickTreeOperation[];
}

export const generateFenwickTreeSteps = (input?: FenwickTreeInput): AlgorithmStep[] => {
  const steps: AlgorithmStep[] = [];
  let stepIndex = 0;

  const rawArray = Array.isArray(input?.array) ? input.array : [3, 2, -1, 6, 5, 4, -3, 37];
  const n = rawArray.length;

  if (n === 0) {
    steps.push({
      stepIndex: 0,
      codeLine: 2,
      explanation: {
        what: "Checking input array length.",
        why: "An empty array contains no elements to build a Fenwick tree over.",
      },
      primarySnapshot: { kind: "array", elements: [] },
      auxiliaryState: { customState: { originalArray: "", treeArray: "" } },
      variables: { n: 0 },
    });
    return steps;
  }

  const tree = new Array<number>(n + 1).fill(0);

  const getElements = (
    highlightIdx?: number,
    highlightState: ArrayElement["state"] = "active",
    pointers?: Record<number, string[]>,
  ): ArrayElement[] => {
    const elements: ArrayElement[] = [];
    for (let i = 1; i <= n; i++) {
      let state: ArrayElement["state"] = "default";
      if (highlightIdx === i) {
        state = highlightState;
      }
      elements.push({
        id: `tree-${i}`,
        value: tree[i],
        state,
        pointers: pointers && pointers[i] ? pointers[i] : undefined,
      });
    }
    return elements;
  };

  const addStep = (
    codeLine: number,
    what: string,
    why: string,
    variables: Record<string, string | number | boolean>,
    elements: ArrayElement[],
  ) => {
    steps.push({
      stepIndex: stepIndex++,
      codeLine,
      explanation: { what, why },
      primarySnapshot: { kind: "array", elements },
      auxiliaryState: {
        customState: {
          originalArray: rawArray.join(", "),
          treeArray: tree.slice(1).join(", "),
        },
      },
      variables,
    });
  };

  const updateFenwick = (idx: number, delta: number) => {
    addStep(
      5,
      `Adding delta ${delta} at position ${idx}.`,
      `Ascending the Fenwick Tree via i += i & -i to update all responsibility blocks covering position ${idx}.`,
      { index: idx, delta },
      getElements(idx, "compare", { [idx]: ["idx"] }),
    );

    let i = idx;
    while (i <= n) {
      const lowbit = i & -i;
      tree[i] += delta;

      addStep(
        8,
        `Updated tree[${i}] to ${tree[i]} (lowbit = ${lowbit}).`,
        `Cell ${i} covers position ${idx}. Adding lowbit ${lowbit} advances to the next parent block at index ${i + lowbit}.`,
        { i, lowbit, delta, "tree[i]": tree[i] },
        getElements(i, "swap", { [i]: ["updated"] }),
      );

      i += lowbit;
    }
  };

  const queryFenwick = (idx: number): number => {
    let sum = 0;
    let i = idx;

    addStep(
      11,
      `Querying prefix sum up to index ${idx}.`,
      `Descending the Fenwick Tree via i -= i & -i to accumulate non-overlapping subsegment sums.`,
      { index: idx, sum },
      getElements(idx, "compare", { [idx]: ["idx"] }),
    );

    while (i > 0) {
      const lowbit = i & -i;
      sum += tree[i];

      addStep(
        15,
        `Adding block sum tree[${i}] = ${tree[i]} to running total (new sum = ${sum}).`,
        `Cell ${i} stores subsegment sum ending at index ${i}. Stripping lowbit ${lowbit} jumps to the preceding block at index ${i - lowbit}.`,
        { i, lowbit, "tree[i]": tree[i], sum },
        getElements(i, "active", { [i]: ["contrib"] }),
      );

      i -= lowbit;
    }

    return sum;
  };

  addStep(
    3,
    `Initializing empty Fenwick Tree of size ${n}.`,
    `Allocated ${n + 1} cells (slot 0 unused). Input elements will be incorporated via point updates.`,
    { n },
    getElements(),
  );

  for (let i = 0; i < n; i++) {
    const val = rawArray[i];
    if (val !== 0) {
      updateFenwick(i + 1, val);
    }
  }

  addStep(
    3,
    "Completed Fenwick Tree construction.",
    `All elements from [${rawArray.join(", ")}] have been folded into their corresponding responsibility blocks.`,
    { n },
    getElements(),
  );

  const defaultOps: FenwickTreeOperation[] = [
    { type: "query", left: 1, right: 5 },
    { type: "update", index: 3, delta: 5 },
    { type: "query", left: 1, right: 5 },
  ];
  const ops = Array.isArray(input?.operations) ? input.operations : defaultOps;
  for (const op of ops) {
    if (op.type === "update" && op.index !== undefined && op.delta !== undefined) {
      addStep(
        5,
        `Executing point update at index ${op.index} with delta ${op.delta}.`,
        `Propagating delta ${op.delta} upward through covering responsibility cells in O(log N) time.`,
        { op: "update", index: op.index, delta: op.delta },
        getElements(op.index, "compare", { [op.index]: ["update"] }),
      );
      updateFenwick(op.index, op.delta);
    } else if (op.type === "query" && op.left !== undefined && op.right !== undefined) {
      addStep(
        19,
        `Evaluating range query [${op.left}..${op.right}].`,
        `Computing range sum as prefixQuery(${op.right}) - prefixQuery(${op.left - 1}) cancels out elements prior to index ${op.left}.`,
        { op: "query", left: op.left, right: op.right },
        getElements(),
      );

      const sumRight = queryFenwick(op.right);
      const sumLeftMinus1 = op.left > 1 ? queryFenwick(op.left - 1) : 0;
      const rangeSum = sumRight - sumLeftMinus1;

      addStep(
        20,
        `Range query [${op.left}..${op.right}] equals ${rangeSum}.`,
        `Subtracting prefix sums yields window total: ${sumRight} - ${sumLeftMinus1} = ${rangeSum}.`,
        { left: op.left, right: op.right, sumRight, sumLeftMinus1, rangeSum },
        getElements(),
      );
    }
  }

  addStep(
    20,
    "All operations completed.",
    "Fenwick tree operations executed in O(log N) time per query/update.",
    { n },
    getElements(),
  );

  return steps;
};
