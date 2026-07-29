import type { AlgorithmStep, ArrayElement, PrimaryVisualSnapshot } from "../../../types/dsa";
import { createTutorialStep } from "../../../learning/authoring/tutorialSteps";

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

const createIntroSnapshots = (): Array<{
  narrative: string;
  primarySnapshot: PrimaryVisualSnapshot;
}> => [
  {
    narrative:
      "Maintaining running prefix sums over a dynamic array where values change frequently requires balancing query speed against update overhead.",
    primarySnapshot: {
      kind: "array",
      name: "rawArray",
      elements: [
        { id: "e1", value: 3, state: "default" },
        { id: "e2", value: 2, state: "default" },
        { id: "e3", value: -1, state: "default" },
        { id: "e4", value: 6, state: "default" },
        { id: "e5", value: 5, state: "default" },
      ],
    },
  },
  {
    narrative:
      "A raw array allows instant O(1) point updates, but computing any range sum requires inspecting up to N elements in O(N) linear time.",
    primarySnapshot: {
      kind: "array",
      name: "rawArray",
      elements: [
        { id: "e1", value: 3, state: "active" },
        { id: "e2", value: 2, state: "active" },
        { id: "e3", value: -1, state: "active" },
        { id: "e4", value: 6, state: "active" },
        { id: "e5", value: 5, state: "active" },
      ],
    },
  },
  {
    narrative:
      "A static prefix sum array turns range queries into an instant O(1) subtraction, but modifying a single element forces updating all trailing prefix cells in O(N) time.",
    primarySnapshot: {
      kind: "array",
      name: "prefixSum",
      elements: [
        { id: "p1", value: 3, state: "visited" },
        { id: "p2", value: 5, state: "visited" },
        { id: "p3", value: 4, state: "visited" },
        { id: "p4", value: 10, state: "visited" },
        { id: "p5", value: 15, state: "visited" },
      ],
    },
  },
  {
    narrative:
      "The Fenwick Tree (or Binary Indexed Tree) breaks this bottleneck by achieving O(log N) performance for both queries and updates using only an O(N) flat array.",
    primarySnapshot: {
      kind: "array",
      name: "fenwickTree",
      elements: [
        { id: "t1", value: 3, label: "len 1", state: "default" },
        { id: "t2", value: 5, label: "len 2", state: "default" },
        { id: "t3", value: -1, label: "len 1", state: "default" },
        { id: "t4", value: 10, label: "len 4", state: "default" },
        { id: "t5", value: 5, label: "len 1", state: "default" },
      ],
    },
  },
  {
    narrative:
      "Each 1-based cell tree[i] stores the sum of a subsegment of length lowbit(i) = i & -i ending at index i.",
    primarySnapshot: {
      kind: "array",
      name: "fenwickTree",
      elements: [
        { id: "t1", value: 3, label: "i=1 (lowbit 1)", state: "active" },
        { id: "t2", value: 5, label: "i=2 (lowbit 2)", state: "active" },
        { id: "t3", value: -1, label: "i=3 (lowbit 1)", state: "default" },
        { id: "t4", value: 10, label: "i=4 (lowbit 4)", state: "default" },
        { id: "t5", value: 5, label: "i=5 (lowbit 1)", state: "default" },
      ],
    },
  },
  {
    narrative:
      "The bitwise lowbit expression i & -i isolates the value of the least significant 1-bit in index i using two's complement representation.",
    primarySnapshot: {
      kind: "array",
      name: "fenwickTree",
      elements: [
        { id: "t1", value: 3, label: "1 (001)", state: "default" },
        { id: "t2", value: 5, label: "2 (010)", state: "default" },
        { id: "t3", value: -1, label: "3 (011)", state: "active" },
        { id: "t4", value: 10, label: "4 (100)", state: "active" },
        { id: "t5", value: 5, label: "5 (101)", state: "default" },
      ],
    },
  },
  {
    narrative:
      "To query a prefix sum up to index K, we sum tree[K] and repeatedly step backward by subtracting lowbit(i) until i becomes zero.",
    primarySnapshot: {
      kind: "array",
      name: "fenwickTree",
      elements: [
        { id: "t1", value: 3, label: "step 3", state: "visited" },
        { id: "t2", value: 5, label: "step 2", state: "visited" },
        { id: "t3", value: -1, label: "skip", state: "default" },
        { id: "t4", value: 10, label: "step 1", state: "active" },
        { id: "t5", value: 5, label: "start", state: "active" },
      ],
    },
  },
  {
    narrative:
      "To perform a point update at index K, we add the delta to tree[K] and ascend to covering parent blocks by repeatedly adding lowbit(i).",
    primarySnapshot: {
      kind: "array",
      name: "fenwickTree",
      elements: [
        { id: "t1", value: 3, label: "leaf", state: "default" },
        { id: "t2", value: 5, label: "update 2", state: "active" },
        { id: "t3", value: -1, label: "update 1", state: "active" },
        { id: "t4", value: 10, label: "update 3", state: "visited" },
        { id: "t5", value: 5, label: "unaffected", state: "default" },
      ],
    },
  },
  {
    narrative:
      "Because every integer less than N has at most O(log N) set bits, any update or prefix query traverses at most O(log N) array entries.",
    primarySnapshot: {
      kind: "array",
      name: "fenwickTree",
      elements: [
        { id: "t1", value: 3, label: "depth 1", state: "visited" },
        { id: "t2", value: 5, label: "depth 2", state: "visited" },
        { id: "t3", value: -1, label: "depth 2", state: "visited" },
        { id: "t4", value: 10, label: "depth 3", state: "visited" },
        { id: "t5", value: 5, label: "depth 1", state: "visited" },
      ],
    },
  },
  {
    narrative:
      "Arbitrary range sum queries over interval [L, R] are computed efficiently as prefix(R) minus prefix(L - 1).",
    primarySnapshot: {
      kind: "array",
      name: "fenwickTree",
      elements: [
        { id: "t1", value: 3, label: "prefix(L-1)", state: "compare" },
        { id: "t2", value: 5, label: "prefix(L-1)", state: "compare" },
        { id: "t3", value: -1, label: "range [L,R]", state: "active" },
        { id: "t4", value: 10, label: "range [L,R]", state: "active" },
        { id: "t5", value: 5, label: "range [L,R]", state: "active" },
      ],
    },
  },
];

