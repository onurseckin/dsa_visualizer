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

export const generateFenwickTreeSteps = (input: FenwickTreeInput): AlgorithmStep[] => {
  const steps: AlgorithmStep[] = [];
  let stepIndex = 0;
  const n = input.array.length;

  if (n === 0) {
    steps.push({
      stepIndex: 0,
      codeLine: 2,
      explanation: {
        what: "Check the input array",
        why: "The input array is empty, so there is nothing to build — we stop right away.",
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
          originalArray: input.array.join(", "),
          treeArray: tree.slice(1).join(", "),
        },
      },
      variables,
    });
  };

  const updateFenwick = (idx: number, delta: number) => {
    addStep(
      5,
      `Add ${delta} at index ${idx}`,
      `We only need to touch the cells responsible for position ${idx}: starting here, we climb upward with i += i & -i, updating each range that covers it.`,
      { index: idx, delta },
      getElements(idx, "compare", { [idx]: ["idx"] }),
    );

    let i = idx;
    while (i <= n) {
      const lowbit = i & -i;
      tree[i] += delta;

      addStep(
        8,
        `Update tree[${i}] to ${tree[i]}`,
        `Cell ${i} covers a block that includes our position, so we add ${delta} to it. Its lowbit is ${lowbit}, which sends us up to the next responsible cell at ${i} + ${lowbit} = ${i + lowbit}.`,
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
      `Query the prefix sum up to ${idx}`,
      `We want the total of positions 1..${idx}, so we hop downward with i -= i & -i, collecting each cell's stored block sum along the way.`,
      { index: idx, sum },
      getElements(idx, "compare", { [idx]: ["idx"] }),
    );

    while (i > 0) {
      const lowbit = i & -i;
      sum += tree[i];

      addStep(
        15,
        `Add tree[${i}] = ${tree[i]} to the sum`,
        `Cell ${i} holds the sum of a block ending at position ${i}, so we fold it in and our running total becomes ${sum}. Stripping the lowbit ${lowbit} jumps us to the previous block at index ${i - lowbit}.`,
        { i, lowbit, "tree[i]": tree[i], sum },
        getElements(i, "active", { [i]: ["contrib"] }),
      );

      i -= lowbit;
    }

    return sum;
  };

  addStep(
    3,
    `Create an empty tree of size ${n}`,
    `We start with ${n + 1} zeroed cells (slot 0 stays unused) and will build the structure by feeding in each array value as a point update.`,
    { n },
    getElements(),
  );

  for (let i = 0; i < n; i++) {
    const val = input.array[i];
    if (val !== 0) {
      updateFenwick(i + 1, val);
    }
  }

  addStep(
    3,
    "Finish building the tree",
    `Every value from [${input.array.join(", ")}] has been folded in, so each cell now stores the sum of exactly the block it is responsible for.`,
    { n },
    getElements(),
  );

  const ops = input.operations ?? [];
  for (const op of ops) {
    if (op.type === "update" && op.index !== undefined && op.delta !== undefined) {
      addStep(
        5,
        `Run update at index ${op.index}`,
        `The operation asks us to add ${op.delta} at position ${op.index}, so we let the same upward climb ripple the change through every covering cell.`,
        { op: "update", index: op.index, delta: op.delta },
        getElements(op.index, "compare", { [op.index]: ["update"] }),
      );
      updateFenwick(op.index, op.delta);
    } else if (op.type === "query" && op.left !== undefined && op.right !== undefined) {
      addStep(
        19,
        `Run range query [${op.left}..${op.right}]`,
        `A Fenwick tree only knows prefix sums, so we compute the range as prefixQuery(${op.right}) minus prefixQuery(${op.left - 1}) — everything before position ${op.left} cancels out.`,
        { op: "query", left: op.left, right: op.right },
        getElements(),
      );

      const sumRight = queryFenwick(op.right);
      const sumLeftMinus1 = op.left > 1 ? queryFenwick(op.left - 1) : 0;
      const rangeSum = sumRight - sumLeftMinus1;

      addStep(
        20,
        `Range query [${op.left}..${op.right}] equals ${rangeSum}`,
        `Subtracting the two prefix sums leaves exactly our window: ${sumRight} - ${sumLeftMinus1} = ${rangeSum}.`,
        { left: op.left, right: op.right, sumRight, sumLeftMinus1, rangeSum },
        getElements(),
      );
    }
  }

  addStep(
    20,
    "All operations complete",
    "We handled every update and query with just a handful of bit-hops each — that O(log n) cost per operation is the whole appeal of the Fenwick tree.",
    { n },
    getElements(),
  );

  return steps;
};