export const generateFenwickTreeSteps = (input?: FenwickTreeInput): AlgorithmStep[] => {
  const steps: AlgorithmStep[] = [];
  let stepIndex = 0;

  const rawArray = Array.isArray(input?.array) ? input.array : [3, 2, -1, 6, 5, 4, -3, 37];
  const n = rawArray.length;

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

  if (n === 0) {
    steps.push(
      createTutorialStep({
        stepIndex: stepIndex++,
        phase: "walkthrough",
        narrative: "The input array is empty, so no Fenwick Tree can be constructed.",
        primarySnapshot: { kind: "array", name: "tree", elements: [] },
      }),
    );
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
        label: `[${i}]`,
        state,
        pointers: pointers && pointers[i] ? pointers[i] : undefined,
      });
    }
    return elements;
  };

  const addWalkthroughStep = (narrative: string, elements: ArrayElement[]) => {
    steps.push(
      createTutorialStep({
        stepIndex: stepIndex++,
        phase: "walkthrough",
        narrative,
        primarySnapshot: { kind: "array", name: "fenwickTree", elements },
      }),
    );
  };

  addWalkthroughStep(
    `We initialize an empty Fenwick Tree of size ${n} with zeroed responsibility cells.`,
    getElements(),
  );

  const updateFenwick = (idx: number, delta: number) => {
    addWalkthroughStep(
      `Starting point update at index ${idx} with delta ${delta}.`,
      getElements(idx, "compare", { [idx]: ["idx"] }),
    );

    let i = idx;
    while (i <= n) {
      const lowbit = i & -i;
      tree[i] += delta;

      addWalkthroughStep(
        `Added delta ${delta} to tree[${i}], updating its value to ${tree[i]}. Lowbit ${lowbit} directs the next hop to index ${i + lowbit}.`,
        getElements(i, "swap", { [i]: [`+${delta}`] }),
      );

      i += lowbit;
    }
  };

  const queryFenwick = (idx: number): number => {
    let sum = 0;
    let i = idx;

    addWalkthroughStep(
      `Querying prefix sum up to index ${idx} by traversing covering blocks backward.`,
      getElements(idx, "compare", { [idx]: ["queryEnd"] }),
    );

    while (i > 0) {
      const lowbit = i & -i;
      sum += tree[i];

      addWalkthroughStep(
        `Added block sum tree[${i}] (${tree[i]}) to running prefix total (accumulated sum = ${sum}). Subtracting lowbit ${lowbit} jumps to index ${i - lowbit}.`,
        getElements(i, "active", { [i]: [`sum=${sum}`] }),
      );

      i -= lowbit;
    }

    return sum;
  };

  for (let i = 0; i < n; i++) {
    const val = rawArray[i];
    if (val !== 0) {
      updateFenwick(i + 1, val);
    }
  }

  addWalkthroughStep(
    `Constructed the Fenwick Tree over initial elements [${rawArray.join(", ")}].`,
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
      updateFenwick(op.index, op.delta);
    } else if (op.type === "query" && op.left !== undefined && op.right !== undefined) {
      const sumRight = queryFenwick(op.right);
      const sumLeftMinus1 = op.left > 1 ? queryFenwick(op.left - 1) : 0;
      const rangeSum = sumRight - sumLeftMinus1;

      addWalkthroughStep(
        `Completed range query [${op.left}..${op.right}]: prefix(${op.right}) [${sumRight}] minus prefix(${op.left - 1}) [${sumLeftMinus1}] yields ${rangeSum}.`,
        getElements(),
      );
    }
  }

  const finalElements = getElements().map((el) => ({ ...el, state: "visited" as const }));
  addWalkthroughStep(
    `All operations completed successfully. The Fenwick Tree maintains exact subsegment totals in logarithmic time.`,
    finalElements,
  );

  return steps;
};
